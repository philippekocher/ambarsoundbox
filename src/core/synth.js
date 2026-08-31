import { createEditor } from '../components/editor.js'
import { AudioEngine } from '../audio/audioengine.js'
import { Model } from './model.js'
import { createToolbar } from '../components/toolbar.js'
import { createInfobox } from '../components/infobox.js'
import { dialogBox } from "../components/dialogBox.js"
import { L } from '../i18n/language.js'
import { storage } from '../utils/storage.js'
import { make } from '../utils/make.js'


export class Synth {
  constructor(isEmbedded = false) {
    this.model = new Model()
    this.audioEngine = new AudioEngine(isEmbedded)
    this.settings = {}
  }
  
  destroy() {
    this.model = null
    this.audioEngine.stopAudio()
    this.audioEngine = null
    if(window.synth == this) window.synth = null
  }
    
  render(container, appMessageHandler, state) {
    container.innerHTML = ''
    this.editor = createEditor(state?.view, this)
    this.editor.messageHandler = this.messageHandler    
    this.editor.render(container)
    
    // subpatch header
    this.subpatchHeader = make('div', { id: 'subpatchHeader', className: 'moduleHeader category_utility'}, [ 
      make('div', { html: 'Subpatch'})
    ])
    this.subpatchHeader.style = 'position: absolute; z-index: 99; top: -30px; width: calc(100% - 20px);'
    container.appendChild(this.subpatchHeader)

    const closeButton = make('button', {className: 'closeBtn'})
    closeButton.onpointerdown = e => {
      e.stopPropagation()
      this.messageHandler?.({action: 'showSubpatch', subpatchId: -1})
    }
    this.subpatchHeader.appendChild(closeButton)

    // toolbars  
    if(!this.settings.embedded) {
      createToolbar('navigation', { parent: this.editor.contentDIV, messageHandler: appMessageHandler })
    }
    else {
      createToolbar('reset', { parent: this.editor.contentDIV, messageHandler: this.messageHandler })    
    }
    if((this.settings.embedded && !['play','layout'].includes(state?.view) && this.settings.palette) || (!this.settings.embedded && state?.view === 'build')) {
      createToolbar('palette', { parent: this.editor.contentDIV, messageHandler: this.messageHandler })
    }    
    createToolbar('actions', { 
      parent: this.editor.contentDIV, 
      messageHandler: this.messageHandler, 
      showMenu: state?.view === 'build' || state?.view === 'layout'
    })
    
    if(state?.view != 'build') this.model.subpatchHierarchy = []

    // infobox
    if (state?.view === 'build') {
      if(storage.settings.get('infobox') === 'true')
        createInfobox(this.editor.contentDIV, appMessageHandler)
    }

    this.reloadFromMemory()
  }

  reloadFromMemory() {
    const moduleList = this.model.getAllModules()
    const subpatchId = this.model.subpatchHierarchy.at(-1)
    
    const topbar = this.editor.contentDIV.querySelector('#topbar')
    const topbarTop = getComputedStyle(this.editor.contentDIV.querySelector('#topbar')).getPropertyValue('--top')
    
     if(subpatchId == undefined) {
      this.editor.reloadFromMemory(moduleList)

      this.subpatchHeader.style.top = '-30px'
      topbar.style.top = topbarTop
      this.editor.editorDIV.style.top = '0px'
    }
    else {
      this.editor.reloadFromMemory(moduleList, subpatchId)
      
      this.subpatchHeader.style.top = '4px'
      topbar.style.top = parseInt(topbarTop) + 25 + 'px'
      this.editor.editorDIV.style.top = '25px'
      this.editor.editorDIV.style.height = 'calc(100% - 25px)'
     
      this.editor.editorDIV.scrollTop = 0;
      this.editor.editorDIV.scrollLeft = 0;
    }
     
    this.audioEngine.reloadFromMemory(this.model.getAllModules())
  }  

  delete(moduleIds, patchCords = []) {
    for(const patchCord of patchCords) patchCord.destroy(true)
    for(const id of moduleIds) this.model.deleteModule(id)
  }

  async copy(moduleIds) {
    const modules = this.model.getModules(moduleIds)
    if(modules.length > 0) {      
      const data = { modules: modules }
      storage.clipboard.set(data)
      await navigator.clipboard.writeText(JSON.stringify(data))
    }
    console.log(modules)
  }
  
  async paste() {
    let modules
    try {
      const data = await navigator.clipboard.readText()
      modules = JSON.parse(data).modules
    }
    catch {
      // clipboard unreadable or not valid JSON, fall back below
    }
    if(!modules) modules = storage.clipboard.get()?.modules
    if(!modules || modules.length === 0) return

    const minPosition = { x: Infinity, y: Infinity }
    modules.map(u => {
      minPosition.x = Math.min(minPosition.x, u.parameters.position.x)
      minPosition.y = Math.min(minPosition.y, u.parameters.position.y)
    })
    
    this.moveModules(modules, 100 - minPosition.x + this.editor.editorDIV.scrollLeft, 100 - minPosition.y + this.editor.editorDIV.scrollTop)
    this.insert(modules)
  }
  
