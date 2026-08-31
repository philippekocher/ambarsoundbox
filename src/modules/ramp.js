import { UGenBase } from "../audio/UGenBase.js"


export const definition = {
  name: 'L:module_ramp',
  info: 'L:info_ramp',
  category: 'generator',
  inputs: {
    trig: { type: 'button', text: 'L:trigger' },
    start: { type: 'number', label: 'Start', value: 0 },
    end: { type: 'number', label: 'End', value: 1},
    dur: { type: 'number', label: 'Dur', value: 1 },
  },
  outputs: {
    out: {}
  }
}

export class UGen extends UGenBase {
  constructor() {
    super()
    this.time = Infinity
    this.state = 0
    this.lastTrig = 0
  }
  process = () => {
    const trigPort = this.inputPorts.get('trig')
    const outputPort = this.outputPorts.get('out')
    const durationSamples = this.inputPorts.get('dur').buffer[0] * sampleRate 
    const startValue = this.inputPorts.get('start').buffer[0] 
    const endValue = this.inputPorts.get('end').buffer[0] 

    for(let i=0; i<this.blocksize; i++) {
      if(this.lastTrig == 0 && trigPort.buffer[i] != 0) {
        this.state = 1
        this.time = 0
      }
      this.lastTrig = trigPort.buffer[i]

      if(this.time > durationSamples) {
        this.state = 2
      }
      
      if(this.state == 0) {
        outputPort.buffer[i] = startValue
      }
      else if(this.state == 1) {
        outputPort.buffer[i] = startValue + (endValue - startValue) * this.time / durationSamples    
      }
      else {
        outputPort.buffer[i] = endValue
      }
      this.time++
    }  
  }
}