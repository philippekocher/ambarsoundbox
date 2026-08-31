import { ModuleBase } from './moduleBase.js'
import { modules } from '../modules/modules.gen.js'
import { L } from '../i18n/language.js'
import { buttonControl } from "../html-elements/buttonControl.js"
import { knobControl } from "../html-elements/knobControl.js"
import { numberControl } from "../html-elements/numberControl.js"
import { textControl } from "../html-elements/textControl.js"
import { fileButton } from "../html-elements/fileSelectControl.js"
import { playbackControl } from "../html-elements/playbackControl.js"
import { touchpadControl } from "../html-elements/touchpadControl.js"
import { storage } from '../utils/storage.js'
import { make } from "../utils/make.js"

export class Module extends ModuleBase {
	constructor(editor, id, moduleClass, parameters, attributes) {
    super(editor, id, moduleClass, parameters, attributes)

    const showVisualisation = storage.settings.get('visualisation')
    this.visualisation = showVisualisation === 'true' && modules[moduleClass]?.Visualisation ? new modules[moduleClass].Visualisation() : null
    this.parameters = parameters ?? {}
  }
  
  initForEditor(editor) {
    this.editor = editor
        
    if(this.moduleDIV) {
      // when optional ports are added or removed
      this.moduleDIV.innerHTML = ''
    }
    else {
      this.createModuleDIV()
    }
    
    this.createHeader(!this.parameters.staticModule)
    if(this.moduleDefinition.nameIsSymbol) {
      this.headerText.style.fontSize = '2em'
      this.headerText.style.lineHeight = '0.5'
    }

    this.createBody()
    
    if(this.visualisation) {
      this.bodyDIV.classList.add('vis')
      this.visualisation.container = make('div', {className: 'visualisation_container'})
      this.bodyDIV.appendChild(this.visualisation.container)
      this.visualisation.set(this.parameters)
      this.visualisation.set({id: this.id})
    }
    
    this.label = make('div', {className: 'label'})
    this.bodyDIV.appendChild(this.label)
    if(this.attributes.label) this.label.innerHTML = this.attributes.label
    
    this.messageHandler?.({
      action: 'poll',
      id: this.id,
      callback: data => {
        for(const [key, val] of Object.entries(data)) {
          let input = this.controlInputs.get(key)
          let inlet = this.controlInlets.get(key)
          if(input == undefined) continue
          if(input.classList.contains('disabled') ||
             input.classList.contains('polling')) {
            if(this.moduleDefinition.inputs[key].min || this.moduleDefinition.inputs[key].max) {
              const min = this.moduleDefinition.inputs[key].min ?? 0
              const max = this.moduleDefinition.inputs[key].max ?? 1
              data[key] = Math.max(min, Math.min(max, val))
            }
            input.setAttribute('value', data[key])
          } 
        }
        for(const [key, val] of Object.entries(data)) {
          if(data[key+'_err'] == true) {
            this.controlInlets.get(key)?.classList.add('error') 
            this.signalInlets.get(key)?.classList.add('error') 
          }
          else {
            this.controlInlets.get(key)?.classList.remove('error') 
            this.signalInlets.get(key)?.classList.remove('error')           
          }   
        }
        this.visualisation?.set(data)
        this.visualisation?.render()
      }
    })

    this.controllerContainerDIV = make('div', {className: 'controller_container'})
    if(this.moduleDefinition.outputs && Object.values(this.moduleDefinition.outputs).some(out => out.hasOwnProperty('type'))) {
      this.controllerContainerDIV.classList.add('vertical')
    }
    this.bodyDIV.appendChild(this.controllerContainerDIV)
      
    if(this.moduleDefinition.inputs) {
      for(let [key, specifications] of Object.entries(this.moduleDefinition.inputs)) {
        if(specifications.type) {
          // take default value if necessary
          if(this.parameters[key] === undefined && specifications.value) {
            this.parameters[key] = specifications.value
            this.visualisation?.set({ [key]: specifications.value });
          }
          this.createControlIn(key, specifications, this.moduleDefinition.category)
        }
        else if(!specifications.optional || this.parameters[key] != undefined) {
          this.createSignalIn(key)
        }
      }
    }

    if(this.moduleDefinition.outputs) {
      // count signal outlets
      for(let [key, specifications] of Object.entries(this.moduleDefinition.outputs)) {
        if(!specifications.type && (!specifications.optional || this.parameters[key] != undefined)) {
          this.numSignalOutlets++
        }
      }
      // create outlets 
      let n = 1
      for(let [key, specifications] of Object.entries(this.moduleDefinition.outputs)) {
        if(!specifications.type && (!specifications.optional || this.parameters[key] != undefined)) {
          this.createSignalOut(key, n++, true)
        }
        else if(!specifications.optional || this.parameters[key] != undefined) {
          this.createControlOut(key, specifications, this.moduleDefinition.category)
        }
      }
    }

    this.bodyDIV.style.minHeight = 40 + (Math.max(this.signalInlets.size, this.numSignalOutlets) * 30) + 'px'

    if(this.moduleDefinition.outputs && Object.values(this.moduleDefinition.outputs).some(x => x.hasOwnProperty('optional')) ||
       this.moduleDefinition.inputs && Object.values(this.moduleDefinition.inputs).some(x => x.hasOwnProperty('optional'))) {
        this.createExtensionButtons(this.moduleDefinition)
    }
  }
  
