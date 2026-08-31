import { workspace } from '../views/workspace.js'
import { examplesView } from '../views/examplesView.js'
import { encyclopaediaView } from '../views/encyclopaediaView.js'
import { settings } from '../views/settings.js'
import { about } from "../views/about.js"
import { legal } from "../views/legal.js"
import { dialogBox } from "../components/dialogBox.js"
import { Synth } from './synth.js'
import { storage } from '../utils/storage.js'
import { loading } from '../components/loading.js'
import { L } from '../i18n/language.js'
import { make } from '../utils/make.js'
import { parseUrlState, keyDownHandler } from './shared.js'


export class App {
  constructor() {}
  async init() {
    document.body.innerHTML = ''
    document.body.appendChild(make('audio', {id: 'player', controls: true, autoplay: true}))
    
    this.container = document.body.appendChild(make('div'))
    
    loading(this.container)

    this.synth = new Synth()
    this.synth.model.persistInWorkspace = true

    this.view = 'build'

    await L.preload()

    const { id, view } = parseUrlState()
    if (view) this.view = view
    
    if(id) {    
      await this.importShared(id)
      const newPath = location.pathname.replace(/\/[^\/]+$/, '') || '/'
      history.replaceState({}, '', location.origin + newPath)
    }
    else {
      this.loadView(storage.state.get())
    }
    
    // Browser Back/Forward Buttons
    window.addEventListener('popstate', e => {
      this.loadView(e.state, false)
    })

    window.addEventListener('keydown', keyDownHandler())
  }
  
  renderSynth = (container, appMessageHandler, state) => {
    document.title = 'A M B A R :: ' + this.synth.model.patchName  
    this.synth.render(container, appMessageHandler, state)    
  }
    
  loadView = async (state, updateHistory = true) => {
    if(!state) state = { view: 'workspace' }
    this.currentCleanup?.()
    
    const views = { workspace, examplesView, encyclopaediaView, settings, about, legal,
                     build: this.renderSynth, play: this.renderSynth, layout: this.renderSynth }
    const renderFn = views[state.view] ?? this.currentView ?? workspace
    
    if(renderFn != this.renderSynth) this.synth.audioEngine.stopAudio()
  
    if(state.patchName) {
      const data = storage.workspace.get(state.patchName)
      this.synth.messageHandler({ action: 'load', data: data })
    }
    else state.patchName = storage.state.get()?.patchName
    
    if(state.entry) sessionStorage.setItem('ambarsoundbox:encyclopaedia:entry', state.entry)
    else sessionStorage.setItem('ambarsoundbox:encyclopaedia:entry', null)

    storage.state.set(state)
    if(updateHistory) window.history.pushState(state, null, null)
    
    this.currentCleanup = await renderFn(this.container, this.messageHandler, state)
    this.currentView = renderFn
  }
  
  importShared = async (id) => {
    const res = await fetch(`db.php?id=${id}`)
    if(!res.ok) throw new Error('LoadShared: Patch not found')
    const json = await res.json()
    
    if(json.error) {
      await dialogBox.info(`${L.get('alert_unknownIdentifier', id)}`)
      window.history.back()
    }
    else await this.importPatch(json)
  }

  importPatch = async (data, fileName) => {     
    data.meta ??= {}
    data.meta.date = Date.now()

    let name = data.meta?.name || fileName || L.get('untitled')
  
    if(storage.workspace.get(name)) {
      const args = {
        text: L.get('alert_patchAlreadyExists', name),
        addText: L.get('alert_patchAlreadyExists_add'),
        buttonText: { yes: L.get('continue_working'), buttons: [L.get('overwrite'), L.get('rename') + '...' ], no: L.get('cancel') }
      }
      const res = await dialogBox.confirm(args)
  
      // cancel
      if (res === false) {
        this.loadView(storage.state.get())
        return
      }
  
      // rename
      if (res === 1) {
        const rename = await dialogBox.prompt(L.get('rename'), { name: { value: storage.workspace.uniqueName(name) } })
        if (!rename) return
        name = rename.name
        data.meta.name = name
      }
  
      // continue
      if (res === true) {
        this.messageHandler?.({view: this.view, patchName: name })
        return
      }
    }

    storage.workspace.set(name, data)
    this.messageHandler?.({view: this.view, patchName: name })   
  }
  
  messageHandler = async (msg) => {
//     console.log("App messageHandler:\n", msg)
    if(msg.view) this.loadView(msg)
    if(msg.json) this.importPatch(JSON.parse(msg.json), msg.fileName)
  }
}