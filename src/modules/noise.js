import { UGenBase } from "../audio/UGenBase.js"
import { ModuleVisualisation } from "../components/moduleVisualisation.js"


export const definition = {
  name: 'L:module_noise',
  info: 'L:info_noise',
  category: 'generator',
  inputs: { 
    amp:  { type: 'knob', label: 'L:amp', value: 0.5, min: 0, max: 1 }
  },
  outputs: { 
    out: {}
  }
}

export class UGen extends UGenBase {
  process = () => {
    const outputPort = this.outputPorts.get('out')
    for(let i=0; i<this.blocksize; i++) {
      outputPort.buffer[i] = 2 * (Math.random() - 0.5) * this.inputPorts.get('amp').buffer[i]
    }
  }
}

export class Visualisation extends ModuleVisualisation {
  constructor() {
    super()
    this.rnd = Array.from({length: 100}, () => Math.floor(Math.random() * 10));
  }
  render() {
    const rect = this.container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const m = h/2
    const a = (this.amp ?? 0) + 0.1
    const points = []
    for (let i = 0; i < w; i++) {
      const sign = i%2 == 0 ? -1 : 1
      if(a > 0.12) {
        points.push(i, Math.floor(m + sign * (m * 0.5 * a + this.rnd[i % 100] * a)))
      }
      else {
        points.push(i, m)
      }
    }
    this.container.innerHTML = '<svg viewBox="0 0 '+w+' '+h+'"><polyline class="waveform_path" fill="none" stroke="'+this.color+'" stroke-width="2" points="'+points+'"></polyline></svg>'
  }
}