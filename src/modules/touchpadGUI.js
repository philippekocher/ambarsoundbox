import { UGenBase } from "../audio/UGenBase.js"


export const definition = {
  name: 'L:module_touchpadGUI',
  info: 'L:info_touchpadGUI',
  category: 'gui',
  gui_layout: {width: 2, height: 2},
  outputs: {
    out: { type: 'touchpad', ports: 2 }
  },
  attributes: { label: '' }
}

export class UGen extends UGenBase {}