import { storage } from "../utils/storage.js"
import { appHeader } from "../components/appHeader.js"
import { sidebar } from "../components/sidebar.js"

import { make } from '../utils/make.js'
import { L } from "../i18n/language.js"
import { dialogBox } from "../components/dialogBox.js"


export function settings(container, messageHandler) {
  appHeader(container)
	sidebar(container, messageHandler)

// 	const settingsDIV = make('div', {id: 'content', className: 'settings'})
// 	container.appendChild(settingsDIV)

  const userSettings = storage.settings.all()

  container.appendChild(make('div', {id: 'content', className: 'settings'}, [
    make('h1', {text: L.get('Settings')}),
    make('hr'),
    make('div', {className: 'settingItem'}, [
      make('div', { className: 'switch', id: 'infoboxSwitch', attrs: {'data-name': 'infobox', 'data-labels': 'off,on', 'data-options': 'false,true'}}),
      make('div', { html: L.get('showInfobox') })     
    ]),
    make('div', {className: 'settingItem'}, [
      make('div', { className: 'switch', id: 'visualisationSwitch', attrs: {'data-name': 'visualisation', 'data-labels': 'off,on', 'data-options': 'false,true'}}),
      make('div', { html: L.get('showVisualisation') })     
    ]),
    make('div', {className: 'settingItem'}, [
      make('div', { className: 'switch', id: 'language', attrs: {'data-name': 'language', 'data-options': L.languages.join(',')}}),
      make('b', { html: L.get('language') }),
    ]),
    make('div', {className: 'settingItem'}, [
      make('button', {id: 'deleteLocalStorage', html: L.get('delete')}),
      make('div', {html: L.get('deleteLocalStorage')})
    ])
  ]))
  
  function renderSwitch(el) {
    const labels = el.dataset.labels?.split(',')
    const options = el.dataset.options.split(',')
   
    el.innerHTML = ''
    options.forEach(function (option, i) {
      const segment = document.createElement('div')
      segment.textContent = labels ? L.get(labels[i]) : L.get(option)
      segment.dataset.option = option
      segment.addEventListener('click', function () {
        setSwitchValue(el, option)
      })
      el.appendChild(segment)
    })
  }
 
  function setSwitchValue(el, value) {
    el.value = value;
 
    Array.from(el.children).forEach(function(segment) {
      segment.classList.toggle('selected', segment.dataset.option === value)
    })
  }
 
  document.querySelectorAll('.switch[data-options]').forEach(renderSwitch)
 
  // Load settings from localStorage
  setSwitchValue(parent.content.querySelector('#infoboxSwitch'), userSettings.infobox)
  setSwitchValue(parent.content.querySelector('#visualisationSwitch'), userSettings.visualisation)
  setSwitchValue(parent.content.querySelector('#language'), userSettings.language)

  // listen for changes on any setting
  container.addEventListener('click', async e => {
    const switchEl = e.target.closest('.switch')
    if(switchEl) {
      userSettings[switchEl.dataset.name] = switchEl.value
      storage.settings.set(switchEl.dataset.name, switchEl.value, true)
      if(switchEl.id === 'language') {
        await L.setLanguage(switchEl.value)
        settings(container, messageHandler) // reload settings view
      }
    }
  })
  
  container.querySelector('#deleteLocalStorage').addEventListener('click', async () => {
    const res = await dialogBox.confirm({ text: L.get('del')+'?' })
    if(res) {
      localStorage.clear()
    }
  })
}