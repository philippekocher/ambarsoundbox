export class textControl extends HTMLElement {
  static observedAttributes = ['label','value','active']

  constructor() {
    super()
    
		this.label
		this.value = ''
		this.active = false

    // bindings
    this.onChange = this.onChange.bind(this)
    this.onInput = this.onInput.bind(this)
  }

  connectedCallback() {
//     console.log("File button added to page.")
    this.render()
    
    // attach events
    this.shadow.querySelector('#textbox').addEventListener('keydown', this.onKeyDown)
    this.shadow.querySelector('#textbox').addEventListener('blur', this.onChange)
    this.shadow.querySelector('#textbox').addEventListener('input', this.onTextInput)
    this.addEventListener('input', this.onInput)
  }

  attributeChangedCallback(name, oldValue, newValue) {
//     console.log(`Attribute ${name} has changed.`)
		switch(name) {
			case 'value':
        this.value = newValue.trim()
        this.outputIsBool = false
//         const event = new InputEvent("input")
//         this.dispatchEvent(event)
        if(this.shadow) 
          this.shadow.querySelector("#textbox").value = this.value
			  break
			case 'active':
			  this.active = parseInt(newValue) != 0
			  if(this.shadow) this.shadow.querySelector('#textbox').className = this.active ? 'active' : ''
              break
			default:
				this[name] = newValue;      
		}
	}
  
  render() {
    this.shadow = this.attachShadow({ mode: "open" })
    const size = this.getBoundingClientRect().width
    const value = this.value
    this.shadow.innerHTML = `<style>
			:host {
      	display: inline;
        --text-color: #000;
      }
      :host(.disabled) {
        --text-color: #aaa;
        pointer-events: none
      }
      #textbox {
	      height: 20px;
				border-radius: 4px;
				font-size: 10px;
				font-weight: 700;
        color: var(--text-color);
        background-color: #fffb;
        outline: none;
        border: 1px solid #fff0;
				padding-left: 5px;
        max-width: ${size - 21}px;
        margin: 0 auto 0 auto;
			}
			#textbox.active {
			  background: #222;
			  color: #fff;
			}
      #textbox:focus {
        outline: none;
        background-color: #fff;
        color: var(--text-color);
        border: 1px solid #0004;
      }
			span {
			  margin: 4px 4px 0 0;
			  font-size: 12px;
			}
			</style>`
		if(this.label) this.shadow.innerHTML += `<span>${this.label}</span>`
		this.shadow.innerHTML += `<input id="textbox" class="on" type="text" value="${value}"></input>`
  }
  
	onKeyDown(e) {
		if(e.keyCode == 13) e.target.blur()
		e.stopPropagation()
	}
	
	onInput(e) {
	  this.shadow.querySelector('#textbox').value = e.target.value
	}
	
	onTextInput(e) {
	  e.stopPropagation()
	}

  onChange(e) {
		this.value = e.target.value.trim()
    this.outputIsBool = false
    
    const event = new InputEvent("input")
 	  this.dispatchEvent(event)

    e.target.value = this.value
	}
}

customElements.define("text-control", textControl);
