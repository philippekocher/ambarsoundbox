import { infobox } from './infobox.js'
import { Comment } from "./commentModule.js"
import { Subpatch } from "./subpatchModule.js"
import { modules } from '../modules/modules.gen.js'
import { Module } from "./module.js"
import { PatchCord } from "../components/patchCord.js"
import { SelectionRectangle } from "../components/selectionRectangle.js"
import { L } from "../i18n/language.js"
import { storage } from '../utils/storage.js'


export function createEditor(mode, synth) {
  return new Editor(mode, synth)
}

class Editor {
	constructor(mode = 'build', synth) {
    this.synth = synth
		this.modules = new Map()
		this.selectedModuleIds = new Set()
		this.selectedPatchCords = []
		this.pointerStartPos = null
		this.dragVector = null
		this.patchCord = null
		this.magneticInlet = null
		this.messageHandler = null

    this.contentDIV = document.createElement('div')

		this.mode = mode // 'build', 'layout', 'play'
		if(mode === 'inline') this.mode = 'build'
		this.moduleWidth = 120;
		this.guiEditorTop = 76;		
	}
	
	render(parent) {
	  if(parent) parent.appendChild(this.contentDIV)
	  else {
      document.body.appendChild(this.contentDIV)
    }
    
    this.contentDIV.innerHTML = ''
    
    this.editorDIV = document.createElement('div')
    this.contentDIV.appendChild(this.editorDIV)
								
		this.editorDIVzoom = 1.0
		
		if(this.mode == 'build')
		  this.editorDIV.className = 'editor build'
		else if(this.mode == 'layout')
		  this.editorDIV.setAttribute('id', 'layoutEditor')
		else if(this.mode == 'play')
      this.editorDIV.setAttribute('id', 'playEditor')
		
  	this.editorSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
 		this.editorDIV.appendChild(this.editorSVG)

		this.selectionRectangle = new SelectionRectangle(this)
	
		window.onresize = this.resize.bind(this)
    
    this.editorDIV.onpointerdown  = this.onPointerDown.bind(this)
		this.editorDIV.onpointermove  = this.onPointerMove.bind(this)
		this.editorDIV.onpointerup    = this.onPointerUp.bind(this)
		this.editorDIV.onpointerleave = this.onPointerUp.bind(this)
		
		this.editorDIV.ondragover = e => { e.preventDefault() }
		this.editorDIV.ondrop = this.onDrop.bind(this)
	}

	resize() {
		let maxWidth = this.editorDIV.getBoundingClientRect().width
		let maxHeight = this.editorDIV.getBoundingClientRect().height
		for(const [id, module] of this.modules) {
			maxWidth = Math.max(maxWidth, module.parameters.position.x + module.moduleDIV.offsetWidth + 20)
			maxHeight = Math.max(maxHeight, module.parameters.position.y + module.moduleDIV.offsetHeight + 20)
		}
		this.editorSVG.setAttribute('width',  maxWidth)
		this.editorSVG.setAttribute('height', maxHeight)
		
		if(this.mode == 'layout') {
      const top = this.guiEditorTop - 6
      const pathSegments = []

      for (let i = 0; i < 100; i++) {
        pathSegments.push(`M0 ${i * this.moduleWidth + top} L${maxWidth} ${i * this.moduleWidth + top}`)
        pathSegments.push(`M${i * this.moduleWidth + 5} 0 L${i * this.moduleWidth + 5} ${maxHeight}`)
      }

      this.editorSVG.innerHTML = '<svg viewBox="0 0 '+maxWidth+' '+maxHeight+'"><path fill="none" stroke="white" stroke-width="1" stroke-dasharray="1,6" d="'+pathSegments.join(' ')+'"></path></svg>'
		}
	}
	
	clearAll() {
		this.modules = new Map()
		this.editorDIV.innerHTML = ''
	  this.editorSVG.innerHTML = ''
		this.editorDIV.appendChild(this.editorSVG)
		this.selectedModuleIds = new Set()
		this.selectedPatchCords = []
		infobox(this.contentDIV, null)
	}
	
