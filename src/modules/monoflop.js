import { UGenBase } from "../audio/UGenBase.js"


export const definition = {
  name: 'L:module_monoflop',
  info: 'L:info_monoflop',
  category: 'utility',
  inputs: { 
    in: {},
    dur: { type: 'knob', label: 'L:dur', max: 5, value: 0.01, uom: 's' },
  },
  outputs: {
    out: {}
  }
}

export class UGen extends UGenBase {
  constructor() {
    super()
    this.time = 0
    this.state = 0
  }
  process = () => {
    const outPort = this.outputPorts.get('out')
    const inPort = this.inputPorts.get('in')
    const durSamples = this.inputPorts.get('dur').buffer[0] * sampleRate
    for(let i=0; i<this.blocksize; i++) {
      if(inPort.buffer[i] != 0) {
        this.state = inPort.buffer[i]
        this.time = durSamples
      }
      if(this.time <= 0) {
         this.state = 0   
      }
      outPort.buffer[i] = this.state
      this.time -= 1
    }	
  }
}