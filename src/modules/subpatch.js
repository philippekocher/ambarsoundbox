import { UGenBase } from "../audio/UGenBase.js"

export const definition = {
  name: 'L:subpatch',
  category: 'utility',
  inputs: {
    0: { },
    1: { },
    2: { },
    3: { },
    4: { }
  },
  outputs: {
    0: { },
    1: { },
    2: { },
    3: { },
    4: { }
  },
  attributes: { label: '' }
}

export class UGen extends UGenBase {
  process = () => {
    for(let i=0; i<5; i++) {
      const inputPort = this.inputPorts.get(`${i}`)
      const outputPort = this.outputPorts.get(`${i}`)
      const tempInputPort = this.inputPorts.get(`${i}_temp`)
      const tempOutputPort = this.outputPorts.get(`${i}_temp`)
                
      tempOutputPort.buffer = inputPort.buffer
      outputPort.buffer = tempInputPort.buffer
    }
  }
}