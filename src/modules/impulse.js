import { UGenBase } from "../audio/UGenBase.js"
import { ModuleVisualisation } from "../components/moduleVisualisation.js"


export const definition = {
  name: 'L:module_impulse',
  info: 'L:info_impulse',
  category: 'generator',
  inputs: { 
    freq: { type: 'knob', label: 'L:freq', min: 0, max: 20000, value: 1, curve: 1, uom: 'Hz'},
    amp:  { type: 'knob', label: 'L:amp', value: 0.5, min: 0, max: 1 }
  },
  outputs: { 
    out: {}
  }
}

export class UGen extends UGenBase {
  constructor() {
    super()
    this.phasor = 0.9999
  }
  process = () => {
    const freqPort = this.inputPorts.get('freq')
    const ampPort = this.inputPorts.get('amp')
    const outputPort = this.outputPorts.get('out')
    if(Number.isNaN(this.phasor)) this.phasor = 0
    for(let i=0; i<this.blocksize; i++) {
      const freq = Math.max(0, Math.min(20000, freqPort.buffer[i]))
      const phaseIncr = freq / sampleRate
      this.phasor = (this.phasor + phaseIncr) % 1
      if(this.phasor < phaseIncr) outputPort.buffer[i] = ampPort.buffer[i]
      else outputPort.buffer[i] = 0
    }  
  }
}

export class Visualisation extends ModuleVisualisation {
  render() {
    const rect = this.container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const base = h * 0.80
    const a = this.amp ?? 0
    const f = Math.floor(3 + 20000 / (this.freq + 150))
    const offset = Math.min(10, f)
    let d = ''
    for (let i = 0; i < w; i++) {
      if(i % f == 0) {
        const x = i + offset
        d += 'M'+x+' '+(base - a * (base-5))+' L'+x+' '+base+' '
      }
    }
    this.container.innerHTML = '<svg viewBox="0 0 '+w+' '+h+'"><line x1="0" y1="'+base+'" x2="'+w+'" y2="'+base+'" stroke="'+this.color+'" stroke-width="1" stroke-opacity="0.25" /><path class="waveform_path" stroke="'+this.color+'" stroke-width="2" d="'+d+'"/></svg>'
  }
}