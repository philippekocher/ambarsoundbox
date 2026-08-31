import { UGenBase } from "../audio/UGenBase.js"


export const definition = {
  name: 'L:module_delay',
  info: 'L:info_delay',
  category: 'processor',
  inputs: { 
    in: {},
    time: { type: 'knob', label: 'L:time', min: 0, max: 1, precision: 4, value: 0.1, uom: 's' },
  },
  outputs: {
    out: {}
  }
}

export class UGen extends UGenBase {
  constructor() {
    super()
    this.buflen = sampleRate + 1 // 1 second
    this.ringbuffer = new Array(this.buflen).fill(0)
    this.phasor = 0
  }
  process = () => {
    const inPort = this.inputPorts.get('in')
    const timePort = this.inputPorts.get('time')
    const outputPort = this.outputPorts.get('out')
    
    for(let i=0; i<this.blocksize; i++) {
      const delaySamples = Math.max(0, parseInt(timePort.buffer[i] * sampleRate) - this.blocksize)
        this.ringbuffer[(this.phasor + delaySamples) % this.buflen] = inPort.buffer[i]
      outputPort.buffer[i] = this.ringbuffer[this.phasor]
      this.phasor = (this.phasor + 1) % this.buflen
    }
  }
}