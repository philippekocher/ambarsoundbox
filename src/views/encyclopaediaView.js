import { loadEncyclopaedia } from "../encyclopaedia/encyclopaedia.js"
import { appHeader } from "../components/appHeader.js"
import { sidebar } from "../components/sidebar.js"
import { Synth } from '../core/synth.js'
import { L } from "../i18n/language.js"
import { make } from '../utils/make.js'


export const encyclopaediaView = async (container, messageHandler) => {
  appHeader(container)
	sidebar(container, messageHandler)
		
  const lang = L.getLanguage()
	const content = await loadEncyclopaedia(lang)
	if(!content) return

	const encyclopaediaDIV = make('div', {id: 'content'})
	container.appendChild(encyclopaediaDIV)
  
  let synthInstances = []
  const entry = sessionStorage.getItem('ambarsoundbox:encyclopaedia:entry')
  if(entry && content.entries[entry])
    synthInstances = displayEntry(encyclopaediaDIV, content, entry)
  else
    overview(encyclopaediaDIV, content)

  encyclopaediaDIV.addEventListener('click', e => {
    const link = e.target.closest('a')
    if(!link) return  
    e.preventDefault()
    messageHandler?.({ view: 'encyclopaedia', entry: link.pathname.slice(1) })    
  })
  
  return () => {
    for (const synth of synthInstances) {
      synth.destroy()
    }
  }
}

const overview = (container, content) => {
  let html = `<h1>${L.get('encyclopaedia')}</h1>
    <hr>
    <section class="encyclopaedia">`

  html += '<div class="column">'
  for (const letter of 'ABCDEFGHIJKLM') {
    html += `<div class="letter" id="${letter}"><h3>${letter}</h3><div class="entries">`
    const contentForLetter = content.toc[letter.toLowerCase()] ?? []
    for(let i=0; i<contentForLetter.length; i++) {
      const item = contentForLetter[i]
      html += `<div><a href="/${item.id}">${item.title}</a>`
      if(i < contentForLetter.length - 1) html += '<div class="bull">&bull;</div>'
      html += '</div>'
    }
    html += `</div></div>`
  }
  html += '</div>'  

  html += '<div class="column">'
  for (const letter of 'NOPQRSTUVWXYZ') {
    html += `<div class="letter" id="${letter}"><h3>${letter}</h3><div class="entries">`
    const contentForLetter = content.toc[letter.toLowerCase()] ?? []
    for(let i=0; i<contentForLetter.length; i++) {
      const item = contentForLetter[i]
      html += `<div><a href="/${item.id}">${item.title}</a>`
      if(i < contentForLetter.length - 1) html += '<div class="bull">&bull;</div>'
      html += '</div>'
    }
    html += `</div></div>`
  }
  html += '</div>'  

  html += '</section>'  
  container.innerHTML = html
}

const displayEntry = (container, content, id) => {
  const entry = content.entries[id]
  container.innerHTML = ''
  container.appendChild(make('div', {id: 'top'}, [
    make('h1', {text: L.get('encyclopaedia')}),
    make('div', { id: 'gotoToc' }, [ make('a', {html: 'Alle Einträge', href: '/null'}) ])
  ]))
  
  container.appendChild(make('hr'))
  container.appendChild(make('h2', {html: entry.title}))
 
  const entryDiv = make('div', {html: entry.html})
  container.appendChild(entryDiv)

  // create inline synths
  const synthInstances = []
  const synth = container.querySelectorAll('synth')
  synth.forEach(item => {
    const data = JSON.parse(item.innerHTML)
    const div = make('div', { className: 'synth' })
    item.replaceWith(div)
    
    const synth = new Synth()
    synth.messageHandler({ action: 'load', data: data, resettable: true })
    synth.settings = { embedded: true, palette: true }
    synth.render(div)
    div.style.height = synth.editor.getHeight() + 'px'
    synthInstances.push(synth)
  })
 
  return synthInstances
}