  duplicate(moduleIds) {
    const modules = this.model.getModules(moduleIds)
    if(modules.length > 0) {
      const clones = JSON.parse(JSON.stringify(modules))
      this.moveModules(clones, 50, 100)
      this.insert(clones)
    }
  }   
  
  insert(modules) {    
    const subpatchId = this.model.subpatchHierarchy.at(-1)

    const idReplacements = {}
    const collectReplacementIds = (modules) => {
      for(const module of modules) {
        idReplacements[module.id] = this.model.getFreeModuleId()
        if(module.modules) collectReplacementIds(module.modules)
      }
    }
    collectReplacementIds(modules)
//      console.log(idReplacements)
    
    const replace = (modules, subpatchId) => {
      for(const module of modules) {
        // replace the id
        module.id = idReplacements[module.id]
        
        // replace the subpatch id
        module.subpatchId = subpatchId
        
        // replace src and dst of any plugs
        if(module.plugs) {
          for(const plug of module.plugs) {
            plug.srcId = idReplacements[plug.srcId]
            plug.dstId = idReplacements[plug.dstId]
          }
        }
        
        // recursion if the module is a subpatch and contains modules
        if(module.class === 'Subpatch' && module.modules) replace(module.modules, module.id)
        
        this.model.addModule(module)
      }
    }
    
    replace(modules, subpatchId)
    this.reloadFromMemory()
    
    // select the inserted modules
    modules.map(module => this.editor.selectModule(module.id))
  }
  
  moveModules(modules, x = 0, y = 0) {
    modules.map(module => {
      module.parameters.position.x = module.parameters.position.x + x
      module.parameters.position.y = module.parameters.position.y + y
      delete(module.parameters.gui_position)
    })  
  }
  
