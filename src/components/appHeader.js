import { L } from "../i18n/language.js"
import { make } from '../utils/make.js'

export function appHeader(container) {
		document.title = 'A M B A R – SOUNDBOX'
		container.innerHTML = ''
		container.appendChild(make('div', {id: 'header'})) //, html: 'Login'})) 
}
