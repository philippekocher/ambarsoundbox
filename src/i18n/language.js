import { storage } from "../utils/storage.js"
import { languages } from "./languages.gen.js"


const loaders = Object.fromEntries(
  languages.map(lang => [lang, () => import(`./${lang}.gen.js`)])
)

let currentLanguage = storage.settings.get('language') ?? languages[0]
const cache = new Map()

const loadDictionary = async (lang) => {
  if(cache.has(lang)) return

  const loader = loaders[lang] ?? loaders[languages[0]]
  const mod = await loader()
  cache.set(lang, mod.default ?? {})
}

export const L = {
  languages,

  preload: (lang = currentLanguage) => loadDictionary(lang),

  setLanguage: async (lang) => {
    await L.preload(lang)
    currentLanguage = lang
  },
  
  getLanguage: () => {
    return currentLanguage
  }, 

  get: (key, ...args) => {
    const dict = cache.get(currentLanguage)
    if(!dict) {
      console.warn(`language (${currentLanguage}) not loaded yet.`)
      return key
    } 
    let result = dict[key]
    if(!result) {
      console.warn(`language (${currentLanguage}) – missing key: '${key}'.`)
      return key
    }
    for(let i = 0; i < args.length; i++) {
      result = result.replace(new RegExp(`%${i + 1}(?!\\d)`, 'g'), args[i])
    }
    return result
  },
  
  replace: (value) => {
    if(Array.isArray(value)) return value.map(item => L.replace(item)) 
    else if(typeof value != 'string') return value
    
    let string = value
    if(string.startsWith('L:')) {
      const key = string.slice(2)
      string = key ? L.get(key) : string
    }
    return string
  }
}