import { modalWindow } from './modalWindow.js'
import { L } from '../i18n/language.js'
import { make } from '../utils/make.js'

export const dialogBox = {
  info: (text = 'info', buttonText = L.get('close')) => {
    return new Promise((resolve) => { 
      const window = document.querySelector('#dialogBox') || createDialogBox()
      window.innerHTML = ''
      window.appendChild(make('div', { className: 'item' }, [
        (make('h3', { html: text } ))
      ]))  
      const btns = window.appendChild(make('div', { className: 'item buttons' }))
      const button = make('button', { className: 'btn important', id: '', text: buttonText })
      btns.appendChild(button)
      button.onpointerdown = () => {
        window.show(false)
        resolve(true)
      }
      window.onkeydown = e => {
        if(window.classList.contains('active') && e.keyCode == 13) {
          window.show(false)
          resolve(true)
        }
      }
      requestAnimationFrame(() => { button.focus() })
        
      window.show()
    })
  },

  
  confirm: (userArgs) => {
    const args = {text: 'really?', buttonText: { yes: L.get('yes'), no: L.get('no')}}
    Object.assign(args, userArgs)
    return new Promise((resolve) => { 
      const window = document.querySelector('#dialogBox') || createDialogBox()
      
      window.innerHTML = ''
      window.appendChild(make('div', { className: 'item' }, [
        (make('h3', {html: args.text} ))
      ]))  
      
      if(args.addText) {
        window.appendChild(make('div', { className: 'item', html: args.addText }))
      }

      const btns = window.appendChild(make('div', { className: 'item buttons' }))
      if(args.buttonText.yes) {
        const yesButton = make('button', { className: 'btn important', id: '', text: args.buttonText.yes })
        btns.appendChild(yesButton)
        yesButton.addEventListener('pointerdown', () => {
          window.show(false)
          resolve(true)
        })
        window.onkeydown = e => {
          if(window.classList.contains('active') && e.keyCode == 13) {
            window.show(false)
            resolve(true)
          }
        }
        requestAnimationFrame(() => { yesButton.focus() })
      }
      
      if(args.buttonText.button) {
       args.buttonText.buttons = [args.buttonText.button]
      }
      
      if(args.buttonText.buttons) {
        let x = 0
        for(const button of args.buttonText.buttons) {
          const midButton = make('button', { className: 'btn', id: '', text: button })
          const idx = x
          btns.appendChild(midButton)
          midButton.onpointerdown = () => {
            window.show(false)
            resolve(idx)
          }
          x++
        }
      }
      
      if(args.buttonText?.no) {
        const noButton = make('button', { className: 'btn', id: '', text: args.buttonText.no })
        btns.appendChild(noButton)
        noButton.addEventListener('pointerdown', () => {
          window.show(false)
          resolve(false)
        })
      }

      window.show()

    })
  },
  
  prompt: (text, fields = {}, buttonText = { submit: L.get('save'), cancel: L.get('cancel')} ) => {
    return new Promise((resolve) => { 
  
      const window = document.querySelector('#dialogBox') || createDialogBox()
      const inputs = {}
      let firstInput
      const submit = () => {
      for(const input in inputs) {
        if(inputs[input].type === 'checkbox') inputs[input] = inputs[input].checked
        else inputs[input] = inputs[input].value
      }
        window.show(false)
        resolve(inputs)
      }
      
      window.innerHTML = ''
      window.appendChild(make('div', { className: 'item' }, [
        (make('h2', {text: text} ))
      ]))
      const sizer = window.appendChild(make('span', {className: 'sizer'}))
      for(const [key, field] of Object.entries(fields)) {
        if(typeof field.value === 'boolean') {
          inputs[key] = make('input', {type: 'checkbox', checked: field.value})
       }

       else if(field.options) {
          inputs[key] = make('select', {})
          for(let i=0; i < field.options.length; i++) {
            const v = field.options[i]
            const opt = (make('option', { value: v, html: L.get(v)}))
            if(i == field.value) opt.selected = true
            inputs[key].appendChild(opt)
          }
        }
        else if(field.textToCopy) {
          const button = make('button', {id: 'copy'})
          const input = make('input', {type: 'text'})
          inputs[key] = make('div', {className: 'wrapper'}, [ input, button ])
          input.value = field.textToCopy
          sizer.textContent = field.textToCopy
          input.style.width = sizer.offsetWidth + 40 + 'px'

          button.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(field.textToCopy)
              input.value = L.get('copiedToClipboard')
              input.classList.add('copied')
          
              setTimeout(() => {
                input.classList.remove('copied')
                input.value = field.textToCopy
              }, 1500)
            } catch (err) {
              console.error('Copy failed')
            }
          })
        }
        else {
          inputs[key] = make('input', {type: 'text'})
          const text = field.text || field.value
          if(text) {
            inputs[key].value = text
            sizer.textContent = text
            inputs[key].style.width = sizer.offsetWidth + 4 + 'px'
          }
       }
                
        const input = window.appendChild(make('div', { className: 'item' }))
        if(field.label) input.appendChild(make('div', { text: `${field.label}:` }))
        input.appendChild(inputs[key])
        
        if(!firstInput) firstInput = inputs[key]  
      }

      const btns = window.appendChild(make('div', { className: 'item buttons' }))

      if(buttonText.submit) {
        const submitButton = make('button', { className: 'important', id: '', text: buttonText.submit })
        submitButton.addEventListener('pointerdown', submit)
        btns.appendChild(submitButton)
      }
      if(buttonText.cancel) {
        const cancelButton = make('button', { className: 'btn', id: '', text: buttonText.cancel })
        cancelButton.addEventListener('pointerdown', () => {
          window.show(false)
          resolve(false)
        })
        btns.appendChild(cancelButton)
      }
    
//       if(errorMessage) {
//         window.appendChild(make('div', { className: 'feedback error', text: errorMessage, style: 'display: block' }))
//       }
      
      window.onkeydown = e => {
        e.stopPropagation()
        if(window.classList.contains('active') && e.keyCode == 13) {
          submit() 
        }
      }
    
      window.show()
      
      // select first textbox
      requestAnimationFrame(() => { 
        if(firstInput.type === 'text') {
          firstInput?.select(); firstInput?.focus()
        }
      })
    })
  }  
}
  
const createDialogBox = () => {
  const window = modalWindow()
  window.id = 'dialogBox'
  document.body.appendChild(window)
  return window
}