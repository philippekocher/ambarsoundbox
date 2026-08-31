import { UGenBase } from "../audio/UGenBase.js"


export class Biquad extends UGenBase {
  constructor() {
    super()    
    this.z1 = 0
    this.z2 = 0
  }

  process = () => {
    const outputPort = this.outputPorts.get('out')
    for(let i=0; i<this.blocksize; i++) {
//     const V = pow(10, Math.abs(gain) / 20.0)
      const freq = Math.max(20, this.inputPorts.get('freq').buffer[i])
      const K = Math.tan(Math.PI * freq / sampleRate)
      const Q = Math.max(0.001, this.inputPorts.get('Q').buffer[i])
      this.calcBiquad(K, Q, sampleRate)
      
      const input  = this.inputPorts.get('in').buffer[i]
      const output = input * this.a0 + this.z1
      this.z1 = input * this.a1 + this.z2 - this.b1 * output;
      this.z2 = input * this.a2 - this.b2 * output;
      outputPort.buffer[i] = output
    }
  }
}

export function calculateBiquadCoefficients(type, freq, q, sampleRate) {
  const w = 2 * Math.PI * freq / sampleRate
  const K = Math.tan(w / 2)
  const norm = 1 / (1 + K / q + K * K)
  
  let b0, b1, b2, a1, a2;
  
  switch(type) {
    case 'lowpass':
      b0 = K * K * norm
      b1 = 2 * b0
      b2 = b0
      a1 = 2 * (K * K - 1) * norm
      a2 = (1 - K / q + K * K) * norm
      break;
        
    case 'highpass':
      b0 = norm
      b1 = -2 * b0
      b2 = b0
      a1 = 2 * (K * K - 1) * norm
      a2 = (1 - K / q + K * K) * norm
      break;
        
    case 'bandpass':
      b0 = K / q * norm
      b1 = 0
      b2 = -b0
      a1 = 2 * (K * K - 1) * norm
      a2 = (1 - K / q + K * K) * norm
      break
  }
  
  return {
    b0: b0,
    b1: b1,
    b2: b2,
    a1: a1,
    a2: a2
  }
}

export function calculateFrequencyResponse(coeffs, freq, sampleRate) {
  const w = 2 * Math.PI * freq / sampleRate;
  const cos1 = Math.cos(w);
  const cos2 = Math.cos(2 * w);
  const sin1 = Math.sin(w);
  const sin2 = Math.sin(2 * w);
  
  // Numerator
  const numReal = coeffs.b0 + coeffs.b1 * cos1 + coeffs.b2 * cos2;
  const numImag = -coeffs.b1 * sin1 - coeffs.b2 * sin2;
  
  // Denominator
  const denReal = 1 + coeffs.a1 * cos1 + coeffs.a2 * cos2;
  const denImag = -coeffs.a1 * sin1 - coeffs.a2 * sin2;
  
  // Complex division
  const denominator = denReal * denReal + denImag * denImag;
  const real = (numReal * denReal + numImag * denImag) / denominator;
  const imag = (numImag * denReal - numReal * denImag) / denominator;
  
  const magnitude = Math.sqrt(real * real + imag * imag);
  //const phase = Math.atan2(imag, real);
  
  return {
      //magnitude: magnitude,
      magnitudeDB: 20 * Math.log10(Math.abs(magnitude)),
      //phase: phase * 180 / Math.PI
  }
}