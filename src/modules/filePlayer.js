import { UGenBase } from "../audio/UGenBase.js"
import { ModuleVisualisation } from "../components/moduleVisualisation.js"


export const definition = {
  name: 'L:module_filePlayer',
  info: 'L:info_filePlayer',
  category: 'generator',
  inputs: {
    file: { type: 'file-button', label: 'L:audiofile', button: 'L:open', ports: false },
    play: { type: 'play', label: 'play' },
    start: { type: 'knob', label: 'L:start', min: 0, max: 1 },
    end: { type: 'knob', label: 'L:end', min: 0, max: 1, value: 1 },
    rate: { type: 'knob', label: 'L:rate', min: -10, max: 10, value: 1, uom: '×' }
  },
  outputs: { 
    out: {}
  }
}

export class UGen extends UGenBase {
  constructor() {
    super()
    this.phasor = 0
    this.parameters.buffer = new Float32Array()
    this.parameters.loop = 0
    this.zeroed = true
    this.playingState = 0 // 0=stop, 1=play
    this.noInForVirtualOut = true
  }

  process = () => {
    const buffer = this.parameters.buffer
    const len = this.parameters.buffer.length
    if(len == 0) return
    const outputPort = this.outputPorts.get('out')
    const playPort = this.inputPorts.get('play')
    const loop = this.parameters.loop
    const ratePort = this.inputPorts.get('rate')
    const startSample = this.inputPorts.get('start').buffer[0] * len
    const endSample = this.inputPorts.get('end').buffer[0] * len
   
    for(let i=0; i<this.blocksize; i++) {
      const play = playPort.buffer[i]
      if(play == 0) {
        this.playingState = 0
        this.phasor = ratePort.buffer[i] >= 0 ? startSample : endSample - 1
      }
      if(this.playingState == 0 && play == 1) {
        this.playingState = 1      
        this.phasor = ratePort.buffer[i] >= 0 ? startSample : endSample - 1
      }

      if(this.playingState != 1 || (startSample >= endSample)) {
        outputPort.buffer[i] = 0
      }
      else {
        let phaseIncr = ratePort.buffer[i]
        if(loop == 1) {
          this.phasor += phaseIncr
          if(this.phasor >= endSample) {
            this.phasor = this.phasor - len > startSample ? this.phasor - len : startSample
          }
          if(this.phasor < startSample) {
            this.phasor = this.phasor + len < endSample ? this.phasor + len : endSample
          }
          outputPort.buffer[i] = buffer[Math.floor(this.phasor) % len]
        }
        else {
          if(this.phasor >= startSample && this.phasor < endSample) {
            this.phasor += phaseIncr
          }
          outputPort.buffer[i] = this.phasor >= startSample && this.phasor < endSample ? buffer[Math.floor(this.phasor) % len] : 0
        }
      } 
    }
  }
  
  pollValues() {
    let data = super.pollValues()
    const len = this.parameters.buffer.length
    const phasor = this.phasor //this.parameters.loop == 1 ? this.phasor % len : this.phasor
    data['phasor'] = len == 0 ? 0 : (phasor % len) / len
    return data
  }
}

//const waveforms = {}  // >> this has to be global to the editor.
export class Visualisation extends ModuleVisualisation {
  set(data) {
    for(var key in data) {
      if(key != 'samples') {
        this[key] = data[key]
      }
      else {
        const samples = data[key]
        const rect = this.container.getBoundingClientRect()
        const w = rect.width
        const h = rect.height
        const mod = Math.floor(samples.length / w)
        const pathSegments = []
        let accumulatedX = 0
        for(const [i, sample] of samples.entries()) {
          accumulatedX += Math.abs(sample);       
          if(i % mod === 0) {
            const indexDivMod = i / mod;
            const scaledY = (h / 2) - (accumulatedX / mod * h);
            const scaledY2 = (h / 2) + (accumulatedX / mod * h);
            pathSegments.push(`M${indexDivMod} ${scaledY} L${indexDivMod} ${scaledY2}`);
            accumulatedX = 0;
          }
        }
       this.d = pathSegments.join(' ');
//       waveforms[this.id] = this.d
      }
    }
  }
  render() {
    const rect = this.container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const start = (this.start ?? 0) * w
    const end = Math.max(start, (this.end ?? 1) * w)
    const pos = (this.phasor ?? 0) * w
    const d = this.d ?? /*waveforms[this.id] ?? */ ''
    this.container.innerHTML = '<svg viewBox="0 0 '+w+' '+h+'"><line x1="0" y1="'+(h/2)+'" x2="'+w+'" y2="'+(h/2)+'" stroke="'+this.color+'" stroke-width="1" stroke-opacity="0.25" /><path class="waveform_path" stroke="'+this.color+'" stroke-width="2" d="'+d+'"/><rect width="'+start+'" height="'+h+'" x="0" y="0" fill="#00002222" /><rect width="'+(w-end)+'" height="'+h+'" x="'+end+'" y="0" fill="#00002222" /><line x1="'+pos+'" y1="0" x2="'+pos+'" y2="'+h+'" stroke="black" stroke-width="2"/></svg>'
  }
}