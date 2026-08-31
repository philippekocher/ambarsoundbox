import { L } from '../i18n/language.js'
import { dialogBox } from './dialogBox.js'
import { make } from '../utils/make.js'

let moduleAttributes

export function moduleContextMenu(editor, pos, attributes) {
  const element = document.querySelector('.moduleContextMenu') || createModuleContextMenu(editor)
  
  setTimeout(() => {
    const editorWidth = editor.editorDIV.getBoundingClientRect().width
    const elementWidth = element.getBoundingClientRect().width
    
    if(pos.x + elementWidth < editorWidth) {
      element.style.left = (pos.x + 10)+'px'
      element.style.top = (pos.y + 12)+'px'
      element.classList.remove('left')
    }
    else {
      element.style.left = (pos.x - elementWidth + 5)+'px'
      element.style.top = (pos.y + 20)+'px'
      element.classList.add('left')
    }
  },0)
  
  element.querySelector('#attrItem').style.display = 
    attributes === undefined || Object.keys(attributes).length === 0 || editor.selectedModuleIds.size > 1 ? 'none' : 'flex'
  
  moduleAttributes = attributes
} 
  
function createModuleContextMenu(editor) {
  const element = make('div', { className: 'moduleContextMenu' })
  
  const deleteBtn = make('div', {}, [
    make('button', { id: 'delete' }),
    make('div', {html: L.get('delete')})
  ])
  deleteBtn.addEventListener('pointerdown', e => {
    editor.messageHandler?.({action: 'delete'})
  })
  element.appendChild(deleteBtn)
  
  const duplicateBtn = make('div', {}, [
    make('button', { id: 'duplicate' }),
    make('div', {html: L.get('duplicate')})
  ])
  duplicateBtn.addEventListener('pointerdown', e => {
    editor.messageHandler?.({action: 'duplicate'})
  })
  element.appendChild(duplicateBtn)
  
  const attributesBtn = make('div', { id: 'attrItem' }, [
    make('button', { id: 'attributes' }),
    make('div', {html: L.get('attributes')})
  ])
  const handler = () => attributesDialog(editor)
  attributesBtn.addEventListener('pointerdown', handler)
  element.appendChild(attributesBtn)
  
  editor.contentDIV.appendChild(element)
  editor.contentDIV.addEventListener('pointerdown', () => { element.style.top = '-999px' })
  
  return element
}

async function attributesDialog(editor) {
  const attrs = {}
  for(const [key, val] of Object.entries(moduleAttributes)) {
    if(Array.isArray(val)) {
      attrs[key] = {label: L.get(key), value: val[val.length - 1], options: val.slice(0, -1)}
    }
    else {
      attrs[key] = {label: L.get(key), value: val}
    }
  }

  const res = await dialogBox.prompt(L.get('attributes'), attrs)
  if(res) {
    editor.setAttributesForSelected(res)
  }
}
