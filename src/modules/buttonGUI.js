import { UGenBase } from "../audio/UGenBase.js"
import { ModuleVisualisation } from "../components/moduleVisualisation.js"


export const definition = {
  name: 'L:module_buttonGUI',
  category: 'gui',
  gui_layout: {width: 1, height: 1},
  outputs: { 
    out: { type: 'button', shape: '' }
  },
  attributes: { label: '', type: ['push', 'toggle'] }
}

export class UGen extends UGenBase {}