  initForGUI(editor, controlsDisabled = false) {
    this.editor = editor

    this.inPatchCords = []
    this.outPatchCords = []

    this.moduleDIV = make('div', {id: this.id, className: 'module width'+this.gui_layout.width+' height'+this.gui_layout.height, attrs: {style: '' }})    
    this.bodyDIV = make('div', {className: 'body'})
    this.moduleDIV.appendChild(this.bodyDIV)

    // todo: this should be in commentModule.js
    if(this.class === 'Comment') {
      this.bodyDIV.classList.add('comm')
      this.bodyDIV.appendChild(make('div', { className: 'text', html: this.parameters.text}))
    }
    else {
      const labelText = this.attributes.label ? `<b>${this.attributes.label}</b>` : `<em>${L.replace(this.moduleDefinition.name)}</em>`
      const label = make('div', {className: 'label', html: labelText})
      this.bodyDIV.appendChild(label)
      
      this.controllerContainerDIV = make('div', {className: 'controller_container vertical'})
      this.bodyDIV.appendChild(this.controllerContainerDIV)
    }
      
    if(controlsDisabled) {
      this.moduleDIV.onpointerdown = e => {
        if(!this.selected) {
          if(!e.shiftKey) this.editor.deselectAll()
          this.editor.selectModule(this.id)
        }
        this.editor.pointerStartPos = { x:e.clientX, y:e.clientY }
        this.editor.dragVector = { x:0, y:0 }
      }
    }

    if(this.moduleDefinition.outputs != undefined) {
      for(let [key, specifications] of Object.entries(this.moduleDefinition.outputs)) {
        if((!specifications.optional || this.parameters[key] != undefined)) {
          const control = this.createControl(key, specifications, controlsDisabled)
          control.setAttribute('colour', '#fff')
          this.controllerContainerDIV.appendChild(control)
        }
      }
    }    
  }
  
  update() {
    if(this.controlInputs) {
      for(const [tag, control] of this.controlInputs) {
        control.classList.remove('disabled')
        this.controlInlets.get(tag)?.classList.remove('error')
        for(const patchCord of this.inPatchCords) {
          if(patchCord.dstPort == tag) {
            control.classList.add('disabled')
            break
          }
        }
      }
    }
    if(this.visualisation) {
      this.visualisation.color = getComputedStyle(this.bodyDIV).getPropertyValue('--category_color')
      this.visualisation.render()
    }
  }
  
  moveGui(dx, dy) {
    this.parameters.gui_position.x += dx
    this.parameters.gui_position.y += dy
    this.moduleDIV.style.left = this.parameters.gui_position.x + 'px'
    this.moduleDIV.style.top = this.parameters.gui_position.y + 'px'  
  }
    
  createControlIn(tag, specifications, cat) {
    let controlDIV = this.createControl(tag, specifications)

    if(controlDIV) {
      this.controllerContainerDIV.appendChild(controlDIV)

      if(specifications.ports != false) {
        
        const ctrlInletDIV = make('div', {className: 'ctrInlet category_'+cat})
        ctrlInletDIV.setAttribute('tag', tag)
        ctrlInletDIV.setAttribute('moduleId', this.id)

        window.requestAnimationFrame(() => { 
          const left = controlDIV.offsetLeft
          ctrlInletDIV.style.left = (left + 32)+'px'
        })
        this.moduleDIV.appendChild(ctrlInletDIV)
        this.controlInlets.set(tag, ctrlInletDIV)
      }
      this.controlInputs.set(tag, controlDIV)
    }
  }
  
