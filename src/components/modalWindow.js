import { make } from '../utils/make.js'

export function modalWindow() {
  const mask = document.querySelector('#mask') || createMask()
  const modWindow = make('div', { className: 'modalWindow' })
  
  modWindow.content = make('div')
  modWindow.appendChild(modWindow.content)
  
  // overwritten by subclasses
  modWindow.update = () => {}
  modWindow.onclose = () => {}
  
  modWindow.show = (visible = true) => {
    if (visible) {
        modWindow.update()
        modWindow.classList.add('active')
        const zIndex = window.getComputedStyle(modWindow).zIndex
        mask.style.zIndex = zIndex - 1
        mask.classList.add('active')
    } else {
        modWindow.classList.remove('active')
        mask.classList.remove('active')
        modWindow.onclose()
      }
  }

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
      modWindow.show(false)
    }
  })
  
  return modWindow
}

function createMask() {
  const mask = make('div', { id: 'mask' } )
  document.body.appendChild(mask)
    
  mask.addEventListener('pointerdown', () => {
    document.querySelectorAll('.modalWindow').forEach((w) => { 
      if(w.classList.contains('active')) w.show(false)
    })
  })

  return mask
}