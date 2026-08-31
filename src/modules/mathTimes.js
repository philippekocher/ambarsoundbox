import { UGenBase } from "../audio/UGenBase.js"


export const definition = {
  name: '&times;', nameIsSymbol: true,
  info: 'L:info_mathTimes',
  category: 'utility',
  inputs: { 
    in: {},
    arg: { type: 'number', value: 0.0 }
  },
  outputs: {
    out: {}
  }
}

export class UGen extends UGenBase {
  process = () => {
    const inputPort = this.inputPorts.get('in')
    const argPort = this.inputPorts.get('arg')
    const outputPort = this.outputPorts.get('out')
    for(let i=0; i<this.blocksize; i++) {
      outputPort.buffer[i] = inputPort.buffer[i] * argPort.buffer[i]
    }
  }
}