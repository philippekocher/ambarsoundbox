/*
import { L } from "../i18n/language.js"
import { infobox } from './infobox.js'
import { module_TEMPLATES } from "../units/unitTemplates.js"
import { make } from '../utils/make.js'

export function classroomConfig(messageHandler, elements) {	  
  const div = document.createElement('div')
  
  buildPalette(div)
  
  const navigation = document.createElement('div')
  navigation.setAttribute('id','navigation')
  div.appendChild(navigation)

// 		let settings = document.createElement('div')
// 		settings.innerHTML = '<span class="icon" id="settings">&nbsp;</span>'+L.get('settings')
// 		menu.appendChild(settings)
  
  return div
}

function buildPalette(div) {
  palette = document.createElement('div')
  palette.setAttribute('id','palette')
  palette.style.width = 'auto'
  palette.style.display = 'flex'
  palette.style.gap = '20px'
  div.appendChild(palette)
  
 for(const cat of ['io','generator','processor','utility','gui']) {
    let catnavigation = document.createElement('div') // category navigation
    catnavigation.className = 'catnavigation disclosed category_'+cat
    catnavigation.style.border = '1px solid #ccc'
    catnavigation.style.padding = '8px'
    
    let div = document.createElement('div')
    div.className = 'cat'
    div.innerHTML = '<span class="icon" id="'+cat+'">&nbsp;</span> '+L.get('category_'+cat)
    div.style.background = '#fff'
    catnavigation.appendChild(div)
    
    let unitList = document.createElement('div') // unit list
    unitList.className = 'unitList'
    unitList.style.border = 'none'
    unitList.style.paddingLeft = '0px'
    catnavigation.appendChild(unitList)
    
    let inner = document.createElement('div')
    inner.className = 'inner'
    unitList.appendChild(inner)
    
    for(let [key, unit] of Object.entries(module_TEMPLATES)) {
      if(cat == unit.category) {
        const checkbox = document.createElement('input')
        checkbox.setAttribute('type','checkbox')
        checkbox.setAttribute('checked',true)
        const item = document.createElement('div')
        if(unit.nameIsSymbol) {
          item.innerHTML = '<span style="font-size: 1.5em; line-height: 0.85;">'+unit.name+'</span>'
        }
        else {
          item.innerHTML = unit.name            
        }
        item.className = 'unitPlaceholder category_'+cat
//         item.onpointerdown = () => { infobox(key) }
                          
        inner.appendChild(make('div', {style: 'display: flex; align-items: center; gap: 10px;'}, [checkbox, item]))
      }
    }
    palette.appendChild(catnavigation)  								
  }
}	
*/