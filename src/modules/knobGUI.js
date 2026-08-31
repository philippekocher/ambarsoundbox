import { UGenBase } from "../audio/UGenBase.js"


export const definition = {
  name: 'L:module_knobGUI',
  category: 'gui',
  gui_layout: {width: 1, height: 1},
  outputs: { 
    out: { type: 'knob' }
  },
  attributes: { label: '' }
}

export class UGen extends UGenBase {}