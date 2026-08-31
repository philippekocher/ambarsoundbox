import { modules } from '../modules/modules.gen.js'
import { L } from '../i18n/language.js'
import { moduleContextMenu } from '../components/moduleContextMenu.js'
import { make } from "../utils/make.js"
import { dialogBox } from '../components/dialogBox.js'


export class ModuleBase {
	constructor(editor, id, moduleClass, parameters, attributes) {
		this.editor = editor
		this.id = id
		this.messageHandler = editor.messageHandler

    if(!modules[moduleClass]) {
      console.error('Error: the class "'+moduleClass+'" doesn\'t exist.')
      this.moduleDefinition = { 
        ...modules['Dummy'].definition, 
        name: '&nbsp;&nbsp;???&nbsp;&nbsp;', 
        attributes: {label: `Class: ${moduleClass}`}
      }
      this.isDummy = true
    }
    else {
      this.class = moduleClass
      this.moduleDefinition = modules[moduleClass].definition
    }
		
		this.parameters = parameters ?? {}
    if(this.moduleDefinition.staticModule == true) this.parameters.staticModule = true

		this.attributes = this.buildAttributes(attributes)

		this.inPatchCords = []
		this.outPatchCords = []
		this.signalInlets = new Map()
    this.controlInlets = new Map()
    this.controlInputs = new Map()
    this.numSignalOutlets = 0

    this.alert = text => dialogBox.info(L.get(text))
    this.moduleDefinition.init?.(this)
	}

	buildAttributes(attributes) {
		const defaultAttributes = this.moduleDefinition?.attributes
		const merged = { ...defaultAttributes, ...attributes }

		if(defaultAttributes) {
			for(const [k, v] of Object.entries(defaultAttributes)) {
				if(merged[k] && Array.isArray(v)) {
					const idx = v.indexOf(merged[k])
					const newArr = Array.from(v)
					newArr.push(idx)
					merged[k] = newArr
				}
			}
		}
		return merged
	}

	createModuleDIV(className = 'module') {
	  className = this.isDummy ? className + ' dummy' : className
		this.moduleDIV = make('div', { id: this.id, className })
		this.moduleDIV.style.left = this.parameters.position.x + 'px'
		this.moduleDIV.style.top = this.parameters.position.y + 'px'
	}

	createHeader(withContextMenu = true) {
		this.headerDIV = make('div', { className: 'moduleHeader category_' + this.moduleDefinition?.category })
		this.moduleDIV.appendChild(this.headerDIV)

		this.headerText = make('div', { html: L.replace(this.moduleDefinition?.name) })
		this.headerDIV.appendChild(this.headerText)

    this.headerDIV.onpointerdown = e => {
      if(!this.selected) {
        if(!e.shiftKey) this.editor.deselectAll()
        this.editor.selectModule(this.id)
      }
      this.editor.pointerStartPos = { x:e.clientX, y:e.clientY }
      this.editor.dragVector = { x:0, y:0 }
    }

		if(withContextMenu) {
			this.headerContextMenuBtn = make('div', { className: 'ctxMenuBtn' })
			this.headerDIV.appendChild(this.headerContextMenuBtn)
			this.headerContextMenuBtn.onpointerdown = e => {
				e.stopPropagation()
				const rect = this.headerContextMenuBtn.getBoundingClientRect()
				const pos = this.editor.getRelativePos(rect.x, rect.y)
				moduleContextMenu(this.editor, pos, this.attributes)
			}
		}
	}
	
	createBody() {
    this.bodyDIV = make('div', {className: 'body category_'+this.moduleDefinition.category})
		this.moduleDIV.appendChild(this.bodyDIV)
			    
		this.bodyDIV.onpointerdown = (e) => {
      if(!e.shiftKey) this.editor.deselectAll()
      this.editor.selectModule(this.id)
		}	
	}

	select() {
		this.moduleDIV.classList.add('selected')
		this.selected = true
	}

	deselect() {
		this.moduleDIV.classList.remove('selected')
		this.selected = false
	}

	move(dx, dy) {
		this.parameters.position.x += dx
		this.parameters.position.y += dy
		this.moduleDIV.style.left = this.parameters.position.x + 'px'
		this.moduleDIV.style.top = this.parameters.position.y + 'px'

		for(const inPatchCord of this.inPatchCords) {
			inPatchCord.moveDstPosition(dx, dy)
		}
		for(const outPatchCord of this.outPatchCords) {
			outPatchCord.moveSrcPosition(dx, dy)
		}
	}

	update() {}

	destroy() {
		this.moduleDIV.remove()
		for(const inPatchCord of this.inPatchCords) {
			inPatchCord.destroy(false)
		}
		for(const outPatchCord of this.outPatchCords) {
			outPatchCord.destroy(true)
		}
	}

	setAttributes(attributes) {
		for(const [k, v] of Object.entries(this.attributes)) {
			if(attributes[k] && Array.isArray(v)) {
				const idx = v.indexOf(attributes[k])
				v[v.length - 1] = idx
				this.attributes[k] = v
			}
			else {
				this.attributes[k] = attributes[k]
			}
		}
		if(this.attributes.label != undefined && this.label) {
			this.label.innerHTML = this.attributes.label
		}

    if(this.attributes.type != undefined) {
      for(const el of this.controllerContainerDIV.children) {
         el.type = (this.attributes.type[this.attributes.type[this.attributes.type.length - 1]])
      }
    }
	}

  setParameter(data, undoable = false) {
    Object.assign(this.parameters, data)
    this.messageHandler?.({action: 'set', id: this.id, data: data, undoable: undoable })
    this.visualisation?.set(data)
    this.update()
  }

	createSignalIn(tag) {
		const inletDIV = make('div', { className: 'inlet' })
		inletDIV.style.top = (40 + this.signalInlets.size * 30) + 'px'
		inletDIV.setAttribute('tag', tag)
		inletDIV.setAttribute('moduleId', this.id)
		this.moduleDIV.appendChild(inletDIV)
		this.signalInlets.set(tag, inletDIV)
	}
	
	createSignalOut(tag, n, addFromBottom = false) {
		const outletDIV = make('div', {className: 'outlet'})
		outletDIV.setAttribute('tag', tag)
		if(addFromBottom) outletDIV.style.bottom = (15 + this.numSignalOutlets * 30 - n * 30) + 'px'
		else              outletDIV.style.top = (10 + n * 30) + 'px'
		this.moduleDIV.appendChild(outletDIV)        	
	}
}
