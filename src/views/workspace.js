import { appHeader } from "../components/appHeader.js"
import { sidebar } from "../components/sidebar.js"
import { dialogBox } from "../components/dialogBox.js"

import { make } from '../utils/make.js'
import { storage } from '../utils/storage.js'
import { L } from "../i18n/language.js"


export const workspace = async (container, appMessageHandler) => {
  const dbAvailable = await isDatabaseAvailable()

  appHeader(container)
	sidebar(container, appMessageHandler)
	
	const workspaceDIV = make('div', {id: 'content'})
	container.appendChild(workspaceDIV)

  const top = make('div', {id: 'top'}, [
    make('h1', {html: `${L.get('workspace')}`}),
    make('div', {id: 'buttons' }, [
      make('button', {id: 'newPatch', html: L.get('newPatch')} ),
      make('label', {for: 'fileInput', html: L.get('importJSON')}, [
        make('input', {id: 'fileInput', type: 'file', accept: '.json', hidden: true})
      ])
    ])
  ])
  workspaceDIV.appendChild(top)
  workspaceDIV.appendChild(make('hr'))

  top.addEventListener('pointerdown', async e => {
    if(e.target.id === 'newPatch') {
      const newName = storage.workspace.uniqueName(L.get('untitled'))
      const res = await dialogBox.prompt(L.get('newPatch'), {name: {value: newName}})
      if(res) {
        const name = storage.workspace.uniqueName(res.name)
        newPatch(name)
        setTimeout(() => { appMessageHandler?.({view: 'build', patchName: name }) }, 0)
      }
    }
  })

  top.querySelector('#fileInput').oninput = async e => {
    if(e.target.id === 'fileInput') {
      const file = e.target.files[0]
      if(file != undefined) {
        const reader = new FileReader()
        reader.onload = () => {
          const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
          appMessageHandler?.({json: reader.result, name: fileName})
          e.target.value = ''          
        }
        reader.onerror = () => {
          console.error("Error reading the file. Please try again.")
        }
        reader.readAsText(file)
      }
    }
  }
  
  const table = make('div')
  workspaceDIV.appendChild(table)
  
 	const allWorkspacePatches = storage.workspace.all()
  
  if((allWorkspacePatches.length ?? 0) === 0) {
    table.appendChild(make('p', {html: L.get('emptyWorkspace')}))
  }
  else {
    renderTable(table, allWorkspacePatches, dbAvailable)

    table.onpointerdown = async e => {
      e.stopPropagation()
      if(e.target.classList.contains('sortable')) {
        const col = e.target.getAttribute('sort')
        if(sortColumn === col) {
          sortDir *= -1
        } else {
          sortColumn = col
          sortDir = 1
        }
        renderTable(table, allWorkspacePatches, dbAvailable)
      }
      if(e.target.classList.contains('patch')) {
        const name = e.target.getAttribute('name')
        appMessageHandler?.({view: 'build', patchName: name })
      }
      if(e.target.classList.contains('rename')) {
        const oldName = e.target.getAttribute('name')
        const res = await dialogBox.prompt(L.get('rename'), {name: {value: oldName}})
        if(res && oldName != res.name) {
          renamePatch(oldName, storage.workspace.uniqueName(res.name))
          workspace(container, appMessageHandler, appMessageHandler)
        }
      }
      if(e.target.classList.contains('duplicate')) {
        const oldName = e.target.getAttribute('name')
        const newName = storage.workspace.uniqueName(oldName + ' copy')
        const res = await dialogBox.prompt(L.get('duplicate'), {name: {value: newName}})
        if(res) {
          duplicatePatch(oldName, storage.workspace.uniqueName(res.name))
          workspace(container, appMessageHandler, appMessageHandler)
        }
      }
      if(e.target.classList.contains('delete')) {
        const res = await dialogBox.confirm({text: `${L.get('deleteName', e.target.getAttribute('name'))}?`})
        if(res) {
          deletePatch(e.target.getAttribute('name'))
          workspace(container, appMessageHandler, appMessageHandler)
        }
      }
      if(e.target.classList.contains('share')) {
        sharePatch(e.target.getAttribute('name'))
      }
    }
  }
}

let sortColumn = 'name'   // 'name' or 'date'
let sortDir = 1           // 1 = ascending, -1 = descending

function sortPatches(patches) {
  return [...patches].sort((a, b) => {
    let cmp
    if (sortColumn === 'name') {
      cmp = a[0].localeCompare(b[0])
    } else {
      const dateA = a[1].meta?.date ?? 0
      const dateB = b[1].meta?.date ?? 0
      cmp = dateA - dateB
    }
    return cmp * sortDir
  })
}

function renderTable(container, allWorkspacePatches, dbAvailable) {
  container.innerHTML = ''

  const sorted = sortPatches(allWorkspacePatches)

  const arrow = col => sortColumn === col ? (sortDir === 1 ? '<span class="arrow">▲</span>' : '<span class="arrow">▼</span>') : ''

  const table = make('table', {}, [
    make('tr', {}, [
      make('th', { html: L.get('patch') + arrow('name'), className: 'sortable', attrs: { sort: 'name' } }),
      make('th', { html: L.get('edited') + arrow('date'), className: 'sortable', attrs: { sort: 'date' } }),
      make('th', {})
    ])
  ])
  container.appendChild(table)

  for (const patch of sorted) {
    const patchName = patch[0]
    const patchDateMs = patch[1].meta?.date
    const patchDate = patchDateMs ? new Date(patchDateMs).toLocaleString() : '--'
    table.appendChild(make('tr', {}, [
      make('td', { html: patchName, className: 'patch', attrs: { name: patchName } }),
      make('td', { html: patchDate }),
      make('td', {}, [
        make('button', { className: 'rename', title: L.get('rename'), attrs: { name: patchName } }),
        make('button', { className: 'duplicate', title: L.get('duplicate'), attrs: { name: patchName } }),
        make('button', { className: 'delete', title: L.get('delete'), attrs: { name: patchName } }),
        ...(dbAvailable ? [make('button', { className: 'share', title: L.get('share'), attrs: { name: patchName } })] : [])
      ])
    ]))
  }
}

function newPatch(name) {
  const meta = {name: name, date: Date.now()}
  const data = {meta: meta, modules: [] }
  storage.workspace.set(name, data)
}

function renamePatch(oldName, newName) {
  let data = storage.workspace.get(oldName)
  if(data) {
    data.meta.date = Date.now()
    data.meta.name = newName
    storage.workspace.set(newName, data)
    storage.workspace.remove(oldName)
  }
}

function duplicatePatch(oldName, newName) {
  let data = storage.workspace.get(oldName)
  if(data) {
    data.meta.date = Date.now()
    data.meta.name = newName
    storage.workspace.set(newName, data)
  }
}

function deletePatch(name) {
  storage.workspace.remove(name)
}

async function isDatabaseAvailable() {
  try {
    const res = await fetch('db.php?status')
    if(!res.ok) return false
    const { available } = await res.json()
    return available === true
  } catch(e) {
    return false
  }
}

async function sharePatch(name) {
  const patch = storage.workspace.get(name)
  const res = await fetch('db.php?share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  })
  const { url } = await res.json()
  await dialogBox.prompt('Link', {url: {textToCopy: url}}, {cancel: L.get('close')})
}