import { make } from '../utils/make.js'
import { storage } from '../utils/storage.js'
import { L } from "../i18n/language.js"
import { infobox } from './infobox.js'
import { modules } from '../modules/modules.gen.js'

const instances = new WeakMap()

function getState(parent) {
  let state = instances.get(parent)
  if (!state) {
    state = { topbar: null, palette: null, menu: null }
    instances.set(parent, state)
  }
  return state
}

export function createToolbar(type, args) {
  const state = getState(args.parent)
  state.topbar = args.parent.querySelector('#topbar') || args.parent.appendChild(make('div', {id: 'topbar'}))
  if(type === 'navigation') navigationMenu(args, state)
  if(type === 'reset') resetMenu(args, state)
  if(type === 'palette') paletteMenu(args, state)  
  if(type === 'actions') actionsMenu(args, state)
  return state.topbar
}

// ---------------------------------------------------------------------------------------

function navigationMenu(args, state) {
  const div = make('div', {className: 'toolbar glassEfx'})
  const messageHandler = args.messageHandler
  const view = storage.state.get().view
  
  state.topbar.appendChild(div)

  const home = make('button', {id: 'home', title: L.get('page_home') })
  home.addEventListener('pointerdown', () => {
    messageHandler?.({view: 'workspace'})
  })
  div.appendChild(home)

  const build = make('button', {id: 'build', title: L.get('view_build') })
  if(view == 'build') build.classList.add('on')
  build.addEventListener('pointerdown', () => {
    if(!build.classList.contains('on'))
      messageHandler?.({view: 'build'})
  })
  div.appendChild(build)

  const play = make('button', {id: 'play', title: L.get('view_play')})
  if(view == 'play') play.classList.add('on')
  play.addEventListener('pointerdown', () => {
    if(!play.classList.contains('on'))
      messageHandler?.({view: 'play'})
  })
  div.appendChild(play)

  const layout = make('button', {id: 'layout', title: L.get('view_layout')})
  if(view == 'layout') layout.classList.add('on')
  layout.addEventListener('pointerdown', () => {
    if(!layout.classList.contains('on'))
      messageHandler?.({view: 'layout'})
  })
  div.appendChild(layout)
}

// ---------------------------------------------------------------------------------------

function resetMenu(args, state) {
		const div = make('div', {className: 'toolbar glassEfx'})
		const messageHandler = args.messageHandler
		
		state.topbar.appendChild(div)

    const resetBtn = make('button', {id: 'resetBtn', title: L.get('reset') })
    resetBtn.addEventListener('pointerdown', () => {
      messageHandler?.({action: 'reset'})
    })
    div.appendChild(resetBtn)
}
// ---------------------------------------------------------------------------------------

function paletteMenu(args, state) {
  const div = make('div', {className: 'toolbar glassEfx'})
  const messageHandler = args.messageHandler
  const parent = args.parent
  
  state.topbar.appendChild(div)
  
  const btn = make('button', {id: 'paletteBtn', title: L.get('palette') })
  btn.addEventListener('pointerdown', e => {
    e.stopPropagation()
    btn.classList.toggle('on') 
    state.palette?.classList.toggle('show')
    state.menu?.classList.remove('show')
    parent.querySelector('.hamburgerBtn')?.classList.remove('on');  
  
    setTimeout(() => {
      const btnRect = btn.getBoundingClientRect()
      const parentRect = args.parent.getBoundingClientRect()
      const paletteRect = state.palette.getBoundingClientRect()
      state.palette.style.left = Math.max(0, btnRect.left - parentRect.left + btnRect.width * 0.5 - paletteRect.width * 0.5) + 'px'
    }, 0)
  })
  div.appendChild(btn)
  
  state.palette = make('div', {className: 'toolbar palette glassEfx' })
  state.topbar.appendChild(state.palette)      
  buildPalette(state, parent)
}