  async encapsulate(moduleIds) {
    if(moduleIds.size == 0) return
    
    const clones = JSON.parse(JSON.stringify(this.model.getModules(moduleIds)))
    const subpatchId = this.model.subpatchHierarchy.at(-1)

    // find the position of the topmost and leftmost module to encapsulate
    const minPosition = { x: Infinity, y: Infinity }
    clones.map(u => {
      minPosition.x = Math.min(minPosition.x, u.parameters.position.x)
      minPosition.y = Math.min(minPosition.y, u.parameters.position.y)
    })
    
    this.moveModules(clones, 200 - minPosition.x, 200 - minPosition.y)

    const maxPosition = { x: 0, y: 0 }
    clones.map(u => {
      // estimate the width of the object
      const numInlets = Object.keys(u.parameters).filter(k => k != 'position' && k != 'gui_position').length
      maxPosition.x = Math.max(maxPosition.x, u.parameters.position.x + numInlets * 80)
      //maxPosition.y = Math.max(maxPosition.y, u.parameters.position.y)
    })
    
    // find incoming and outgoing connections and organise them in groups
    const incoming = []
    const outgoing = []
    this.model.getAllModules().map(u => {
      u.plugs?.map(p => {
        if(!moduleIds.has(u.id) && moduleIds.has(p.dstId)) {
          p.srcId = u.id
          
          const srcTag = (`${p.srcId}_${p.srcPort}`)
          const dstTag = (`${p.dstId}_${p.dstPort}`)
          const group = incoming.find(i => {
            return i.src.size == 1 && i.src.has(srcTag) || i.dst.size == 1 && i.dst.has(dstTag)
          })
          if(group) {
            group.src.add(srcTag)
            group.dst.add(dstTag)
            group.plugs.push(p)
          }
          else incoming.push({src: new Set([srcTag]), dst: new Set([dstTag]), plugs: [p]})
        }
        else if(moduleIds.has(u.id) && !moduleIds.has(p.dstId)) {
          p.srcId = u.id
          
          const srcTag = (`${p.srcId}_${p.srcPort}`)
          const dstTag = (`${p.dstId}_${p.dstPort}`)
          const group = outgoing.find(i => {
            return i.src.size == 1 && i.src.has(srcTag) || i.dst.size == 1 && i.dst.has(dstTag)
          })
          if(group) {
            group.src.add(srcTag)
            group.dst.add(dstTag)
            group.plugs.push(p)
          }
          else outgoing.push({src: new Set([srcTag]), dst: new Set([dstTag]), plugs: [p]})
        }
      })
    })
//     console.log('incoming', incoming)
//     console.log('outgoing', outgoing)

  
    if(incoming.length > 5 || outgoing.length > 5) {
      await dialogBox.info(`${L.get('alert_tooManyConnectionsForEncapsulation', 5)}`)
      return
    }
    
    // create the subpatch
    const newId = this.model.getFreeModuleId()
    const inlet =  {
      id: this.model.getFreeModuleId(),
      class: 'Inlet',
      subpatchId: newId,
      parameters: { position: {x: 50, y: 100}}
    }
    if(incoming.length > 1) {
      for(let i=1; i<incoming.length; i++) inlet.parameters[i] = 0
    }
    const outlet = {id: this.model.getFreeModuleId(), class: 'Outlet', subpatchId: newId, parameters: { position: {x: maxPosition.x + 100, y: 100}}}
    if(outgoing.length > 1) {
      for(let i=1; i<outgoing.length; i++) outlet.parameters[i] = 0
    }
    const newSubpatch = {
      id: newId,
      class: 'Subpatch',
      modules: [inlet, outlet], 
      subpatchId: subpatchId,
      parameters: { position: minPosition }
    }
    
    // add the clones to the subpatch and delete the originals    
    this.delete(moduleIds) 
    clones.map(u => { u.subpatchId = newId; newSubpatch.modules.push(u)})
    
    // connect incoming connections
    incoming.map((inGroup, index) => {
      inGroup.plugs.map(inPlug => {
        const srcModule = this.model.getModule(inPlug.srcId)
        const existingPlug = srcModule.plugs.find(p => p.dstId == inPlug.dstId)
        
        // new plug (inlet to cloned dstModule)
        inlet.plugs ??= []
        inlet.plugs.push({srcPort: `${index}`, dstId: existingPlug.dstId, dstPort: existingPlug.dstPort })
        
        // adjust existing plug (srcModule to subpatch)
        if(srcModule.plugs.find(u => u.dstId == newId && u.dstPort == `${index}`)) {
          // duplicate port
          delete existingPlug.dstId
          delete existingPlug.dstPort
          delete existingPlug.srcPort
        }
        else {
          existingPlug.dstId = newId
          existingPlug.dstPort = `${index}`
        }
        delete existingPlug.srcId     
      })
    })
    
    // connect outgoing connections
    outgoing.map((outGroup, index) => {
      outGroup.plugs.map(outPlug => {
        const srcModule = clones.find(u => u.id === outPlug.srcId)
        const existingPlug = srcModule.plugs.find(p => p.dstId == outPlug.dstId)
        
        // new plug (subpatch to dstModule)
        newSubpatch.plugs ??= []
        newSubpatch.plugs.push({srcPort: `${index}`, dstId: outPlug.dstId, dstPort: outPlug.dstPort })
        
        // adjust existing plug (cloned srcModule to outlet)
        if(srcModule.plugs.find(u => u.dstId === outlet.id && u.dstPort === `${index}`)) {
          // duplicate port
          delete existingPlug.dstId
          delete existingPlug.dstPort
          delete existingPlug.srcPort
        }
        else {
          existingPlug.dstId = outlet.id
          existingPlug.dstPort = `${index}`
        }
        delete existingPlug.srcId
      })
    })
    
    this.model.addModule(newSubpatch)       
  }
  
/* ------------------------------------------------------------
    Message Handler
*/

  messageHandler = async (msg) => {
//      console.log("Synth messageHandler:\n", msg)
  
    this.model.handleMessage(msg)
    this.audioEngine.handleMessage(msg)
    
    switch(msg.action) {
      case 'load':
        break
        
      case 'reset':
        if(this.model.resetData) {
          this.reloadFromMemory()
        }
        break

      case 'showSubpatch':
        this.reloadFromMemory()
        break
        
      case 'undo':
        if(this.model.undo()) {
          this.reloadFromMemory()
        }
        break

      case 'redo':
        if(this.model.redo()) {
          this.reloadFromMemory()
        }
        break

      case 'delete':
        this.delete(this.editor.selectedModuleIds, this.editor.selectedPatchCords)
        this.reloadFromMemory()
        break
      
      case 'cut':
        this.copy(this.editor.selectedModuleIds)
        this.delete(this.editor.selectedModuleIds)
        this.reloadFromMemory()
        break

      case 'copy':
        this.copy(this.editor.selectedModuleIds)
        break
        
      case 'paste':
        this.paste()
        break
        
      case 'duplicate':
        this.duplicate(this.editor.selectedModuleIds)
        break

      case 'encapsulate':
        this.encapsulate(this.editor.selectedModuleIds)
        this.reloadFromMemory()
        break

      case 'toggleAudio':
        if(this.audioEngine.isRunning) {
          this.audioEngine.stopAudio()
        }
        else {
          await this.audioEngine.startAudio(this.model.getAllModules())
        }
        const state = {audio: this.audioEngine.isRunning, rec: false}
        msg.callback(state)
        break        
    }
  }
}