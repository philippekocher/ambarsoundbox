import { UGenBase } from "../audio/UGenBase.js"


const calliope = {
  module: null,
  reader: null,
  textDecoder: null,
  port: null,
  listeners: new Map(),
  init: (module) => {
    calliope.module = module
  },
  initOutput: (module, tag, controlElement) => {
    //console.log('calliope initOutput', module.id, tag, controlElement)
    let listener = calliope.listeners.get(module.id)
    if(!listener) {
      listener = new Map()
      calliope.listeners.set(module.id, listener)
    }
    listener.set(tag, controlElement)     
  },
  connect: async () => {
    if(!navigator?.serial || typeof navigator.serial.requestPort !== 'function') {
      calliope.module.alert('alert_webSerial')
      return;
    }
    if(calliope.port || calliope.reader) {
      console.warn('calliope: already connected; connect() is ignored.')
      return
    }
    try {
      calliope.port = await navigator.serial.requestPort()
      await calliope.port.open({ baudRate: 115200 })
//           await calliope.port.open({ baudRate: 57600 })
      calliope.reader = calliope.port.readable.getReader()
      
      calliope.readData()
    } 
    catch (error) {
      console.error(error)
    }
  },
  
  disconnect: async () => {
    await calliope.reader.cancel()
    calliope.reader.releaseLock()
    calliope.reader = null
    await calliope.port.close()
    calliope.port = null
  },
  
  readData: async () => {
    let buffer = ''
    calliope.textDecoder = new TextDecoder()
    try {
      while (true) {
        const { value, done } = await calliope.reader.read()
        if(done) {
            console.log('Stream closed')
            calliope.listeners.forEach((listener) => { listener.get('connect')?.setAttribute('value', 0)  })
            break
        }
        calliope.listeners.forEach((listener) => {
          listener.get('connect')?.setAttribute('value', 1) 
        })
            
        const decodedData = calliope.textDecoder.decode(value, { stream: true })
        
        buffer += decodedData
        
        let match
        while ((match = buffer.match(/s([a-zA-Z])(-?\d+)e/))) {
          const [full, rawTag, numberStr] = match
          const tag = rawTag.toLowerCase()
          const number = parseInt(numberStr, 10)
        
          if(!Number.isNaN(number)) {
            calliope.listeners.forEach((listener) => {
              listener.get(tag)?.setAttribute('value', number)
            })
          }
        
          buffer = buffer.slice(match.index + full.length)
        }

        // ifthere are no readable packets, don't let the buffer grow endlessly
        if(buffer.length > 128) {
          buffer = buffer.slice(-128)
        }
      }
    }
    catch (error) {
      console.error(error)
      calliope.listeners.forEach((listener) => {
        listener.get('connect')?.setAttribute('value', 0) 
      })
    }
  }
}

export const definition = {
  name: 'Calliope In',
  info: 'L:info_calliopeIn',
  category: 'io',
  gui_layout: {width: 1, height: 2},
  init: calliope.init,
  inputs: {},
  outputs: {
    connect: { type: 'button', text: ['L:connect', 'L:disconnect'], action: [calliope.connect, calliope.disconnect], init: calliope.initOutput, ports: false },
    a: { type: 'number', precision: 0, label: 'a', init: calliope.initOutput },
    b: { optional: true, type: 'number', precision: 0, label: 'b', init: calliope.initOutput },
    c: { optional: true, type: 'number', precision: 0, label: 'c', init: calliope.initOutput },
    d: { optional: true, type: 'number', precision: 0, label: 'd', init: calliope.initOutput },
    e: { optional: true, type: 'number', precision: 0, label: 'e', init: calliope.initOutput }
  }
}

export class UGen extends UGenBase {}