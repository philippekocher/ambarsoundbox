import { UGenBase } from "../audio/UGenBase.js"


export const definition = {
  name: 'L:module_random',
  info: 'L:info_random',
  category: 'utility',
  inputs: {
    trig: { type: 'button', text: 'L:trigger' },
    min: { type: 'number', label: 'Min', value: 0 },
    max: { type: 'number', label: 'Max', value: 1},
  },
  outputs: {
    out: {}
  }
}

export class UGen extends UGenBase {
  constructor() {
    super()
    this.lastTrig = 0
  }
  process = () => {
    const trigPort = this.inputPorts.get('trig')
    const outputPort = this.outputPorts.get('out')
    const minPort = this.inputPorts.get('min')
    const maxPort = this.inputPorts.get('max')

    for(let i=0; i<this.blocksize; i++) {
      if(this.lastTrig == 0 && trigPort.buffer[i] != 0) {
        const min = minPort.buffer[i]
        const max = maxPort.buffer[i]
        outputPort.setValue(Math.random() * (max - min) + min)
      }
      this.lastTrig = trigPort.buffer[i]
    }  
  }
}