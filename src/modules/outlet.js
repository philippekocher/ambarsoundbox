import { UGenBase } from "../audio/UGenBase.js"


export const definition = {
  name: 'Out',
  info: 'L:info_outlet',
  inputs: {
    0: {},
    1: { optional: true },
    2: { optional: true },
    3: { optional: true },
    4: { optional: true }
  }
}

export class UGen extends UGenBase {
  process = () => {
    for(let i=0; i<5; i++) {
      const inputPort = this.inputPorts.get(`${i}`)
      const outputPort = this.outputPorts.get(`${i}`)
      outputPort.buffer = inputPort.buffer
    }
  }
}