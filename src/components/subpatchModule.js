import { ModuleBase } from './moduleBase.js'
import { modules } from '../modules/modules.gen.js'
import { L } from '../i18n/language.js'
import { Module } from "./module.js"
import { buttonControl } from "../html-elements/buttonControl.js"
import { make } from "../utils/make.js"

export class Subpatch extends ModuleBase {
	constructor(editor, id, parameters, childModules, attributes) {
    super(editor, id, 'Subpatch', parameters, attributes)

  	this.childModules = childModules ?? []
  	
  	// instantiate encapsulated modules to execute their custom init function
  	for(const module of this.childModules) {
 	    if(module.class == 'Subpatch')
  		  new Subpatch(module.editor, module.id, module.parameters, module.modules, module.attributes)
	    else if(modules[module.class].definition.init)
        new Module(this.editor, module.id, module.class, module.parameters, module.attributes)
  	}
  	
    this.createModuleDIV()
    this.createHeader(!this.parameters.staticModule)
    this.createBody()

	  this.label = make('div', {className: 'label'})
	  this.bodyDIV.appendChild(this.label)
	  if(this.attributes.label) this.label.innerHTML = this.attributes.label

   	this.controllerContainerDIV = make('div', {className: 'controller_container'})
		this.bodyDIV.appendChild(this.controllerContainerDIV)

    this.openButton = make('button', {className: 'openSubpatch'})
    this.openButton.onpointerdown = e => {
      e.stopPropagation()
      this.messageHandler?.({action: 'showSubpatch', subpatchId: this.id })
    }
    this.controllerContainerDIV.appendChild(this.openButton)

		this.signalInlets = new Map()
    this.numSignalOutlets = 0

    let ins = 1
    let outs = 1
    for(let i=1; i<5; i++) {
      if(this.childModules.find(u => u.class === 'Inlet')?.parameters[i] != undefined) ins = (i + 1)
      if(this.childModules.find(u => u.class === 'Outlet')?.parameters[i] != undefined) outs = (i + 1)
    }

    for(let i=0; i<ins; i++) this.createSignalIn(i)
    
    this.numSignalOutlets = outs
    for(let i=0; i<outs; i++) this.createSignalOut(i,i+1)

    this.bodyDIV.style.minHeight = 40 + (Math.max(this.signalInlets.size, this.numSignalOutlets) * 30) + 'px'  
  }
}