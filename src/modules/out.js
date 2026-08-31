import { UGenBase } from "../audio/UGenBase.js"
import { ModuleVisualisation } from "../components/moduleVisualisation.js"


export const definition = {
  name: 'L:module_audioOut',
  info: 'L:info_audioOut',
  category: 'io',
  inputs: {
    in1: {label: 'L'},
    in2: {label: 'R'},
    master: { type: 'knob', label: 'L:mainVolume', min: 0, max: 1, value: 0.5 }
  }
}

export class UGen extends UGenBase {
  constructor() {
    super();
    this.peak = {in1: 0, in2: 0}
  }
  getMultichannelAudioBlock = (blockCount) => {
    for(let inputPort of this.inputPorts) {
      inputPort[1].process(blockCount)
    }
    for(let i=0; i<this.blocksize; i++) {
      const sig1 = this.inputPorts.get('in1').buffer[i] * this.inputPorts.get('master').buffer[i]
      const sig2 = this.inputPorts.get('in2').buffer[i] * this.inputPorts.get('master').buffer[i]
      this.inputPorts.get('in1').buffer[i] = sig1
      this.inputPorts.get('in2').buffer[i] = sig2
      this.peak['in1'] = Math.max(this.peak['in1'], sig1)
      this.peak['in2'] = Math.max(this.peak['in2'], sig2)
    }
    return [ this.inputPorts.get('in1').buffer, this.inputPorts.get('in2').buffer ]
  }
  pollValues() {
    let data = {}
    for(const [tag, port] of this.inputPorts) {
      if(tag == 'master') data[tag] = port.buffer[0]
      else {
        if(Number.isNaN(this.peak[tag])) this.peak[tag] = 0;
        const peak = Math.min(1, this.peak[tag])
        this.peak[tag] = peak - 0.1
        data[tag] = peak
      }
    }
    return data
  }
}

export class Visualisation extends ModuleVisualisation {
  constructor() {
    super()
  }
  render() {
    const rect = this.container.getBoundingClientRect()
    const w = Math.max(0, rect.width - 20)
    const h = rect.height
    let in1 = this.in1 ?? 0
    let in2 = this.in2 ?? 0
    const c1 = '#0c4'
    const c2 = '#0c4'
    in1 = Math.max(0, in1) * w * (this.audio ?? 0)
    in2 = Math.max(0, in2) * w * (this.audio ?? 0)
    this.container.innerHTML = '<svg viewBox="0 0 '+(w+20)+' '+h+'"><rect width="'+w+'" height="14" x="10" y="10" rx="2" ry="2" fill="#fffb" /><rect width="'+in1+'" height="14" x="10" y="10" rx="2" ry="2" fill="'+c1+'" /><rect width="'+w+'" height="14" x="10" y="40" rx="2" ry="2" fill="#fffb" /><rect width="'+in2+'" height="14" x="10" y="40" rx="2" ry="2" fill="'+c2+'" /></svg>'
  }
}