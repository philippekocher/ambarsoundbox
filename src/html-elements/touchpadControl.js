export class touchpadControl extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.value = [0,0] // Default state
    this.valueIsFinal = true
    this.disabled = false
  }
  
  static get observedAttributes() {
    return ['value', 'disabled']
  }
  
  connectedCallback() {
    this.render()
    this.updateMarker()
  }
  
  disconnectedCallback() {
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
//     console.log(`Attribute ${name} has changed to ${newValue}.`)
    if(name === 'value') {
      this.value = newValue.split(',')
      this.updateMarker()
    }
    if(name === 'disabled') {
      this.disabled = newValue == 'true' ? true : false
    }
  }
  
  render() {
    this.shadowRoot.innerHTML = ''
    
    const style = document.createElement('style')
//     style.textContent = ':host { width: 20vw !important; height: 20vw; } #box { width: 100%; height: 100%; margin: auto; background-color: #0008; position: relative; border-radius: 11px; } #marker { position: absolute; width: 20px; height: 20px; background-color: #fff8; border-radius: 50%; pointer-events: none; border: 1px solid #0008 }'
    style.textContent = ':host { width: 190px !important; height: 190px; } #box { width: 100%; height: 100%; margin: auto; background-color: #0008; position: relative; border-radius: 11px; } #marker { position: absolute; width: 20px; height: 20px; background-color: #fff8; border-radius: 50%; pointer-events: none; border: 1px solid #0008 }'
    this.shadowRoot.appendChild(style)
    
    this.box = document.createElement('div')
    this.box.id = 'box'
    this.shadowRoot.appendChild(this.box)
  
    this.handle = document.createElement('div')
    this.handle.id = 'marker'
    this.box.appendChild(this.handle)
    
    this.box.onpointerdown = e => {
      if(!this.disabled) {
        this.valueIsFinal = false
        this.box.setPointerCapture(e.pointerId);
        this.updatePosition(e)
        this.box.onpointermove = e => { 
          this.updatePosition(e)
        }
      }
    }
    this.box.onpointerup = e => { 
      if(!this.disabled) {
        this.box.onpointermove = null
        this.valueIsFinal = true
        this.updatePosition(e)
      }
    }  
  }
  
  updateMarker() {
    if(!this.box || !this.handle) return
    const width = this.box.offsetWidth - this.handle.offsetWidth
    this.handle.style.left = `${this.value[0] * width}px`
    this.handle.style.top = `${this.value[1] * width}px`
  }
  
  updatePosition(e) {
    const boxRect = this.box.getBoundingClientRect()
    const handleWidth = this.handle.offsetWidth   
    this.value = [
      Math.min(1, Math.max(0, (e.clientX - boxRect.x - handleWidth * 0.5) / (boxRect.width - handleWidth))),
      Math.min(1, Math.max(0, (e.clientY - boxRect.y - handleWidth * 0.5) / (boxRect.width - handleWidth)))
    ]    
    this.updateMarker()
    const event = new InputEvent("input")
    this.dispatchEvent(event)
  }
}

customElements.define("touchpad-control", touchpadControl)
