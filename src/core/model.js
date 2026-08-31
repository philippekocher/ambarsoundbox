import { saveAs } from 'file-saver'
import { L } from '../i18n/language.js'
import { storage } from '../utils/storage.js'


export class Model {
  constructor() {   
    this.patchName = ''
    this.modules = []    
    this.undoStack = []
    this.undoIdx = -1
    this.subpatchHierarchy = []
    this.usedIds = new Set()
    this.persistInWorkspace = false
  }
  
  load(data) {
    if(data === undefined) { 
      return
    }
    
    if(Array.isArray(data)) {
      // old format, only an array of modules
      this.modules = data
      this.meta = {}
    }
    else {
      this.modules = data.modules || data.units || []
      this.meta = data.meta || {}
    }
    this.patchName = this.meta.name

    this.usedIds = this.getUsedIds()

    this.subpatchHierarchy = []

    this.undoStack = []
    this.undoIdx = -1

    this.pushToUndoStack()
  }
  
  getModule(moduleId) {
    return this.getAllModules().find(module => module.id == moduleId)
  }
  
  getModules(moduleIdSet) {
    return this.getAllModules().filter(module => moduleIdSet.has(module.id))
  }
  
  getAllModules() {
    const allModules = []
    const collect = (modules, subpatchId) => {
      for(const module of modules) {      
        allModules.push(module)
        if(module.class === 'Subpatch' && (module.modules || module.units)) {
          collect(module.modules || module.units, module.id)
        }
      }
    }   
    collect(this.modules)
    return allModules
  }
  
  getUsedIds() {
    const ids = new Set()
    this.getAllModules().forEach(m => {
        ids.add(m.id)      
    })
    return ids
  }
  
  normalisePatch() {
    this.modules = this.modules.filter(u => u.class)
    const allModules = this.getAllModules()
    for(const module of allModules) {
      if(!module.class) console.error('no class for', module)
      if(!module.parameters) module.parameters = {}
      if(module.parameters.position?.x === undefined || module.parameters.position?.y === undefined) module.parameters.position = { x:0, y:0 }
      
      module.plugs = module.plugs?.filter(p => allModules.some(u => u.id === p.dstId))
    }
  }
  
  download() {
    const data = { meta: this.meta, modules: this.modules}
    let myFile = new File([JSON.stringify(data)], this.patchName+'.json', {type: 'application/json;charset=utf-8'})
    saveAs(myFile)
  }


  handleMessage(msg) {
//        console.log('model: handle msg', msg)
    switch(msg.action) {
      case 'getId':
        msg.callback(this.getFreeModuleId())
        break
      case 'new':
        this.newModule(msg)
        break
      case 'plug':
        this.plug(msg)
        break
      case 'unplug':
        this.unplug(msg)
        break
      case 'set':
        this.setData(msg.id, msg.data, msg.attributes, msg.undoable)
        break        
      case 'load':
        if(msg.data) {
          this.subpatchHierarchy = []
          this.load(msg.data)
          this.normalisePatch()
        }
        if(msg.resettable) this.resetData = JSON.parse(JSON.stringify(msg.data))
        else               this.resetData = undefined
        break
      case 'reset':
        if(this.resetData) {
          this.subpatchHierarchy = []
          this.load(JSON.parse(JSON.stringify(this.resetData)))
          this.normalisePatch()
        }
        break
      case 'showSubpatch':
        if(msg.subpatchId != undefined) {
          if(msg.subpatchId == -1)
            this.subpatchHierarchy.pop()
          else
            this.subpatchHierarchy.push(msg.subpatchId)
        }
        break
      case 'downloadPatch':
        this.download()
        break
    }
  }
  
  newModule(msg) {
    const newModule = {id: msg.id, class: msg.class}
    if(msg.subpatchId != undefined) {
      newModule.subpatchId = msg.subpatchId
    }
        
    if(newModule.class === 'Subpatch') {
      newModule.modules = [
        {id: this.getFreeModuleId(), class: 'Inlet', subpatchId: newModule.id, parameters: { position: {x: 10, y: 100}, staticModule: true}},
        {id: this.getFreeModuleId(), class: 'Outlet', subpatchId: newModule.id, parameters: { position: {x: 300, y: 100}, staticModule: true}}
      ]
    }
    
    this.addModule(newModule)
  }
  
