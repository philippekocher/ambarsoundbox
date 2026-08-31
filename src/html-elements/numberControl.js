export class numberControl extends HTMLElement {
  static observedAttributes = ['label','value','min','max','precision','disabled','colour']

  constructor() {
    super()
    
		this.min = -Infinity
		this.max = Infinity
		this.precision = 2
		this.label
		this.uom
		this.value = 0

    this.colour = '#000'

    // bindings
//     this.onPointerDown = this.onPointerDown.bind(this)
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
			case "value":
			  this.value = parseFloat(newValue)
        if(this.shadow) 
          this.shadow.querySelector("#textbox").value = this.value.toFixed(this.precision) + this.uom
  	    const event = new InputEvent("input")
    	  this.dispatchEvent(event)
			  break

			case "min":
			case "max":
				this[name] = parseFloat(newValue)
				break
			
			case "precision":
				this[name] = parseInt(newValue)
				break
				
       case "disabled":
          this.disabled = newValue == 'true' ? true : false
          break

      case "colour":
        this.colour = newValue
        break
                    
			default:
				this[name] = newValue;      
		}
	}
  
  render() {
    this.shadow = this.attachShadow({ mode: "open" })
    const size = this.getBoundingClientRect().width
    const value = this.value.toFixed(this.precision)
    const disabled = this.disabled ? 'disabled' : ''
    this.uom = this.uom == undefined ? '' : ' '+this.uom
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
      #textbox:focus {
        outline: none;
        background-color: #fff;
        border: 1px solid #0004;
      }
			#label {
			  margin: 4px 4px 4px 0;
        font-size: 10px;
        font-weight: bold;
			  color:  ${this.colour};
			}
			</style>`
		if(this.label) this.shadow.innerHTML += `<span id="label">${this.label}</span>`
		this.shadow.innerHTML += `<input id="textbox" type="text" value="${value+this.uom}" ${disabled}></input>`
  }
  
	onKeyDown(e) {
		if(e.keyCode == 13) e.target.blur()
		e.stopPropagation()
	}
	
	onInput(e) {
	  this.shadow.querySelector('#textbox').value = e.target.value.toFixed(this.precision) + this.uom
	}
	
	onTextInput(e) {
	  e.stopPropagation()
	}

  onChange(e) {
		const newValue = parseFloat(e.target.value)
		if(!isNaN(newValue) && newValue >= this.min && newValue <= this.max) {
			this.value = newValue
			
	    const event = new InputEvent("input")
  	  this.dispatchEvent(event)
    }
    e.target.value = this.value.toFixed(this.precision) + this.uom
	}
}

customElements.define("number-control", numberControl);
