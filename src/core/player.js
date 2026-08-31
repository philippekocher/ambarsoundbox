import { dialogBox } from "../components/dialogBox.js"
import { Synth } from './synth.js'
import { loading } from '../components/loading.js'
import { L } from '../i18n/language.js'
import { storage } from '../utils/storage.js'
import { make } from '../utils/make.js'
import { parseUrlState, keyDownHandler } from './shared.js'


export class Player {
  constructor() {}
  async init() {
    document.body.innerHTML = ''
    document.body.appendChild(make('audio', {id: 'player', controls: true, autoplay: true}))
    
    this.container = document.body.appendChild(make('div'))

    loading(this.container)

    this.synth = new Synth(true)
    this.synth.settings.embedded = true
    this.synth.model.persistInWorkspace = false
    
    this.view = 'build'

    // JSON data sent through postMessage()
    window.addEventListener('message', e => {
      if(e.data) {
        const patch =
          typeof e.data === "string"
            ? JSON.parse(decodeURIComponent(e.data))
            : e.data
        setTimeout(() => { this.importPatch(patch) }, 500)
      }
    })
    
    await L.preload()  

    const { id, params, view } = parseUrlState()
    if (view) this.view = view    
    
    // settings
    const infobox = params.infobox?.toLowerCase() === 'true' ? 'true' : 'false'
    storage.settings.set('infobox', infobox)
    const visualisation = params.visualisation?.toLowerCase() === 'true' ? 'true' : 'false'
    storage.settings.set('visualisation', visualisation)
    const palette = params.palette?.toLowerCase() === 'true' ? true : false
    this.synth.settings.palette = palette

        
    if(id) {
      await this.importShared(id)
    }
    else {
      this.synth.messageHandler({ action: 'load', data: {}, resettable: true })
      this.loadView({view: this.view})
    }
    
    window.addEventListener('keydown', keyDownHandler())
  }
  
  loadView = async (state) => {
    this.synth.render(this.container, this.messageHandler, state)
  }
  
  importShared = async (id) => {
    const res = await fetch(`../db.php?id=${id}`)
    if (!res.ok) throw new Error('LoadShared: Patch not found')
    const json = await res.json()
    
    if(json.error) {
      await dialogBox.info(`${L.get('alert_unknownIdentifier', id)}`)
      this.loadView()
   }
    else await this.importPatch(json)
  }

  importPatch = async (data, fileName) => {
    data.meta ??= {}
    data.meta.date = Date.now()

    data.meta.name = data.meta.name || fileName || L.get('untitled')

    this.synth.messageHandler({ action: 'load', data: data, resettable: true })
    this.messageHandler?.({view: this.view, patchName: data.meta.name })   
  }
  
  messageHandler = async (msg) => {
//     console.log("Player messageHandler:\n", msg)
    if(msg.view) this.loadView(msg)
//     if(msg.json) this.importPatch(msg.json, msg.fileName)
  }
}