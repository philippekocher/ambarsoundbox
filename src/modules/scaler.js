import { UGenBase } from "../audio/UGenBase.js"


export const definition = {
  name: 'L:module_scaler',
  info: 'L:info_scaler',
  category: 'utility',
  inputs: {
    in: {},
    inMin: { type: 'number', label: 'In Min', value: -1 },
    inMax: { type: 'number', label: 'In Max', value: 1},
    outMin: { type: 'number', label: 'Out Min', value: 0 },
    outMax: { type: 'number', label: 'Out Max', value: 1 }
  },
  outputs: {
    out: {}
  }
}

export class UGen extends UGenBase {
  process = () => {
    const inPort = this.inputPorts.get('in')
    const inMin = this.inputPorts.get('inMin').buffer[0]
    const inMax = this.inputPorts.get('inMax').buffer[0]
    const outMin = this.inputPorts.get('outMin').buffer[0]
    const outMax = this.inputPorts.get('outMax').buffer[0]
    const outPort = this.outputPorts.get('out')
    for(let i=0; i<this.blocksize; i++) {
      const input = Math.min(inMax, Math.max(inMin, inPort.buffer[i]))
      outPort.buffer[i] = (input - inMin) / (inMax - inMin) * (outMax - outMin) + outMin
    }
  }
}