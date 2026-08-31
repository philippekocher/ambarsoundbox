import { UGenBase } from "../audio/UGenBase.js"
import { ModuleVisualisation } from "../components/moduleVisualisation.js"


export const definition = {
  name: 'L:module_envelope',
  info: 'L:info_envelope',
  category: 'processor',
  inputs: {
    in: {},
    trig: { type: 'button', text: 'L:trigger' },
    attack: { type: 'knob', label: 'attack', min: 0.01, max: 5, value: 0.01, uom: 's' },
    decay: { type: 'knob', label: 'decay', min: 0.01, max: 5, value: 0.1, uom: 's' },
    sustain: { type: 'knob', label: 'sustain', value: 0.5 },
    release: { type: 'knob', label: 'release', min: 0.01, max: 5, value: 0.1, uom: 's' }
  },
  outputs: {
    out: {}
  }
}

export class UGen extends UGenBase {
  constructor() {
    super()
    this.time = Infinity
    this.state = 0
    this.level = 0
    this.lastTrig = 0
    this.trigLevel = 0
    this.attackStartLevel = 0   // track level when attack starts
    this.releaseStartLevel = 0  // track level when release starts
    this.trigHighCount = 0      // how many samples the current trigger has been high
    this.impulseTrigger = false // true if the trigger was only 1 sample long
    // an impulse trigger plays the full envelope from start to finish, with no sustain stage
  }
  process = () => {
    const inPort = this.inputPorts.get('in')
    const trigPort = this.inputPorts.get('trig')
    const outPort = this.outputPorts.get('out')

    // Get envelope parameters
    const attackTime = Math.max(0.001, this.inputPorts.get('attack').buffer[0])
    const decayTime = Math.max(0.001, this.inputPorts.get('decay').buffer[0])
    const sustainLevel = Math.max(0, Math.min(1, this.inputPorts.get('sustain').buffer[0]))
    const releaseTime = Math.max(0.001, this.inputPorts.get('release').buffer[0])

    const attackSamples = Math.floor(attackTime * sampleRate)
    const decaySamples = Math.floor(decayTime * sampleRate)
    const releaseSamples = Math.floor(releaseTime * sampleRate)

    // Adjust the constants (5) to shape how steep the curve is
    // higher values give faster transitions.
    const attackRate = 5 / attackSamples
    const decayRate = 5 / decaySamples
    const releaseRate = 5 / releaseSamples
    
    
    for(let i = 0; i < this.blocksize; i++) {
      if(this.lastTrig == 0 && trigPort.buffer[i] != 0) {
        // Trigger onset
        this.attackStartLevel = this.level
        this.time = 0
        this.state = 1
        this.trigLevel = 1
        this.trigHighCount = 1
        this.impulseTrigger = false
      }
      else if(this.lastTrig != 0 && trigPort.buffer[i] != 0) {
        // Trigger still held
        this.trigHighCount++
      }
      else if(this.lastTrig != 0 && trigPort.buffer[i] == 0) {
        // Trigger just one sample long
        this.impulseTrigger = (this.trigHighCount === 1)
        // if driven by an impulse, the impulse amp controls the overall amp
        this.trigLevel = this.lastTrig
      }
      this.lastTrig = trigPort.buffer[i]

      if(this.state == 1) {
        if(this.time < attackSamples) {
          // Attack from current level to 1
          this.level = this.attackStartLevel + (1 - this.attackStartLevel) * (1 - Math.exp(-attackRate * this.time))
          if(!this.impulseTrigger && trigPort.buffer[i] == 0) {
            this.releaseStartLevel = this.level
            this.time = 0
            this.state = 2
          }
        }
        else if(this.time < attackSamples + decaySamples) {
          this.level = sustainLevel + (1 - sustainLevel) * Math.exp(-decayRate * (this.time - attackSamples))
          if(!this.impulseTrigger && trigPort.buffer[i] == 0) {
            this.releaseStartLevel = this.level
            this.time = 0
            this.state = 2
          }
        }
        else {
          this.level = sustainLevel
          if(this.impulseTrigger || trigPort.buffer[i] == 0) {
            this.releaseStartLevel = this.level
            this.time = 0
            this.state = 2
          }
        }
      }
      if(this.state == 2) {
        if(this.time < releaseSamples) {
          // Release from current level to 0
          this.level = this.releaseStartLevel * Math.exp(-releaseRate * this.time)
        }
        else {
          this.level = 0
          this.time = Infinity
          this.state = 0
        }
      }

      outPort.buffer[i] = inPort.buffer[i] * this.level * this.trigLevel
      this.time++
    }
  }
}

export class Visualisation extends ModuleVisualisation {
  render() {
    const rect = this.container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const offsetX = 10
    const offsetY = h - 10
    const attk = Math.pow((this.attack ?? 0) * 0.2, Math.exp(-0.5)) * ((w-offsetX)/4)
    const dec = Math.pow((this.decay ?? 0) * 0.2, Math.exp(-0.5)) * ((w-offsetX)/4)
    const sus = offsetY - (this.sustain ?? 0) * (h - 15)
    const rel = Math.pow((this.release ?? 0) * 0.2, Math.exp(-0.5)) * ((w-offsetX)/4)
    const points1 = [ offsetX, offsetY, offsetX+attk, 5, offsetX+attk+dec, sus]
    this.container.innerHTML = '<svg viewBox="0 0 '+w+' '+h+'"><line x1="0" y1="'+offsetY+'" x2="1000" y2="'+offsetY+'" stroke="'+this.color+'" stroke-width="1" stroke-opacity="0.25" /><polyline fill="none" stroke="'+this.color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="'+points1+'" /><line x1="'+(offsetX+attk+dec)+'" y1="'+sus+'" x2="'+(offsetX+attk+dec+(w / 4))+'" y2="'+sus+'" stroke="'+this.color+'" stroke-width="2" stroke-dasharray="2,2"/><line x1="'+(offsetX+attk+dec+((w-offsetX)/4))+'" y1="'+sus+'" x2="'+(offsetX+attk+dec+((w-offsetX)/4)+rel)+'" y2="'+offsetY+'" stroke="'+this.color+'" stroke-width="2" stroke-linecap="round" /></svg>'
  }
}