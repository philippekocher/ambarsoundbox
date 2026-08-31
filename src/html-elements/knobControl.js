export class knobControl extends HTMLElement {   
    static observedAttributes = ["value", "disabled", "precision", "min", "max", "curve", "label", "uom", "colour"]
    
    constructor() {
      super()
      this.bind(this);
      
      this.center = {}
      this.precision = 2
      this.min = 0
      this.max = 1.0
      this.curve = 0
      this.label = ''
      this.uom
      this.knobSize = 30
      this.value = this.min
      this.valueIsFinal = true
      this.rad = 0
      this.colour = '#555'
    }
    fireEvent(isFinal) {
      this.valueIsFinal = isFinal
      const event = new InputEvent("input")
      this.dispatchEvent(event)
    }
    bind(element){
      this.render = this.render.bind(element)
      this.cacheDom = this.cacheDom.bind(element)
      this.attachEvents = this.attachEvents.bind(element)
      this.onPointerDown = this.onPointerDown.bind(element)
      this.onPointerMove = this.onPointerMove.bind(element)
      this.onPointerUp = this.onPointerUp.bind(element)
      this.onChangeText = this.onChangeText.bind(element)
    }
    render(){
      this.shadow = this.attachShadow({ mode: "open" })
      const size = this.getBoundingClientRect().width
      const deg = this.valueToDeg(this.value)
      const value = this.value.toFixed(this.precision)
      const disabled = this.disabled ? 'disabled' : ''
      this.uom = this.uom == undefined ? '' : ' '+this.uom
      this.shadow.innerHTML = `
          <style>
              :host {
                   display: inline-flex;
                   width: ${this.knobSize * 2.8}px;
                   --knob-stroke-color: #000;
                   --text-color: #000;
                   --text-error-color: #faa;
                   --background-color: #fffb;
                   --auxiliary-colour: ${this.colour};
              }
              :host(.disabled) {
                   --knob-stroke-color: #aaa;
                   --text-color: #aaa;
                  pointer-events: none;
              }
              #container {
                position: relative;
                width: 100%;
                height: ${this.knobSize + 48}px;
                text-align: center;
              }
              svg {
                width: 100%;
                overflow: visible;
                margin: ${ this.label != '' ? '18px' : '8px' } 0 4px 0;
             }
              #knob {
                r : ${this.knobSize * 0.5}px;
                cx : 50%;
                cy : 50%;
                fill: var(--background-color);
              }
              #auxiliary {
                cx : 50%;
                cy : 50%;
                fill: none;
                stroke-dasharray: 1,2;
                stroke: var(--auxiliary-colour);
                visibility: none;
              }
              #pointer {
                stroke: var(--knob-stroke-color);
                transform-origin: center center;
              }
              #auxiliary_pointer {
                stroke-width: 1px;
                stroke: var(--auxiliary-colour);
                stroke-dasharray: 1,2;
              }
              #label {
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                white-space: nowrap;
                font-size: 10px;
                font-weight: bold;
                margin: 0 0 6px 0;
                color: var(--text-color)
              }
              #textbox {
                margin: 0 auto 0 auto;
                padding-left: 2px;
                border-radius: 4px;
                background-color: var(--background-color);
                outline: none;
                border: 1px solid #fff0;
                color: var(--text-color);
                max-width: ${size - 15}px;
                height: 20px;
                font-size: 10px;
                font-weight: 700;
              }
              #textbox:focus {
                outline: none;
                background-color: #fff;
                border: 1px solid #0004;
              }
          </style>
          <div id="container">
            <div id="label">${this.label}</div>
            <svg viewBox="0 0 ${size} ${this.knobSize}">
                <circle id="auxiliary" />
                <line x1="50%" y1="50%" x2="50%" y2="50%" id="auxiliary_pointer" />       
                <circle id="knob" stroke-width="0" />                
                <line x1="50%" y1="50%" x2="${size * 0.5 + this.knobSize * 0.5}px" y2="50%" transform="rotate(${deg})" id="pointer" />
            </svg>
            <input id="textbox" type="text" value="${value+this.uom}" ${disabled}></input>
          </div>
      `;
    }
    connectedCallback() {
      this.render();
      this.cacheDom();
      this.attachEvents();
    }
    cacheDom(){
      this.dom = {
          knob: this.shadow.querySelector("#knob"),
          pointer: this.shadow.querySelector("#pointer"),
          auxiliary: this.shadow.querySelector("#auxiliary"),
          auxiliary_pointer: this.shadow.querySelector("#auxiliary_pointer"),
          textbox: this.shadow.querySelector("#textbox"),
          svg: this.shadow.querySelector("svg")
      };
      
      const rect = this.dom.svg.getBoundingClientRect();
    }
    attachEvents(){
      this.dom.svg.addEventListener("pointerdown", this.onPointerDown)
      this.dom.textbox.addEventListener("keydown", this.onKeyDown)
      this.dom.textbox.addEventListener("blur", this.onChangeText)
      this.dom.textbox.addEventListener("input", this.onInput)
    }
    onPointerDown(e) {
      if(this.disabled) return
      const rect = this.dom.svg.getBoundingClientRect();
      this.center = { x: rect.x + (rect.width / 2), y: rect.y + (rect.height / 2) };
      this.dom.svg.addEventListener("pointermove", this.onPointerMove);
      this.dom.svg.addEventListener("pointerup", this.onPointerUp);
      this.dom.svg.setPointerCapture(e.pointerId);
    }
    onPointerMove(e){
      e.stopPropagation()
      e.preventDefault()
      e.target.style.cursor = 'pointer'
  
      const offsetX = e.clientX - this.center.x
      const offsetY = e.clientY - this.center.y
      let rad = Math.atan2(offsetY, offsetX)
      
      const lowerBound = Math.PI * 0.3;
      const upperBound = Math.PI * 0.7;

      if (this.rad === lowerBound && (rad > upperBound || rad < 0)) {
        rad = this.rad
      }
      else if (this.rad === upperBound && rad < lowerBound) {
        rad = this.rad
      }
      else if (rad < upperBound && rad > lowerBound) {
        rad = (rad < this.rad) ? upperBound : lowerBound;
      }
      this.rad = rad;
      
      let deg = (180 / Math.PI) * rad;
      
      const finalValue = this.degToValue(deg)
      const rect = this.dom.svg.getBoundingClientRect()
      const radius = Math.pow(offsetX * offsetX + offsetY * offsetY, 0.5)
      
      if(radius > this.knobSize * 0.5) {
        this.dom.svg.style.zIndex = 99;
        this.dom.pointer.setAttribute('transform', `rotate(${deg})`)
  
        this.dom.auxiliary.setAttribute('r', radius)
        this.dom.auxiliary_pointer.setAttribute('x2', Math.cos(rad) * radius + rect.width * 0.5)
        this.dom.auxiliary_pointer.setAttribute('y2', Math.sin(rad) * radius + this.knobSize * 0.5)
 
        this.dom.textbox.value = String(finalValue.toFixed(this.precision) + this.uom)
        this.value = finalValue
        this.fireEvent(false)
      }
      else {
        this.dom.svg.style.zIndex = 0
        this.dom.auxiliary.setAttribute('r', 0)
        this.dom.auxiliary_pointer.setAttribute('x2', '50%')
        this.dom.auxiliary_pointer.setAttribute('y2', '50%')
      }
    }
    onPointerUp(e){
    		e.target.style.cursor = 'auto'

        this.dom.svg.removeEventListener("pointermove", this.onPointerMove)
        this.dom.svg.removeEventListener("pointerup", this.onPointerUp)

        this.dom.auxiliary.setAttribute('r', 0)
        this.dom.auxiliary_pointer.setAttribute('x2', "50%")
        this.dom.auxiliary_pointer.setAttribute('y2', "50%")
        
       	this.dom.svg.style.zIndex = 0

        this.fireEvent(true);
    }
    onKeyDown(e) {
      if(e.keyCode == 13) e.target.blur()
      e.stopPropagation();
    }
    onInput(e) {
      e.stopPropagation()
    }
    onChangeText(e) {
      const newValue = parseFloat(e.target.value)
      
      if(!isNaN(newValue)) {
        this.value = Math.max(this.min, Math.min(this.max, newValue))
        
        // update knob
        const deg = this.valueToDeg(newValue)
 		    this.dom.pointer.setAttribute('transform', `rotate(${deg})`)
        
        this.fireEvent(true);
     }
     e.target.value = this.value.toFixed(this.precision) + this.uom
    }
    attributeChangedCallback(name, oldValue, newValue) {
//      console.log(`Attribute ${name} has changed to ${newValue}.`)
      switch(name) {
        case "min":
        case "max":
          this[name] = parseFloat(newValue)
          break

        case "value":
          this.value = Math.max(this.min, Math.min(this.max, parseFloat(newValue)))
          if(this.dom) {
            this.dom.textbox.value = this.value.toFixed(this.precision) + this.uom;
            const deg = this.valueToDeg(this.value)
 		        this.dom.pointer.setAttribute('transform', `rotate(${deg})`)
 		      }
          break
        
        case "precision":
          this[name] = parseInt(newValue)
          break
          
        case "colour":
          this.colour = newValue
          break
                    
       case "disabled":
          this.disabled = newValue == 'true' ? true : false
          break

        default:
          this[name] = newValue   
      }
    }
    degToValue(deg) {
      let norm = (234 + deg) % 360 / 288
      if(this.curve != 0) norm = Math.pow(norm, Math.exp(this.curve))
      return (this.max - this.min) * norm + this.min
    }
    valueToDeg(val) {
      let norm = (val - this.min) / (this.max - this.min)
      if(this.curve != 0) norm = Math.pow(norm, 1 / Math.exp(this.curve))
      return norm * 288 - 234
    }  
}

customElements.define("knob-control", knobControl);
