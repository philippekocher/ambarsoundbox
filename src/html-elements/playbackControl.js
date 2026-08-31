export class playbackControl extends HTMLElement {
  static observedAttributes = ['value']

  constructor() {
    super()
    this.value = [false, false]

    // bindings
    this.togglePlay = this.togglePlay.bind(this)
    this.toggleLoop = this.toggleLoop.bind(this)

    this.render();
  }

  connectedCallback() {
    
    // attach events
    this.shadow.querySelector('#play').addEventListener("pointerdown", this.togglePlay)
    this.shadow.querySelector('#loop').addEventListener("pointerdown", this.toggleLoop)
  }

  attributeChangedCallback(name, oldValue, newValue) {
//       console.log(`Attribute ${name} has changed to ${newValue}.`)
    if(name == 'value') {
    	// new value comes as comma-separated string
    	this.value[0] = parseInt(newValue[0])
    	if(newValue[2]) this.value[1] = parseInt(newValue[2])
    	
    	if(this.value[0] == 0) {
    	  this.shadow.querySelector('#play').classList.remove('checked')
    	}
    	else {
      	this.shadow.querySelector('#play').classList.add('checked')
    	}
    	if(this.value[1] == 0) {
    	  this.shadow.querySelector('#loop').classList.remove('checked')
    	}
    	else {
      	this.shadow.querySelector('#loop').classList.add('checked')
    	}
    }
  }
  
  render() {
    this.shadow = this.attachShadow({ mode: "open" })
    this.shadow.innerHTML = `
      <style>
      :host(.disabled) #play { cursor: default; pointer-events: none }
      #container {
        margin: auto;
        width: 30px;
        height: 62px;
        padding: 10px;
        background-color: #fff9;
        border-radius: 6px;
      }
      #play {
        width: 28px;
        height: 28px;
        margin: 0px auto;
        cursor: pointer;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 18 18" fill="none"><path d="M15.9922 7.32068L4.17154 1.2383C3.83737 1.06627 3.46599 0.985017 3.0927 1.00227C2.7194 1.01953 2.3566 1.13472 2.03878 1.33689C1.72095 1.53906 1.45867 1.82149 1.27685 2.15735C1.09504 2.4932 0.999733 2.87131 1 3.25574V14.7443C0.999733 15.1287 1.09504 15.5068 1.27685 15.8427C1.45867 16.1785 1.72095 16.4609 2.03878 16.6631C2.3566 16.8653 2.7194 16.9805 3.0927 16.9977C3.46599 17.015 3.83737 16.9337 4.17154 16.7617L15.9922 10.6793C16.2951 10.5232 16.5498 10.2834 16.7278 9.98679C16.9057 9.69021 17 9.34854 17 9C17 8.65146 16.9057 8.30979 16.7278 8.01321C16.5498 7.71663 16.2951 7.47685 15.9922 7.32068Z" stroke="%23323232" stroke-opacity="0.8" stroke-linecap="round" stroke-linejoin="round" fill="%23fff"/></svg>') no-repeat center;
      }
      #play.checked {
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 18 18" fill="none"><path d="M15.9922 7.32068L4.17154 1.2383C3.83737 1.06627 3.46599 0.985017 3.0927 1.00227C2.7194 1.01953 2.3566 1.13472 2.03878 1.33689C1.72095 1.53906 1.45867 1.82149 1.27685 2.15735C1.09504 2.4932 0.999733 2.87131 1 3.25574V14.7443C0.999733 15.1287 1.09504 15.5068 1.27685 15.8427C1.45867 16.1785 1.72095 16.4609 2.03878 16.6631C2.3566 16.8653 2.7194 16.9805 3.0927 16.9977C3.46599 17.015 3.83737 16.9337 4.17154 16.7617L15.9922 10.6793C16.2951 10.5232 16.5498 10.2834 16.7278 9.98679C16.9057 9.69021 17 9.34854 17 9C17 8.65146 16.9057 8.30979 16.7278 8.01321C16.5498 7.71663 16.2951 7.47685 15.9922 7.32068Z" stroke="%23323232" stroke-opacity="0.8" fill="%23323232" stroke-linecap="round" stroke-linejoin="round"/></svg>') no-repeat center;
      }
      #loop {
        width: 28px;
        height: 28px;
        margin: 8px auto;
        cursor: pointer;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 21 21" fill="none"><path d="M2.795 1H8.25C8.52184 1 8.78256 1.10799 8.97478 1.30022C9.16701 1.49244 9.275 1.75315 9.275 2.025V7.35C9.275 8.21 8.32 8.72 7.775 8.175L6.035 6.425C5.32918 7.19315 4.82151 8.12195 4.55604 9.13079C4.29057 10.1396 4.27533 11.198 4.51165 12.2141C4.74796 13.2301 5.22868 14.1732 5.91209 14.9613C6.5955 15.7495 7.46094 16.3589 8.43328 16.7368C9.40563 17.1146 10.4555 17.2494 11.4918 17.1295C12.528 17.0096 13.5194 16.6386 14.3798 16.0487C15.2401 15.4588 15.9435 14.6678 16.4289 13.7445C16.9143 12.8211 17.167 11.7932 17.165 10.75C17.165 9.02 16.665 7.72 14.7 5.75C14.28 5.33 14.65 4.975 14.89 4.75L16.03 3.615C16.5 3.145 16.665 3.055 17.08 3.47C19.51 5.9 20.495 7.73 20.5 10.785C20.499 12.3775 20.108 13.9455 19.3611 15.352C18.6141 16.7584 17.5341 17.9605 16.2153 18.8532C14.8965 19.7459 13.3791 20.3019 11.7958 20.4727C10.2125 20.6435 8.61149 20.4239 7.13265 19.8331C5.65382 19.2423 4.34221 18.2982 3.31249 17.0834C2.28277 15.8686 1.56628 14.4201 1.22565 12.8645C0.885022 11.3088 0.930624 9.69344 1.35847 8.1595C1.78632 6.62556 2.58339 5.21976 3.68 4.065C3.095 3.47 2.91 3.28 1.925 2.295C1.54 1.915 1.885 1 2.795 1Z" stroke="%23323232" stroke-opacity="0.8" stroke-width="1.0" stroke-linecap="round" stroke-linejoin="round" fill="%23fff"/></svg>') no-repeat center;
      }
      #loop.checked {
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 21 21" fill="none"><path d="M2.795 1H8.25C8.52184 1 8.78256 1.10799 8.97478 1.30022C9.16701 1.49244 9.275 1.75315 9.275 2.025V7.35C9.275 8.21 8.32 8.72 7.775 8.175L6.035 6.425C5.32918 7.19315 4.82151 8.12195 4.55604 9.13079C4.29057 10.1396 4.27533 11.198 4.51165 12.2141C4.74796 13.2301 5.22868 14.1732 5.91209 14.9613C6.5955 15.7495 7.46094 16.3589 8.43328 16.7368C9.40563 17.1146 10.4555 17.2494 11.4918 17.1295C12.528 17.0096 13.5194 16.6386 14.3798 16.0487C15.2401 15.4588 15.9435 14.6678 16.4289 13.7445C16.9143 12.8211 17.167 11.7932 17.165 10.75C17.165 9.02 16.665 7.72 14.7 5.75C14.28 5.33 14.65 4.975 14.89 4.75L16.03 3.615C16.5 3.145 16.665 3.055 17.08 3.47C19.51 5.9 20.495 7.73 20.5 10.785C20.499 12.3775 20.108 13.9455 19.3611 15.352C18.6141 16.7584 17.5341 17.9605 16.2153 18.8532C14.8965 19.7459 13.3791 20.3019 11.7958 20.4727C10.2125 20.6435 8.61149 20.4239 7.13265 19.8331C5.65382 19.2423 4.34221 18.2982 3.31249 17.0834C2.28277 15.8686 1.56628 14.4201 1.22565 12.8645C0.885022 11.3088 0.930624 9.69344 1.35847 8.1595C1.78632 6.62556 2.58339 5.21976 3.68 4.065C3.095 3.47 2.91 3.28 1.925 2.295C1.54 1.915 1.885 1 2.795 1Z" fill="%23323232" stroke-opacity="0.8" stroke-width="1.0" stroke-linecap="round" stroke-linejoin="round"/></svg>') no-repeat center;
      }
      
      </style>
      <div id="container">
        <div id="play" ${this.value[0] == 1 ? 'class="checked"' : ''}></div>
        <div id="loop" ${this.value[1] == 1 ? 'class="checked"' : ''}></div>
      </div>`
  }
  
  togglePlay(e) {
    e.stopPropagation()
    this.shadow.querySelector('#play').classList.toggle('checked')
    this.value[0] = 1 - this.value[0]

    const event = new InputEvent("input")
    this.dispatchEvent(event)
  }
  toggleLoop(e) {
    e.stopPropagation()
    this.shadow.querySelector('#loop').classList.toggle('checked')
    this.value[1] = 1 - this.value[1]

    const event = new InputEvent("input")
    this.dispatchEvent(event)
  }
}

customElements.define("playback-control", playbackControl);