  createControlOut(tag, specifications, cat) {
     const controlDIV = this.createControl(tag, specifications)
    specifications.init?.(this, tag, controlDIV)

     //console.log('create control out', tag)

    if(controlDIV) {
      this.controllerContainerDIV.appendChild(controlDIV)
            
      if(specifications.ports == false) specifications.ports = 0
      if(specifications.ports == undefined) specifications.ports = 1
      for(let i=0; i<specifications.ports; i++) {
        let outletTag = specifications.ports > 1 ? `${tag}_${i}` : tag
        const outletDIV = make('div', {className: 'outlet'})
        if(specifications.portName) outletTag = specifications.portName
        outletDIV.setAttribute('tag', outletTag)
        this.moduleDIV.appendChild(outletDIV)
        
        window.requestAnimationFrame(() => { 
          const top = controlDIV.offsetTop
          outletDIV.style.top = (top + 8 + i * 30) + 'px'
        })
      }
    } 
    return controlDIV      
  }
  
  createControl(tag, specifications, disabled = false) {
    let controlDIV
    switch(specifications.type) {
      case 'button': 
        controlDIV = this.createButtonControl(tag, specifications, disabled)
        break
      case 'file-button': 
        controlDIV = this.createFileButton(tag, specifications)
        break
      case 'play': 
        controlDIV = this.createPlaybackControl(tag, specifications)
        break
      case 'number': 
        controlDIV = this.createNumberControl(tag, specifications)
        break
      case 'text': 
        controlDIV = this.createTextControl(tag, specifications)
        break
      case 'knob': 
        controlDIV = this.createKnob(tag, specifications)
        break
      case 'touchpad': 
        controlDIV = this.createTouchpad(tag, specifications)
        break
      default:
        controlDIV = this.createDefault()
    }
    
    controlDIV.setAttribute('disabled', disabled)

    return controlDIV
  }
  
  createDefault() {
    return make('div', {html: '<br><br>'})
  }
  
  createButtonControl(tag, specifications, disabled) {
    const controlDIV = make('button-control')
    
    if(this.attributes.type) {
      controlDIV.type = this.attributes.type[this.attributes.type[this.attributes.type.length - 1]]
    }
    
    if(specifications.shape)  controlDIV.shape = specifications.shape
    if(specifications.text)   controlDIV.text = L.replace(specifications.text)
    if(specifications.action) controlDIV.action = specifications.action
    else if(!disabled) {
      controlDIV.addEventListener('pointerdown', () => {
        let value = 1
        if(controlDIV.type == 'toggle') {
          value = 1 - controlDIV.value
        }
        controlDIV.setAttribute('value', value)
        this.setParameter( { [tag]: value } )
      })
      controlDIV.addEventListener('pointerup', () => {
        if(controlDIV.type != 'toggle') {
          controlDIV.setAttribute('value', 0)
          this.setParameter( { [tag]: 0 } )
        }
      })
    }   
    return controlDIV
  }

  createFileButton(tag, specifications) {
    const controlDIV = make('file-button', {className: 'polling'})
    controlDIV.setAttribute('button','true')
    controlDIV.setAttribute('accept','.wav,.mp3,.m4a')
    controlDIV.setAttribute('label', L.replace(specifications.label))
    controlDIV.innerHTML = L.replace(specifications.button)
    
    controlDIV.oninput = async (e) => {
      const file = e.srcElement.file
      if(file != undefined) {
        this.setParameter( { 'file': file } )
      }
    }
    return controlDIV
  }
  
  createPlaybackControl(tag, specifications) {
    const controlDIV = make('playback-control', {className: 'polling'})
    
    // stored value
    controlDIV.setAttribute('value', [ this.parameters['play'] ?? 0, this.parameters['loop'] ?? 0 ].join(','))
    
    controlDIV.oninput = e => {
      const data = { play: e.srcElement.value[0], loop: e.srcElement.value[1] }
      this.setParameter(data, true)
    }
    return controlDIV
  }
  
  createNumberControl(tag, specifications) {
    const controlDIV = make('number-control')
    controlDIV.setAttribute('tag', tag)
    
    // default properties
    for(let [key, val] of Object.entries(specifications)) {
      controlDIV.setAttribute(key, L.replace(val))
    }
    
    // stored value
    if(this.parameters[tag] != undefined) {
      controlDIV.setAttribute('value', this.parameters[tag])  
    }

    controlDIV.addEventListener('input', e => {
      this.setParameter( { [tag]: e.srcElement.value }, true )
    })

    return controlDIV
  }
  
