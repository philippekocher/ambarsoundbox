export class AudioEngine
{
  static #audioContext = null
  static #initPromise = null

  #audioWorkletNode
  #callbacks
  #audioFiles
  #isEmbedded

  constructor(isEmbedded) {
    this.#audioWorkletNode = null    
    this.#callbacks = {}
    this.#audioFiles = new Map()
    this.#isEmbedded = isEmbedded  
  }
  
  async startAudio(ugenList, suspended = false) {
    if(!AudioEngine.#initPromise) {
      AudioEngine.#initPromise = AudioEngine.#createSharedContext(this.#isEmbedded)
    }

    try {
      await AudioEngine.#initPromise
    }
    catch (error) {
      console.error('Error initialising audio engine:', error)
      // allow a future call to retry instead of staying broken forever
      AudioEngine.#initPromise = null
      return null
    }

    if(!this.#audioWorkletNode) {
      this.#audioWorkletNode = new AudioWorkletNode(AudioEngine.#audioContext, 'AudioWorklet', {
        numberOfInputs: 0,
        numberOfOutputs: 2, outputChannelCount : [2, 2] })
      this.#audioWorkletNode.port.onmessage = (msg) => this.notifyUnits(msg.data)
    }
    
    if(!suspended) {
      if(AudioEngine.#audioContext.state === 'suspended') {
          await AudioEngine.#audioContext.resume()
      }
      if(ugenList) {
        this.buildAudioGraph(ugenList)
      }
      const streamDestination = AudioEngine.#audioContext.createMediaStreamDestination()
      this.#audioWorkletNode.connect(streamDestination)
      document.querySelector('audio').srcObject = streamDestination.stream
      
      this.isRunning = true
    }
  }
  
  static async #createSharedContext(isEmbedded) {
    const ctx = new AudioContext()
    try {
      if(isEmbedded)
        await ctx.audioWorklet.addModule('../'+__AUDIOWORKLET_URL__)
      else
        await ctx.audioWorklet.addModule(__AUDIOWORKLET_URL__)
    } 
    catch (e) {
      ctx.close()
      throw e
    }
   
    // only assign once everything succeeded, so a partial failure
    // never leaves a half-initialized context lying around
    AudioEngine.#audioContext = ctx
  }
  
  stopAudio() {
    if(!AudioEngine.#audioContext) return
    this.#audioWorkletNode?.disconnect()
    for(const id in this.#callbacks) { this.#callbacks[id]({audio: 0}) }
    document.querySelector('audio').srcObject = null
   this.isRunning = false
  }
  
  async handleMessage(msg) {
//        console.log('audio engine: handle msg', msg)
    if(msg.action == 'getAudioState') {
      const state = {audio: this.isRunning, rec: false}
      msg.callback(state)
    }
    
    if(msg.action == 'poll') {
      this.#callbacks[msg.id] = msg.callback
    }
    
    // handle local audio files
    if(msg.action == 'set' && msg.data && 'file' in msg.data && 'name' in msg.data.file) {
      const file = msg.data.file
      const reader = new FileReader()
      const id = msg.id
      this.#audioFiles.set(id, msg.data.file)
      if(!AudioEngine.#audioContext) { await this.startAudio(null, true) }
      reader.onload = () => {
        this.loadAudio(id, reader.result, msg.data.file.name)
      }
      reader.onerror = () => {console.log("Error reading the file. Please try again.")}
      reader.readAsArrayBuffer(file);
      return
    }

    if(!this.#audioWorkletNode) return
    
    if(msg.action == 'delete') {
      delete this.#callbacks[msg.id]
      this.#audioFiles.delete(msg.id)
    }
    
    // postMessage() cannot handle functions
    const msgCopy = { ...msg }
    delete msgCopy.callback
    this.#audioWorkletNode.port.postMessage(msgCopy)

    if(['new','delete','plug','unplug'].includes(msg.action)) {
      this.#audioWorkletNode.port.postMessage({action: 'detectVirtualOuts'})
    }
  }
  
  async loadAudio(unitId, arrayBuffer, fileName) {
    try {
      if(AudioEngine.#audioContext) {
        const audioBuffer = await AudioEngine.#audioContext.decodeAudioData(arrayBuffer)
        this.#audioWorkletNode?.port.postMessage({'id': unitId, 'action': 'set', 'data': { 'buffer': audioBuffer.getChannelData(0) }})
        if(this.#callbacks[unitId]) {
          this.#callbacks[unitId]({ file: fileName, samples: audioBuffer.getChannelData(0) })
        }
      }
    } catch (err) {
      console.error(err)
    }
  }
  
  reloadFromMemory(ugenList) {
    if(!this.#audioWorkletNode) return
    this.buildAudioGraph(ugenList)
  }

  buildAudioGraph(ugenList) {
    this.#audioWorkletNode.port.postMessage({action: 'clearAll'})
    for(const unit of ugenList) {
      this.#audioWorkletNode.port.postMessage({action: 'new', id: unit.id, class: unit.class, subpatchId: unit.subpatchId})
      if(unit.parameters) {
        // 'file' isn't posted to the worklet; copy so the model's own data isn't mutated
        const { file, ...data } = unit.parameters
        this.#audioWorkletNode.port.postMessage({ action: 'set', id: unit.id, data })
      }
    }
    for(const unit of ugenList) {
      if(unit.plugs) {
        for(const plug of unit.plugs) {
          let msg = { ...plug};
          msg.action = 'plug'
          msg.srcId = unit.id
          this.#audioWorkletNode.port.postMessage(msg)
        }
      }
    }
    this.#audioWorkletNode.port.postMessage({action: 'detectVirtualOuts'})

        
    // reload existing audio files
    for(const [unitId, file] of this.#audioFiles) {
      const reader = new FileReader()
      reader.onload = () => {
       this.loadAudio(parseInt(unitId), reader.result, file.name)
      }
      reader.onerror = () => {console.log("Error reading the file. Please try again.")}
      reader.readAsArrayBuffer(file);
    }
  }
  
  notifyUnits(data) {
    if(!this.isRunning) return
    for(const id in this.#callbacks) {
      if(data[id]) {
        this.#callbacks[id]({audio: this.isRunning})
        this.#callbacks[id](data[id])
      }
    }
  }
}