	reloadFromMemory(moduleList, subpatchId) {
	  if(this.mode === 'play' || this.mode === 'layout') {
	    this.reloadFromMemoryGUI(moduleList)
	    return
	  }
    this.clearAll()
    this.subpatchId = subpatchId
        
		for(const module of moduleList) {
		  this.createModule(module.id, module.class, module.parameters, module.attributes, module.modules, module.subpatchId)
		}
		this.resize()
    requestAnimationFrame(() => {
      for(const module of moduleList) {
        if(module.plugs) {
          for(const plug of module.plugs) {
            const srcModule = this.editorDIV.querySelector(`#${CSS.escape(module.id)}`)
            const outlet = srcModule ? srcModule.querySelector(`.outlet[tag="${plug.srcPort}"]`) : null			
            const dstModule = this.editorDIV.querySelector(`#${CSS.escape(plug.dstId)}`)
            const inlet = dstModule ? dstModule.querySelector(`.ctrInlet[tag="${plug.dstPort}"]`) || dstModule.querySelector(`.inlet[tag="${plug.dstPort}"]`) : null
            if(!inlet || !outlet) continue
            const outRect = outlet.getBoundingClientRect()

            const inRect = inlet.getBoundingClientRect()
            const patchCord = new PatchCord(this)
            this.editorSVG.appendChild(patchCord.svgElement)
            patchCord.setSrc(this.modules.get(module.id), plug.srcPort)
            patchCord.setSrcPosition(this.getRelativePos((outRect.left + outRect.right) * 0.5, (outRect.top + outRect.bottom) * 0.5))
            patchCord.setDst(this.modules.get(plug.dstId), plug.dstPort)
            patchCord.setDstPosition(this.getRelativePos((inRect.left + inRect.right) * 0.5, (inRect.top + inRect.bottom) * 0.5))
          }
        }
      }
      for(const module of moduleList) {
        this.modules.get(module.id)?.update()
      }
    })
	}
	
	reloadFromMemoryGUI(moduleList) {
    this.clearAll()
    
    // collect gui modules
    
 		for(const module of moduleList) {
		  let gui_layout = modules[module.class].definition.gui_layout
		  if(module.attributes?.visibleInPlayView) gui_layout = { width: 2, height: 1}
		  
		  if(gui_layout) {
  		  const newModule = new Module(this, module.id, module.class, module.parameters, module.attributes)
  		  newModule.gui_layout = gui_layout
	      const controlsDisabled = this.mode == 'layout'
  		  newModule.initForGUI(this, controlsDisabled)
        this.modules.set(module.id, newModule)
      }
     	// instantiate all modules to execute their custom init function
 	    else if(module.class == 'Subpatch')
  		  new Subpatch(this, module.id, module.parameters, module.modules, module.attributes)
      else
        new Module(this, module.id, module.class, module.parameters, module.attributes)
   }
    
    // normalise positions
    
    for(const module of this.modules.values()) {
      if(module.parameters.gui_position) {
        const x = Math.round((module.parameters.gui_position.x) / this.moduleWidth)
        const y = Math.round((module.parameters.gui_position.y - this.guiEditorTop) / this.moduleWidth)

        if(module.parameters.gui_position.x != x * this.moduleWidth || module.parameters.gui_position.y != y * this.moduleWidth + this.guiEditorTop) {
          module.parameters.gui_position = {
            x: x * this.moduleWidth,
            y: y * this.moduleWidth + this.guiEditorTop
          }
          this.messageHandler?.({action: 'set', id: module.id, data: {gui_position: module.parameters.gui_position}, audio: false, undoable: false})             
        }
      }
    }
  
    this.calculateOccupiedSlots(this.modules.values())

		// add to DOM
		
		for(const module of this.modules.values()) {
        
      // calculate gui_position, if it doesn't exist yet
      if(!module.parameters.gui_position) {
        let x = 1, y = 0, free = false
          		
        while(!free) {
          free = true
          for(let i=0; i<module.gui_layout.width; i++) {
            for(let j=0; j<module.gui_layout.height; j++) {
              if(this.occupied.has(JSON.stringify([x+i, y+j]))) free = false
            }
          }
          if(!free) x++
        }
        
        for(let i=0; i<module.gui_layout.width; i++) {
          for(let j=0; j<module.gui_layout.height; j++) {
            this.occupied.add(JSON.stringify([x+i, y+j]))
          }
        }
        
        module.parameters.gui_position = {
          x: x * this.moduleWidth,
          y: y * this.moduleWidth + this.guiEditorTop
        }
      }

      module.moduleDIV.setAttribute('style', `left: ${module.parameters.gui_position.x}px; top: ${module.parameters.gui_position.y}px`)
      this.editorDIV.appendChild(module.moduleDIV)
    }

		this.resize()
  }
	