function buildPalette(state, parent) {

  // group the units by category
  // todo: filter the units that should be hidden
  const unitsByCategory = {}
  for(const [key, unit] of Object.entries(modules)) {
    const def = unit['definition']
    if(def) {
      unitsByCategory[def.category] ??= []
      unitsByCategory[def.category].push([key, def])
    }
  }
  
  for(const cat of ['io','generator','processor','utility','gui']) {
    let catnavigation = make('div', {className: 'catnavigation category_'+cat }) // category navigation
    
    let div = make('div', {
      className: 'cat', 
      html: '<span class="icon" id="'+cat+'">&nbsp;</span> ' + L.get('category_'+cat)})
    div.addEventListener('pointerdown', e => {
      e.stopPropagation()
      for(let cc of parent.getElementsByClassName('catnavigation')) {
        if(cc != catnavigation) {
          cc.classList.remove('disclosed')
        }
      }
      catnavigation.classList.toggle('disclosed')
    })
    catnavigation.appendChild(div)
    
    let moduleList = make('div', {className: 'moduleList'}) // unit list
    catnavigation.appendChild(moduleList)
    
    let inner = make('div', {className: 'inner'})
    moduleList.appendChild(inner)
    
    for (const [key, unit] of unitsByCategory[cat] ?? []) {
      const item = make('div', {draggable: 'true'})
      if(unit.nameIsSymbol) {
        item.innerHTML = '<span style="font-size: 1.5em; line-height: 0.85;">'+L.replace(unit.name)+'</span>'
      }
      else {
        item.innerHTML = L.replace(unit.name)            
      }
      item.className = 'modulePlaceholder category_'+cat
      item.ondragstart = e => {
        const xOffset = e.clientX - (e.currentTarget.getBoundingClientRect()).x
        const yOffset = e.clientY - (e.currentTarget.getBoundingClientRect()).y
        e.dataTransfer.setData('xOffset', xOffset)
        e.dataTransfer.setData('yOffset', yOffset)
        e.dataTransfer.setData('class', key)           

        // set the drag image
        const ghost = e.currentTarget.cloneNode(true)
        ghost.style.position = 'absolute'
        ghost.style.top = '-9999px'
        document.body.appendChild(ghost)
        e.dataTransfer.setDragImage(ghost, xOffset, yOffset)
        setTimeout(() => {
          ghost.remove()
          state.palette.classList.remove('show') 
          parent.querySelector('#paletteBtn')?.classList.remove('on');
        }, 200)
        // hide the palette after 0.2s
        
        e.currentTarget.classList.add('dragging')  
      }
      
      item.ondragend = e => {
        e.currentTarget.classList.remove('dragging')
      }
      
      item.onpointerdown = e => { 
        e.stopPropagation()
        infobox(parent, key)
      }
                        
      inner.appendChild(item)
    }
    state.palette.appendChild(catnavigation)  								
  }
}	

// ---------------------------------------------------------------------------------------

function actionsMenu(args, state) {
  const div = make('div', {className: 'toolbar glassEfx'})
  const messageHandler = args.messageHandler
  const parent = args.parent
  const showMenu = args.showMenu
  
  state.topbar.appendChild(div)
  
  args.parent.addEventListener('pointerdown', e => {
    e.stopPropagation()
    if(e.target.id === 'audio') {
      messageHandler?.({action: 'toggleAudio', callback: (data) => {
        if(data.audio) div.querySelector('#audio').classList.add('on')
        else           div.querySelector('#audio').classList.remove('on')
      }})
    }
    else if(e.target.id === 'actionMenu') {
      state.palette?.classList.remove('show')
      parent.querySelector('#paletteBtn')?.classList.remove('on');
      state.menu?.classList.toggle('show')
      e.target.classList.toggle('on')
      return
    }
    else if(e.target.id === 'undo') {
      messageHandler?.({action: 'undo'})
    }
    else if(e.target.id === 'redo') {
      messageHandler?.({action: 'redo'})
    }	
    else if(e.target.id === 'cut') {
      messageHandler?.({action: 'cut'})
    }	
    else if(e.target.id === 'copy') {
      messageHandler?.({action: 'copy'})
    }	
    else if(e.target.id === 'paste') {
      messageHandler?.({action: 'paste'})
    }	
    else if(e.target.id === 'encapsulate') {
      messageHandler?.({action: 'encapsulate'})
    }	
    else if(e.target.id === 'download') {
      messageHandler?.({action: 'downloadPatch'})
    }
    
    state.menu?.classList.remove('show')	  
    state.palette?.classList.remove('show')
    parent.querySelector('#paletteBtn')?.classList.remove('on');
    parent.querySelector('.hamburgerBtn')?.classList.remove('on');
    
  })
  
  div.appendChild(make('button', {id: 'audio'}))
  if(showMenu) { 
    div.appendChild(make('button', {id: 'actionMenu', className: 'hamburgerBtn'})) }

//   	const recordButton = make('button')
//   	recordButton.setAttribute('id', 'recordBtn')
//   	this.div.appendChild(recordButton)

  messageHandler?.({action: 'getAudioState', callback: (data) => { 
    if(data.audio) div.querySelector('#audio').classList.add('on')
  }})
  
  state.menu = make('div', {className: 'toolbar menu glassEfx'})
  if(showMenu) {
    state.menu.appendChild(make('button', {id: 'undo', html: L.get('undo')}))
    state.menu.appendChild(make('button', {id: 'redo', html: L.get('redo')}))
    state.menu.appendChild(make('hr'))
    state.menu.appendChild(make('button', {id: 'cut', html: L.get('cut')}))
    state.menu.appendChild(make('button', {id: 'copy', html: L.get('copy')}))
    state.menu.appendChild(make('button', {id: 'paste', html: L.get('paste')}))
    state.menu.appendChild(make('hr'))
    state.menu.appendChild(make('button', {id: 'encapsulate', html: L.get('createSubpatch')}))
    state.menu.appendChild(make('hr'))
    state.menu.appendChild(make('button', {id: 'download', html: L.get('download')}))
    state.topbar.appendChild(state.menu)
  }  
}