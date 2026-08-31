import { make } from '../utils/make.js'
import { modules } from '../modules/modules.gen.js'
import { L } from "../i18n/language.js"
import { getEntryForModule } from "../encyclopaedia/encyclopaedia.js"

export async function infobox(parent, moduleClass) {
  const div = parent.querySelector('#infobox')
  if(div) {
    if(moduleClass === null) {
      icon.className = ''
      text.innerHTML = ''
    }
    else if(moduleClass === undefined) {
      icon.className = 'category_undefined'
      text.innerHTML = L.get('info_multipleSelection') 
    }
    else {
		  const moduleDefinition = modules[moduleClass]?.definition
      icon.className = 'category_'+moduleDefinition.category
      text.innerHTML = '<b>'+L.replace(moduleDefinition.name) + '</b><br>' + (L.replace(moduleDefinition.info) || L.get('info_undefined'))
      const link = await getEntryForModule(moduleClass)
      if(link) {
        text.innerHTML += ` <a class="more" href="/${link}">Mehr erfahren...</a>`
      }
    }
  }
  else {
    if(div) div.remove()
  }
}

export function createInfobox(container, messageHandler) {
  const div = make('div', {id: 'infobox', className: 'glassEfx'})
  container.appendChild(div)
  
  const icon = document.createElement('div')
  icon.setAttribute('id','icon')
  div.appendChild(icon)
  
  const text = document.createElement('div')
  text.setAttribute('id','text')
  div.appendChild(text)
  
  div.addEventListener('click', e => {
    const link = e.target.closest('a')
    if(!link) return
    
    e.preventDefault()
    e.stopPropagation()
    
    messageHandler?.({ view: 'encyclopaediaView', entry: link.pathname.slice(1) })    
  })
}
    