  createTextControl(tag, specifications) {
    const controlDIV = make('text-control')
    controlDIV.setAttribute('tag', tag)

    // default properties
    for(let [key, val] of Object.entries(specifications)) {
      controlDIV.setAttribute(key, L.replace(val))
    }
    
    // stored value
    if(this.parameters[tag] != undefined) {
      controlDIV.setAttribute('value', this.parameters[tag])  
    }
        
    controlDIV.oninput = e => {
      this.setParameter( { [tag]: e.target.value }, true )    
    }
    
    return controlDIV
  }
  
  createKnob(tag, specifications) {
    const controlDIV = make('knob-control')
    controlDIV.setAttribute('tag', tag)

    // default properties
    for(let [key, val] of Object.entries(specifications)) {
      controlDIV.setAttribute(key, L.replace(val))
    }
        
    // stored value
    if(this.parameters[tag] != undefined) {
      controlDIV.setAttribute('value', this.parameters[tag])  
    }

    controlDIV.addEventListener('input', (e) => {
      this.setParameter({ [tag]: e.srcElement.value }, e.srcElement.valueIsFinal )
    })
    
    return controlDIV
  }
  
  createTouchpad(tag, specifications, disabled) {
    const controlDIV = make('touchpad-control')
    controlDIV.setAttribute('tag', tag)
  
    // stored value
    if(this.parameters[tag+'_0'] != undefined && this.parameters[tag+'_1'] != undefined) {
      controlDIV.setAttribute('value', [ this.parameters[tag+'_0'], this.parameters[tag+'_1']])  
    }
    
    controlDIV.setAttribute('disabled', disabled)

    controlDIV.addEventListener('input', e => {
     this.setParameter({ [tag+'_0']: e.srcElement.value[0] }, e.srcElement.valueIsFinal)
      this.setParameter({ [tag+'_1']: e.srcElement.value[1] }, e.srcElement.valueIsFinal)
    })
  
    return controlDIV
  }
  
  createExtensionButtons(moduleDefinition) {
    const extensionButtons = make('div', {className: 'extensionButtons'})
    this.bodyDIV.appendChild(extensionButtons)
  
    // add buttons
    
    const minusButton = make('button', {className: 'minus'})
    extensionButtons.appendChild(minusButton)
 
    const plusButton = make('button', {className: 'plus'})
    extensionButtons.appendChild(plusButton)
   
    // add event listeners
    
    minusButton.addEventListener('pointerdown', () => {
      if(moduleDefinition.outputs) {
        for(const [key, optOut] of Object.entries(moduleDefinition.outputs).reverse()) {
          if(optOut.optional && (this.parameters[key] != undefined)) {
            for(const patchCord of this.outPatchCords) {          
              if(patchCord.srcPort == key) {
                patchCord.destroy(true)
              }
            }
            this.setParameter( { [key]: null }, true )
            this.initForEditor(this.editor)
            break
          }
        }
      }
      if(moduleDefinition.inputs) {
        for(const [key, optIn] of Object.entries(moduleDefinition.inputs).reverse()) {
          if(optIn.optional && (this.parameters[key] != undefined)) {
            for(const patchCord of this.inPatchCords) {          
              if(patchCord.dstPort == key) {
                patchCord.destroy(true)
              }
            }
            this.setParameter( { [key]: null }, true )
            this.initForEditor(this.editor)
            break
          }
        }
      }
    })
  
    plusButton.addEventListener('pointerdown', () => { 
      if(moduleDefinition.outputs) {
        for(const [key, optOut] of Object.entries(moduleDefinition.outputs)) {
          if(optOut.optional && (this.parameters[key] === undefined || this.parameters[key] === null)) {
            this.setParameter( { [key]: 0 }, true )
            this.initForEditor(this.editor)
            break
          }
        }
      }
      else if(moduleDefinition.inputs) {
        for(const [key, optIn] of Object.entries(moduleDefinition.inputs)) {
          if(optIn.optional && (this.parameters[key] === undefined || this.parameters[key] === null)) {
            this.setParameter( { [key]: 0 }, true )
            this.initForEditor(this.editor)
            break
          }
        }
      }
    })
  }
}