	calculateOccupiedSlots(modules) {
	  const occupied = new Set()
 		for(const module of modules) {
 		  if(module.parameters.gui_position) {
        const x = Math.round((module.parameters.gui_position.x) / this.moduleWidth)
        const y = Math.round((module.parameters.gui_position.y - this.guiEditorTop) / this.moduleWidth)
        for(let i=0; i<module.gui_layout.width; i++) {
          for(let j=0; j<module.gui_layout.height; j++) {
            if(occupied.has(JSON.stringify([x + i, y + j]))) return false
            occupied.add(JSON.stringify([x + i, y + j]))
          }
        }
      }
    }
    this.occupied = occupied
	  return true
	}

	onPointerDown(e) {
	  window.synth = this.synth // make parent synth active
	  
		this.editorDIVzoom = this.editorDIV.style.zoom
		this.editorDIVzoom = this.editorDIVzoom == '' ? 1.0 : this.editorDIVzoom
		
		const targetClassName = e.target.className
		if(targetClassName == 'outlet') {
			this.patchCord = new PatchCord(this)
			this.editorSVG.appendChild(this.patchCord.svgElement)
			const rect = e.target.getBoundingClientRect()
			const posX = (rect.left + rect.right) * 0.5
			const posY = (rect.top + rect.bottom) * 0.5
			this.patchCord.setSrcPosition(this.getRelativePos(posX, posY))
			
			let target = e.target
			while (target != this.editorDIV) {
				if(target.classList[0] == 'outlet') {
					const moduleId = parseInt(target.parentElement.id)
					const tag = target.getAttribute('tag')
					this.patchCord.setSrc(this.modules.get(moduleId), tag)
					break
				}
				target = target.parentElement
			}		
		}
		else if(e.target == this.editorSVG) {
			this.deselectAll()

      if(!('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
        // selection rectangle only on non-touch devices
			  if(this.mode == 'build' || this.mode == 'layout') {
          const pos = this.getRelativePos(e.clientX, e.clientY)
          this.selectionRectangle.start(pos)
          this.editorSVG.setPointerCapture(e.pointerId)
        }
      }
		}
	}
	
	onPointerMove(e) {
	  e.preventDefault()
		if(this.dragVector) {
			let dx = e.clientX - this.pointerStartPos.x - this.dragVector.x
			let dy = e.clientY - this.pointerStartPos.y - this.dragVector.y
			if(this.mode == 'layout')
			  this.moveSelectedGuiModules(dx, dy)
			else
			  this.moveSelectedModules(dx, dy)
		}
		else if(this.patchCord) {
			const pos = this.getRelativePos(e.clientX, e.clientY)
			this.patchCord.setDstPosition(pos)
			this.patchCord.dstType = 0
			
			let tempMagneticInlet = null
			let minDist = Infinity
			for(const [id, module] of this.modules) {
		    if(module.class != 'Comment' && id != this.patchCord.srcModule.id) {
		      const allInlets = new Map([...module.signalInlets, ...module.controlInlets])
          for(const [tag, inlet] of allInlets) {
            const rect = inlet.getBoundingClientRect()
  					const posX = (rect.left + rect.right) * 0.5
	  				const posY = (rect.top + rect.bottom) * 0.5
            const dist = Math.pow(Math.pow(Math.abs(e.clientX - posX),2) + Math.pow(Math.abs(e.clientY - posY),2),0.5)
            if(dist < 40 && dist < minDist) {
              tempMagneticInlet = inlet
              minDist = dist
            }
          }
        }
      }
      if(tempMagneticInlet != this.magneticInlet) {
        this.magneticInlet?.classList.remove('magnetic')
        tempMagneticInlet?.classList.add('magnetic')
        this.magneticInlet = tempMagneticInlet
      }
		}
		else if(this.selectionRectangle.visible) {
			const pos = this.getRelativePos(e.clientX, e.clientY)
      this.selectionRectangle.move(pos)
            
      for(const module of this.modules) {
        if(this.selectionRectangle.overlap(module[1].bodyDIV.getBoundingClientRect())) {
          this.selectModule(module[1].id)
        }
        else {
          this.deselectModule(module[1].id)
        }
      }
		}
	}
	
	onPointerUp(e) {
		if(this.patchCord) {
		  if(this.magneticInlet) {
		    const moduleId = parseInt(this.magneticInlet.getAttribute('moduleId'))
        const rect = this.magneticInlet.getBoundingClientRect()
        const posX = (rect.left + rect.right) * 0.5
        const posY = (rect.top + rect.bottom) * 0.5
		    if(this.patchCord.setDst(this.modules.get(moduleId), this.magneticInlet.getAttribute('tag'))) { // valid connection
          this.patchCord.setDstPosition(this.getRelativePos(posX, posY))
          this.messageHandler?.({action: 'plug', srcId: this.patchCord.srcModule.id, srcPort: this.patchCord.srcPort, dstId: moduleId, dstPort: this.magneticInlet.getAttribute('tag')})
		    }
		    else { // invalid connection
		      this.patchCord.destroy() 
		    }
		    this.patchCord = null
		    this.magneticInlet.classList.remove('magnetic')
		    this.magneticInlet = null
		    return;
		  }
			this.patchCord.destroy()
			this.patchCord = null
	    this.magneticInlet = null
		}
		else if(this.selectionRectangle.visible) {
      this.selectionRectangle.hide()
		}
		else {
		  if(this.dragVector && (this.dragVector.x != 0 || this.dragVector.y != 0)) {
        for(let moduleId of this.selectedModuleIds) {
				  let module = this.modules.get(moduleId)
				  if(module && this.mode == 'build') {
  				  this.messageHandler?.({action: 'set', id: moduleId, data: {position: module.parameters.position}, audio: false, undoable: true})
          }
          else if(module && module.parameters.gui_position) {
            this.messageHandler?.({action: 'set', id: moduleId, data: {gui_position: module.parameters.gui_position}, audio: false, undoable: true})       
          }
			  }
			  if(this.mode == 'layout') this.calculateOccupiedSlots(this.modules.values())   
			}
		}
		this.dragVector = null
		this.resize()			
	}
	
	onDrop(e) {
    e.preventDefault()

    const xOffset = parseInt(e.dataTransfer.getData('xOffset'))
    const yOffset = parseInt(e.dataTransfer.getData('yOffset'))
    const moduleClass = e.dataTransfer.getData('class')

    let newId = -1

    const parameters = {}
    parameters.position = {}
    const rect = this.editorDIV.getBoundingClientRect()
    parameters.position.x = e.clientX - rect.left - xOffset + this.editorDIV.scrollLeft
    parameters.position.y = e.clientY - rect.top - yOffset + this.editorDIV.scrollTop
    
    // notify
    this.messageHandler?.({action: 'getId', callback: id => { newId = id } })
    this.messageHandler?.({action: 'new', id: newId, class: moduleClass, subpatchId: this.subpatchId})
    this.messageHandler?.({action: 'set', id: newId, data: parameters, undoable: true})
        
    this.deselectAll()
 		this.createModule(newId, moduleClass, parameters, undefined, undefined, this.subpatchId)
    this.selectModule(newId)
    this.resize()
  }
	
	getRelativePos(x, y) {
		const rect = this.editorDIV.getBoundingClientRect()
		return { 
		  x: (x / this.editorDIVzoom) - rect.left + this.editorDIV.scrollLeft,
		  y: (y / this.editorDIVzoom) - rect.top  + this.editorDIV.scrollTop
		}
	} 
	
	createModule(moduleId, moduleClass, parameters, attributes, modules, subpatchId) {
	  if(moduleId === undefined || !moduleClass) return null
	
	  let module
	  if(moduleClass == 'Comment') {
	    module = new Comment(this, moduleId, parameters, attributes)
	  }
	  else if(moduleClass == 'Subpatch') {
		  module = new Subpatch(this, moduleId, parameters, modules, attributes)
	  }
	  else {
      module = new Module(this, moduleId, moduleClass, parameters, attributes)
	    module.initForEditor(this)
		}
				
      this.modules.set(moduleId, module)

		// make only visible if necessary
		if(subpatchId === this.subpatchId) {
  		this.editorDIV.appendChild(module.moduleDIV)		
      requestAnimationFrame(() => { module.update() })
    }
    
    return module
	}
	
	selectModule(moduleId) {
		this.selectedModuleIds.add(moduleId)
		this.modules.get(moduleId).select()
		const infoModuleClass = this.selectedModuleIds.size == 1 ? this.modules.get(moduleId).class : undefined
		infobox(this.contentDIV, infoModuleClass)
	}
	
	deselectModule(moduleId) {
    this.modules.get(moduleId).deselect()
    this.selectedModuleIds.delete(moduleId)	
		if(this.selectedModuleIds.size == 0) infobox(this.contentDIV, null)
	}
	
	selectPatchCord(patchCord) {
		this.selectedPatchCords.push(patchCord)
		patchCord.select()
	}
	
	selectAll() {
	  for(const module of this.modules) {
	    this.selectModule(module[0])
	  }
	}
	
	deselectAll() {
		for(let moduleId of this.selectedModuleIds) {
			this.modules.get(moduleId).deselect()
		}
		this.selectedModuleIds = new Set()
		infobox(this.contentDIV, null)
		for(let patchCord of this.selectedPatchCords) {
			patchCord.deselect()
		}
		this.selectedPatchCords = []
	}
		  			
	moveSelectedModules(dx, dy) {
		let minX = Infinity
		let minY = Infinity
		for(let moduleId of this.selectedModuleIds) {
			let module = this.modules.get(moduleId)
			minX = Math.min(minX, module.parameters.position.x)
			minY = Math.min(minY, module.parameters.position.y)
		}
		
		dx = Math.max(dx, -minX)
		dy = Math.max(dy, -minY)
		
		for(let moduleId of this.selectedModuleIds) {
			let module = this.modules.get(moduleId)
			module.move(dx / this.editorDIVzoom, dy / this.editorDIVzoom)
		}
		this.dragVector.x += dx
		this.dragVector.y += dy
	}
	
	moveSelectedGuiModules(dx, dy) {
		let minX = Infinity
		let minY = Infinity
		for(let moduleId of this.selectedModuleIds) {
			let module = this.modules.get(moduleId)
			minX = Math.min(minX, module.parameters.gui_position.x)
			minY = Math.min(minY, module.parameters.gui_position.y)
		}
		
		dx = Math.round(Math.max(dx, -minX) / this.moduleWidth) * this.moduleWidth
		dy = Math.round(Math.max(dy, -minY) / this.moduleWidth) * this.moduleWidth
		
		const tempModules = new Map(Array.from(this.modules, (
		  [k, v]) => [k, {
		    parameters: {
		      gui_position: {
		        x: v.parameters.gui_position.x,
		        y: v.parameters.gui_position.y
		      }
		    },
		    gui_layout: v.gui_layout
		  }])
		)
		for(let moduleId of this.selectedModuleIds) {
			const module = tempModules.get(moduleId)
			module.parameters.gui_position = {
			  x: module.parameters.gui_position.x + dx,
			  y: module.parameters.gui_position.y + dy
		  }
		}
		if(this.calculateOccupiedSlots(tempModules.values())) {		
      for(let moduleId of this.selectedModuleIds) {
        let module = this.modules.get(moduleId)
        module.moveGui(dx, dy)
      }
      this.dragVector.x += dx
      this.dragVector.y += dy
		}
	}
	
	setAttributesForSelected(attrs) {
    const moduleId = this.selectedModuleIds.values().next().value
    const module = this.modules.get(moduleId)
    
    module.setAttributes(attrs)    
    this.messageHandler?.({action: 'set', id: moduleId, attributes: attrs, undoable: true})
	}
	
	getHeight() {
	  return this.editorSVG.getBoundingClientRect().height + 20 // height + margin
	  
	}
}