export class fileButton extends HTMLElement {
  static observedAttributes = ['accept', 'label', 'value']

  constructor() {
    super()
    this.accept = ''
    this.button = false
    
    // bindings
    this.onChange = this.onChange.bind(this)
  }

  connectedCallback() {
//     console.log("File button added to page.")
    this.render();
    
    // attach events
    this.shadow.querySelector('input[type=file]').addEventListener("change", this.onChange);
  }

  attributeChangedCallback(name, oldValue, newValue) {
//      console.log(`Attribute ${name} has changed to ${newValue}.`)
		this[name] = newValue;
		if(this.shadow && name == 'value') {
      this.shadow.querySelector('#filename').innerHTML = newValue;	  
		}
  }
  
  render() {
    this.shadow = this.attachShadow({ mode: "open" })
    this.shadow.innerHTML = `
    <style>
      #label {
        font-size: 10px;
        font-weight: 700;
        margin: 0 0 5px 0;
      }
      label {
        display: block;
        cursor: pointer;
        margin: 0 5px 0 5px;
        padding: 4.5px 6px 3.5px 6px;
        background-color: #fffb;
        border: 1px solid #0003;
        border-radius: 99px;
        font-size: 12px;
      }
      #filename {
        margin: 5px 2px 0 2px;
        overflow-wrap: anywhere;
        overflow: hidden;
        text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
        font-size: 10px;
      }
    </style>
    <div id="label">${this.label}</div>
    <label for="fileInput">
    ${this.innerHTML}
   	<input id="fileInput" type="file" accept="${this.accept}" hidden />
   	</label>`
   	// the label workaround is necessary for iOS Safari
   	this.shadow.innerHTML += '<div id="filename"></div>'
  }
  
  onChange(e) {
    this.file = e.srcElement.files[0]
    const event = new InputEvent("input")
    this.dispatchEvent(event)
    this.shadow.querySelector('#filename').innerHTML = this.file.name
		this.shadow.querySelector('input[type=file]').value = ''
  }
}

customElements.define("file-button", fileButton);