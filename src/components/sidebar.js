import { encylopaediaExists } from '../encyclopaedia/encyclopaedia.js'
import { L } from '../i18n/language.js'
import { storage } from '../utils/storage.js'
import { make } from '../utils/make.js'
import pkg from '../../package.json'

export function sidebar(container, messageHandler) {
  container.appendChild(make('button', { id: 'sidebarBtn', className: 'hamburgerBtn' }))  
  
  const menu = (make('div', {id: 'sidebarMenu', className: 'glassEfx'}, [
    make('div', {id: 'top'}, [
      make('button', {id: 'workspace', html: L.get('workspace')}),
      make('button', {id: 'examplesView', html: L.get('examples')}),
    ]),
    make('div', {id: 'bottom'}, [
      make('button', {id: 'settings', html: L.get('Settings')}),
      make('button', {id: 'about', html: L.get('aboutAmbar')}),
      make('button', {id: 'github', html: 'GitHub' }),
      make('button', {id: 'legal', html: L.get('Legal')})
    ])
  ]))
  container.appendChild(menu)
  
  if(encylopaediaExists(L.getLanguage())) {
    menu.querySelector('#top').appendChild(
      make('button', {id: 'encyclopaediaView', html: L.get('encyclopaedia')})
    )
  }  
  
  window.addEventListener('pointerdown', handleSidebarBtn)
    
  menu.addEventListener('pointerdown', e => {
    if(!e.target.classList.contains('selected')) {
      if(e.target.id === 'github') {
        const url = pkg.repository.url.replace(/^git\+/, "")
        window.open(url, "_blank", "noopener,noreferrer")
      }
      else {
        if(menu.classList.contains('show')) {
         setTimeout(() => { messageHandler?.({ view: e.target.id }) }, 100)
        }
        else {
          messageHandler?.({ view: e.target.id })
        }
      }
    }
  })

  container.querySelector(`#${storage.state.get().view}`)?.classList.add('selected')  
}

const handleSidebarBtn = e => {
  const sidebarBtn = document.querySelector('#sidebarBtn')
  if(!sidebarBtn) return
  
  if(e.target.id === 'sidebarBtn') {
    sidebarBtn.style.display = 'none'
    document.querySelector('#sidebarMenu')?.classList.add('show')
  }
  else {
    sidebarBtn.style.display = 'block'
    document.querySelector('#sidebarMenu')?.classList.remove('show')
  }
}
