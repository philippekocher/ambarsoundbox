// Shared functions for App and Player
// ---------------------------------------------------------------------------------

export function parseUrlState() {
  const match = window.location.pathname.match(/\/([^\/]+)$/)
  const id = match ? match[1] : ''
  const params = Object.fromEntries(new URLSearchParams(location.search))
  const view = ['build','play','layout'].includes(params.view) ? params.view : null
  return { id, params, view }
}

export function keyDownHandler() {
  return function onKeyDown(e) {
    const synth = window.synth
    if(!synth) return

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      synth.messageHandler?.({ action: 'delete' })
      return
    }

    if (!e.metaKey) return

    if (e.key === 'a') {
      e.preventDefault()
      synth.editor?.selectAll()
      return
    }

    const metaActions = { e: 'encapsulate', x: 'cut', c: 'copy', v: 'paste', d: 'duplicate' }
    if (metaActions[e.key]) {
      e.preventDefault()
      synth.messageHandler?.({ action: metaActions[e.key] })
      return
    }

    if (e.key === 'z') {
      e.preventDefault()
      synth.messageHandler?.({ action: e.shiftKey ? 'redo' : 'undo' })
    }
  }
}