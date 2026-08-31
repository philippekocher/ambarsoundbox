export class buttonControl extends HTMLElement {
  static observedAttributes = ['value','shape','disabled']

  constructor() {
    super()
    
		this.value = 0
		this.text = ['','']
		this.action = [undefined, undefined]	

    // bindings
    this.doAction = this.doAction.bind(this)
    this.release = this.release.bind(this)
  }

  connectedCallback() {
//     console.log("File button added to page.")
    this.render()
    
    // attach events
    this.shadow.querySelector('#btn').addEventListener("pointerdown", this.doAction)
    this.shadow.querySelector('#btn').addEventListener("pointerup", this.release)
  }

  attributeChangedCallback(name, oldValue, newValue) {
//     console.log(`Attribute ${name} has changed to ${newValue}.`)
		switch(name) {
			case 'value':
			  const val = parseInt(newValue)
				this.value = val
        if(this.shadow) {
          this.shadow.querySelector('#btn').innerHTML = this.text[this.value]
          if(val == 0) this.shadow.querySelector('#btn').classList.remove('selected')
          else this.shadow.querySelector('#btn').classList.add('selected')
        }
				break

      case 'shape':
        this.shape = newValue
        break

      case 'disabled':
        this.disabled = newValue == 'true' ? true : false
        break
		}
	}
  
  render() {
    this.shadow = this.attachShadow({ mode: 'open' })
    this.text = Array.isArray(this.text) ? this.text : [this.text, this.text]
    const shape = this.shape == 'square' ? 'height: 55px; margin-bottom: 10px;' : 'min-height: 1em;'
    const classList = this.value == 1 ? 'btn selected' : 'btn'
    this.shadow.innerHTML = `<style>
			:host {
      	display: inline;
        --text-color: #000;
      }
      :host(.disabled) {
        --text-color: #aaa;
        pointer-events: none
      }
      #btn {
        display: block;
        cursor: pointer;
        width: 80%;
        height: 80%;
        margin: auto;
        padding: 4.5px 0 3.5px 0;
        background-color: #fffb;
        border: 1px solid #0003;
        border-radius: 20px;
        font-size: 12px;
        ${shape}
      }
      #btn.selected {
        background-color: #fff;
        border: 1px solid #000;
      }
      </style>
			<div id="btn" class="${classList}">${this.text[this.value]}</div>`
  }
  
  doAction(e) {
    if(!this.disabled) {
      if(Array.isArray(this.action)) this.action[this.value]?.(e)
      else this.action?.(e)

//       this.shadow.querySelector('#btn').classList.add('selected')
    }
  }
  
  release() {
//     this.shadow.querySelector('#btn').classList.remove('selected')  
  }
}

customElements.define("button-control", buttonControl);
