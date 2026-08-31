import { UGenBase } from "../audio/UGenBase.js"
import { ModuleVisualisation } from "../components/moduleVisualisation.js"
import { Biquad, calculateBiquadCoefficients, calculateFrequencyResponse } from './biquad.js'

export const definition = {
  name: 'L:module_bandpass',
  info: 'L:info_bandpass',
  category: 'processor',
  inputs: { 
    in: {},
    freq: { type: 'knob', label: 'L:freq', min: 20, max: 20000, value: 1000, curve: 1, uom: 'Hz'
    },
    Q: { type: 'knob', label: 'Q', min: 0.01, max: 50, value: 1, curve: 0.5 },
  },
  outputs: {
    out: {}
  }
}

export class UGen extends Biquad {
  calcBiquad(K, Q) {
    const norm = 1 / (1 + K / Q + K * K);
    this.a0 = K / Q * norm;
    this.a1 = 0
    this.a2 = -this.a0;
    this.b1 = 2 * (K * K - 1) * norm;
    this.b2 = (1 - K / Q + K * K) * norm; 
  }
}

export class Visualisation extends ModuleVisualisation {
  render() {
    const sampleRate = 44100
    const rect = this.container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const freq = this.freq
    const q = this.Q
    const freqX = (Math.log10(freq) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * w
    
    const coeffs = calculateBiquadCoefficients('bandpass', freq, q, sampleRate)

    let d = `M 0 ${h/2}`
    
    for (let i = 0; i <= w; i++) {
      const f = 20 * Math.pow(1000, i / w);
      const response = calculateFrequencyResponse(coeffs, f, sampleRate);
      
      if (isNaN(response.magnitudeDB) || !isFinite(response.magnitudeDB)) {
          continue;
      }
      
      const x = (Math.log10(f) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * w;
      const y = h - ((response.magnitudeDB + 30) / 60) * h;
      
      d = d + ` ${x} ${y}`
    }
  d = d + `L ${w} ${h} L 0 ${h} Z`

  this.container.innerHTML = '<svg viewBox="0 0 '+w+' '+h+'"><line x1="0" y1="30" x2="'+w+'" y2="30" stroke="'+this.color+'" stroke-width="1" stroke-opacity="0.25" /><path fill="'+this.color+'" d="'+d+'"></svg>'
  }
}