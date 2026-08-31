import { ModuleBase } from './moduleBase.js'
import { modules } from '../modules/modules.gen.js'
import { L } from '../i18n/language.js'
import { make } from "../utils/make.js"


export class Comment extends ModuleBase {
	constructor(editor, id, parameters, attributes) {
    super(editor, id, 'Comment', parameters, attributes)

    this.createModuleDIV('comment')
    this.createHeader(!this.parameters.staticModule)
    this.createBody()
		
		this.textarea = make('span', {className: 'textarea', contentEditable: true})
		this.textarea.innerHTML = parameters.text ?? ''
		this.bodyDIV.appendChild(this.textarea)
		
		this.textarea.onkeydown = (e) => {
		  e.stopPropagation()
		}
		
		this.textarea.onkeyup = (e) => {
		  this.parameters.text = e.srcElement.innerHTML
      this.editor.messageHandler?.({action: 'set', id: this.id, data: { 'text': e.srcElement.innerHTML }, undoable: true})
		}
	}
}