  addModule(module) {
    if(module.subpatchId == undefined) {
      this.modules.push(module)
    }
    else {
      const subpatch = this.getAllModules().find(u => u.id === module.subpatchId)
      if(!subpatch) return
      if(!subpatch.modules) subpatch.modules = []
      subpatch.modules.push(module)
    }
    this.store()  
    this.usedIds.add(module.id)
  }
  
  getFreeModuleId() {
    let id = 0
    while (this.usedIds.has(id)) id++
    
    this.usedIds.add(id) // in case this method is called several times before new modules are added
    return id
  }

  deleteModule(moduleId) {
    const deleteFromCollection = (moduleCollection) => {
      for(const module of moduleCollection) {
        if(module.class === 'Subpatch' && module.modules) {
          module.modules = deleteFromCollection(module.modules)
        }
      }
      return moduleCollection.filter(u => (u.id != moduleId || u.parameters?.staticModule) && u.subpatchId != moduleId)
    }
    this.modules = deleteFromCollection(this.modules)
    this.store()
  }

  plug(msg) {
    this.getAllModules().forEach((module) => {
      if(module.id === msg.srcId) {
        if(!module.plugs) module.plugs = []
        module.plugs.push({srcPort: msg.srcPort, dstId: msg.dstId, dstPort: msg.dstPort })
      }
    })
    this.store()    
  }
  
  unplug(msg) {
    this.getAllModules().forEach((module) => {
      if(module.id === msg.srcId) {
         module.plugs = module.plugs?.filter((plug) => plug.dstId !== msg.dstId || plug.dstPort !== msg.dstPort || plug.srcPort !== msg.srcPort ) || []
      }
      return module
    })
    this.store()
  }
  
  setData(id, data, attributes, undoable) {
    this.getAllModules().forEach(module => {
      if(module.id === id) {
        if(!module.parameters) module.parameters = {}
        Object.assign(module.parameters, data)
        if(attributes) module.attributes = attributes
      }
      return module
    })
    if(undoable) this.store()
  }
  
  store() {    
    if(this.patchName) {
      this.meta = this.meta || {}
      this.meta.date = Date.now()
      if(this.persistInWorkspace) {
        storage.workspace.set(this.patchName, {meta: this.meta, modules: this.modules})
      }
    }

    window.clearTimeout(this.undoPushTimeout);
    this.undoPushTimeout = window.setTimeout(() => { this.pushToUndoStack() }, 100);
  }
  
  pushToUndoStack() {
    this.undoStack.splice(this.undoIdx + 1, this.undoStack.length)
    this.undoStack.push(JSON.stringify(this.modules))
    
    this.undoIdx = this.undoStack.length - 1
  }
  
  undo() {
    if(this.undoIdx < 1) return false
    
    this.undoIdx = this.undoIdx - 1
    this.modules = JSON.parse(this.undoStack[this.undoIdx])
    this.usedIds = this.getUsedIds()

    if(this.persistInWorkspace) {
      storage.workspace.set(this.patchName, {meta: this.meta, modules: this.modules})
    }
    
    // the currently open subpatcher doesn't exist anymore
    if(!this.getAllModules().some(u => u.id === this.subpatchHierarchy.at(-1)))
      this.subpatchHierarchy.pop()
              
    return true
   }

  redo() {
    if(this.undoIdx > this.undoStack.length - 2) return false
    
    this.undoIdx = this.undoIdx + 1
    this.modules = JSON.parse(this.undoStack[this.undoIdx])
    this.usedIds = this.getUsedIds()

    if(this.persistInWorkspace) {
      storage.workspace.set(this.patchName, {meta: this.meta, modules: this.modules})
    }
        
    return true    
 }  
}