import { UGenBase } from "../audio/UGenBase.js"
import { ModuleVisualisation } from "../components/moduleVisualisation.js"


export const definition = {
  name: 'L:module_saw',
  info: 'L:info_saw',
  category: 'generator',
  inputs: { 
    freq: { type: 'knob', label: 'L:freq', min: 0, max: 20000, value: 1000, curve: 1, uom: 'Hz'},
    amp:  { type: 'knob', label: 'L:amp', value: 0.5, min: 0, max: 1 }
  },
  outputs: { 
    out: {}
  }  
}

export class UGen extends UGenBase {
  constructor() {
    super()
    this.phasor = 0
  }
  process = () => {
    const freqPort = this.inputPorts.get('freq')
    const ampPort = this.inputPorts.get('amp')
    const outputPort = this.outputPorts.get('out')
    if(Number.isNaN(this.phasor)) this.phasor = 0
    for(let i=0; i<this.blocksize; i++) {
      const freq = freqPort.buffer[i]
      const phaseIncr = freq / sampleRate
      this.phasor = (this.phasor + phaseIncr) % 1
			let sig = (2.0 * this.phasor - 1.0)
			sig -= this.polyBlep(this.phasor, phaseIncr)
      outputPort.buffer[i] = sig  * ampPort.buffer[i]
    }	
  }
  polyBlep = (t, dt) => {
    if(t < dt) {
        t /= dt
        return t+t - t*t - 1.0
    }
    else if(t > 1.0 - dt) {
        t = (t - 1.0) / dt
        return t*t + t+t + 1.0
    }
    else return 0.0
  }
}

export class Visualisation extends ModuleVisualisation {
  render() {
    if(!this.path) this.createSVG()

    const rect = this.container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const m = h / 2

    const a = this.amp ?? 0
    const f = 3 + 20000 / (this.freq + 150)
    const points = []
    for (let i = 0; i * f < w; i++) {
      points.push(i * f, m + ((m-5) * a), (i+1) * f, m - ((m-5) * a))
    }
    this.path.setAttribute('points', points.join(' '))
  }
  createSVG() {
    const rect = this.container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const m = h / 2

    this.container.innerHTML = '<svg viewBox="0 0 '+w+' '+h+'"><line x1="0" y1="'+m+'" x2="'+w+'" y2="'+m+'" stroke="'+this.color+'" stroke-width="1" stroke-opacity="0.25" /><polyline class="waveform_path" fill="none" stroke="'+this.color+'" stroke-width="2"></polyline></svg>'
    
    this.path = this.container.querySelector('.waveform_path')
  }
}