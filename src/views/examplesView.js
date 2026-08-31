import { appHeader } from "../components/appHeader.js"
import { sidebar } from "../components/sidebar.js"

import { make } from '../utils/make.js'
import { L } from "../i18n/language.js"
import { examples } from "../examples/examples.gen.js"

export function examplesView(container, messageHandler) {  
  appHeader(container)
	new sidebar(container, messageHandler)

	const examplesDIV = make('div', {id: 'content'})
	container.appendChild(examplesDIV)

  examplesDIV.innerHTML = `<h1>${L.get('examples')}</h1><hr>`
	  
  if((examples.length ?? 0) === 0) {
    examplesDIV.appendChild(make('p', {html: L.get('noExamples')}))
  }
  else {
    const table = make('table', {}, [
      make('tr', {}, [
        make('th', { html: 'Patch' }),
        make('th', { html: '–' }),
        make('th', { html: '–' })
      ])
    ])
    examplesDIV.appendChild(table)
    
    table.addEventListener('pointerdown', e => {
      const name = e.target.getAttribute('name')
      const preset = examples.find(preset => preset.name === name)
      messageHandler?.({ json: preset.content })
    })  
    
    for(const example of examples) {
      table.appendChild(make('tr', {}, [
        make('td', {html: example.name, className: 'patch', attrs: {name: example.name }}),
        make('td', {html: '14.02.2026'}),
        make('td', {html: ''})
      ]))       
    }
  }
}
