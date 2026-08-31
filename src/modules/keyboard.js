import { UGenBase } from "../audio/UGenBase.js"


const keyboard = {
  listeners: new Map(),
  keys: new Set(),
  init: (module) => {
    keyboard.listeners.set(module.id, {
      key: module.parameters.key, 
      messageHandler: module.messageHandler,
    })
    window.addEventListener('keydown', keyboard.handleKeydown)
    window.addEventListener('keyup', keyboard.handleKeyup)
  },
  initOutput: (module, tag, controlElement) => {
    const listener = keyboard.listeners.get(module.id)
    if(listener) listener.el = controlElement
    controlElement.addEventListener('input', e => { keyboard.setKey(module.id, e.target.value)})
  },
  setKey: (id, key) => {
    const listener = keyboard.listeners.get(id)
    listener.key = key
  },
  handleKeydown: e => {
    if(e.metaKey) return
    if(keyboard.keys.has(e.key)) return
    keyboard.keys.add(e.key)
    if(keyboard.listeners) {
      keyboard.listeners.forEach((listener, id) => {
        if(listener.key == e.key.trim()) {
          listener.el?.setAttribute('active', 1)
          listener.messageHandler?.({action: 'set', id: id, data: { ['key_bool']: 1 }, undoable: false })
          e.preventDefault()
        }
      })
    }
  },
  handleKeyup: e => {
    keyboard.keys.delete(e.key)
    if(keyboard.listeners) {
      keyboard.listeners.forEach((listener, id) => {
        if(listener.key == e.key.trim()) {
          listener.el?.setAttribute('active', 0)
          listener.messageHandler?.({action: 'set', id: id, data: { ['key_bool']: 0 }, undoable: false })
        }
      })
    }
  }
}

export const definition = {
  name: 'L:module_keyboard',
  // info >> see: https://keyjs.dev
  category: 'io',
  init: keyboard.init,
  inputs: {},
  outputs: {
    key: { type: 'text', init: keyboard.initOutput, portName: 'key_bool' }
  }
}

export class UGen extends UGenBase {}

