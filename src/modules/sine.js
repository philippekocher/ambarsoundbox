import { UGenBase } from "../audio/UGenBase.js"
import { ModuleVisualisation } from "../components/moduleVisualisation.js"


export const definition = {
  name: 'L:module_sine',
  info: 'L:info_sine',
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
    this.phasor = this.phasor % 1
    const freqPort = this.inputPorts.get('freq')
    const ampPort = this.inputPorts.get('amp')
    const outputPort = this.outputPorts.get('out')
    if(Number.isNaN(this.phasor)) this.phasor = 0
    for(let i=0; i<this.blocksize; i++) {
      const freq = freqPort.buffer[i]
      const phaseIncr = freq / sampleRate
      this.phasor += phaseIncr
      outputPort.buffer[i] = Math.sin(this.phasor * Math.PI * 2) * ampPort.buffer[i]
    }	
  }
}

export class Visualisation extends ModuleVisualisation {
  constructor() {
    super()
  }
  render() {
    const rect = this.container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const m = h/2
    const a = this.amp ?? 0
    let f = 0.035 + this.freq * 0.00008
    let x = -1
    const points = []
    for (let i = 0; i < w; i++) {
      if(f < 0.8) {
        points.push(i, m - Math.sin(i * f) * (m-5) * a)
      }
      else if(f < 1.25) {
        if(Math.round(i * f * 2 / Math.PI) != x) {
          points.push(i, 30 - [0,1,0,-1][Math.round(i * f * 2 / Math.PI) % 4] * (m-5) * a)
          x = Math.round(i * f * 2 / Math.PI)
        }
      }
      else {
        if(Math.floor(i * f / Math.PI) != x) {
          points.push(i,m - [1,-1][Math.floor(i * f / Math.PI) % 2] * (m-5) * a)
          x = Math.floor(i * f / Math.PI)
        }
      }
    }
    this.container.innerHTML = '<svg viewBox="0 0 '+w+' '+h+'"><line x1="0" y1="'+m+'" x2="'+w+'" y2="'+m+'" stroke="'+this.color+'" stroke-width="1" stroke-opacity="0.25" /><polyline class="waveform_path" fill="none" stroke="'+this.color+'" stroke-width="2" points="'+points+'"/></svg>'
  }
}