import { languages } from '../i18n/languages.gen.js'

const workspacePrefix = 'ambarsoundbox:workspace:'
const settingsPrefix  = 'ambarsoundbox:settings:'
const stateName = 'ambarsoundbox:state'
const clipboardName = 'ambarsoundbox:clipboard'


// localStorage.clear()
// sessionStorage.clear()

export const storage = {
  workspace: {
    set: (name, data) => {
      localStorage.setItem(workspacePrefix + name, JSON.stringify(data))
    },
    get: (name) => {
      return JSON.parse(localStorage.getItem(workspacePrefix + name))
    },
    all: () => {
      const data = Object.entries(localStorage).filter(([k,v]) => k.startsWith(workspacePrefix))
 	    return data.map(([k,v]) => [k.replace(workspacePrefix,''), JSON.parse(v)])
 	    // all patch names as array
    },
    remove: (name) => {
      localStorage.removeItem(workspacePrefix + name)
    },
    uniqueName: (name) => {
      let i = 0
      let newName = name
      while(storage.workspace.get(newName)) {
        newName = name+' '+(++i)
      }
      return newName
    }
  },
  settings: {
    set: (name, data, persistent) => {
      tempSettings[name] = data
      if(persistent) localStorage.setItem(settingsPrefix + name, JSON.stringify(data))
    },
    get: (name) => {
      return tempSettings[name]
    },
    all: () => {
      const data = Object.entries(localStorage).filter(([k,v]) => k.startsWith(settingsPrefix))
 	    return Object.fromEntries(data.map(([k,v]) => [k.replace(settingsPrefix,''), JSON.parse(v)]))
    },
  },
  state: {
    set: (state) => {
      sessionStorage.setItem(stateName, JSON.stringify(state))
    },
    get: () => {
      return JSON.parse(sessionStorage.getItem(stateName))
    },
  },
  clipboard: {
    set: (data) => {
      sessionStorage.setItem(clipboardName, JSON.stringify(data))
    },
    get: () => {
      return JSON.parse(sessionStorage.getItem(clipboardName))
    }
  }
}

const tempSettings = storage.settings.all()

if(storage.settings.get('infobox') === undefined) storage.settings.set('infobox', 'true', true)
if(storage.settings.get('visualisation') === undefined) storage.settings.set('visualisation', 'true', true)
if(storage.settings.get('language') === undefined) storage.settings.set('language', languages[0], true)
