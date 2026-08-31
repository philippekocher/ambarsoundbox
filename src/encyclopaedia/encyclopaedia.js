import { languages } from './languages.gen.js'

const loaders = Object.fromEntries(
  languages.map(lang => [lang, () => import(`./encyclopaedia.${lang}.gen.js`)])
)

const cache = new Map()

export const loadEncyclopaedia = async (lang) => {
  if(cache.has(lang)) return cache.get(lang)
  
  const loader = loaders[lang]
  if(!loader) return undefined
  
  const content = await loader()
  cache.set(lang, content ?? {})
  return content
}

export const getEntryForModule = async (module, lang = languages[0]) => {
  if(!cache.has(lang)) await loadEncyclopaedia(lang)
  
  return Object.entries(cache.get(lang).entries).find(([key, subobj]) =>
    Array.isArray(subobj.modules) &&
    subobj.modules.includes(module)
  )?.[0]
}

export const encylopaediaExists = (lang) => {
  if(cache.has(lang)) return true
  if(loaders[lang] != undefined) return true
  return false 
}