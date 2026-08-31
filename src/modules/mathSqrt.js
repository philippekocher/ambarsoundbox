import { UGenBase } from "../audio/UGenBase.js"


export const definition = {
  name: '&radic;',
  info: 'L:info_mathSqrt',
  category: 'utility',
  inputs: { 
    in: { min: 0 },
  },
  outputs: {
    out: {}
  }
}

export class UGen extends UGenBase {
  process = () => {
    const inputPort = this.inputPorts.get('in')
    const outputPort = this.outputPorts.get('out')
    for(let i=0; i<this.blocksize; i++) {
      outputPort.buffer[i] = Math.max(0, Math.sqrt(inputPort.buffer[i]))
    }
  }
}