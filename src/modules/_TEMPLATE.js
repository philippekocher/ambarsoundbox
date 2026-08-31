/* ===================================================================================
    EXAMPLE MODULE — use this file as a starting point for a new module.

   HOW TO ADD A NEW MODULE TO THE PROJECT (step by step):

   1. Copy this file and rename it (for example 'myModule.js'), and
      keep it in the 'modules/' directory

   2. Edit the 'definition' object, the 'UGen' class, and optionally the 
      'Visualisation' class. See the explanations in each section below.

   3. If needed, add any additional functions used by the object or classes.

   4. If you use the language system, add the corresponding word and its translations
      to the language file (../i18n/dictionary.csv).

   5. Rebuild the project so the new module is automatically included and the language
      system is updated.

   =================================================================================== */

// --- Required imports -------------------------------------------------------------
// UGenBase is the base class every module's 'UGen' class must extend. 
import { UGenBase } from "../audio/UGenBase.js"

// ModuleVisualisation is the base class for the small SVG/HTML preview shown on the
// module in the patcher UI.
import { ModuleVisualisation } from "../components/moduleVisualisation.js"


// --- The 'definition' object --------------------------------------------------------
// This object is pure metadata describing the module: how it is displayed, what
// ports it exposes, and how those ports behave in the patcher UI. It must be
// exported as 'definition' (this exact name is what the generator looks for).
export const definition = {

  // The module's name.
  // Use 'L:module_myModule' to use the language system. Every string that starts
  // with 'L:' is exposed to the translation mechanism
  name: 'L:module_myModule',

  // Short description shown in the info box in the patcher UI.
  info: 'L:info_myModule',

  // Category used to group modules in the palette. Existing categories in this
  // codebase are : 'generator', 'processor', 'utility', 'io', and 'gui'.
  category: 'utility',

  // Set 'gui_layout: {width, height}' for modules that need to be visible in
  // the play UI (e.g. ButtonGUI, KnobGUI, touchpadGUI, ...). Omit otherwise.
  // Width and height are sized in grid cells.

  // --- inputs -----------------------------------------------------------------
  //   type:      'knob' | 'number' | 'button' | 'text' | 'file-button' | 'play'
  //              (omit 'type' for a plain audio-rate signal inlet)
  //   label:     text shown next to the control
  //   min/max:   numeric range for knob/number controls
  //   value:     default value
  //   curve:     curve exponent for knobs (default: 0 = linear). Typically used for
  //              frequency-style knobs. (Calculation: value^e^curve.) 
  //   uom:       unit-of-measurement suffix shown next to the value, e.g. 'Hz'.
  //   optional:  true if the input is only optionally visible
  inputs: {
    in: {},                          // plain audio-rate inlet
    amount: {
      type: 'knob',
      label: 'L:amount',
      min: 0,
      max: 1,
      value: 0.5,
      uom: '%'
    }
  },

  // --- outputs ------------------------------------------------------------------
  // Same shape as 'inputs'. Most simple processors have a single 'out' port.
  outputs: {
    out: {}
  }

  // Optional 'attributes' object can be used for extra settings. The attributes are
  // given as a key/value pairs. The given default value can be overwritten by the
  // user in the UI. 
  // E.g. 'attributes: { visibleInPlayView: false }' (used by comment.js to show/hide
  // comments in play and layout view).
}


// --- The 'UGen' class ----------------------------------------------------------------
// This class extends UGenBase and contains the actual DSP that runs for every 
// audio block.
export class UGen extends UGenBase {

  // Use the constructor to initialise any state that needs to persist between
  // process() calls (phase accumulators, filter memory, envelope state, etc.).
  // Skip it otherwise.
  constructor() {
    super()
    this.someState = 0
  }

  // 'process' MUST be an arrow-function class field (not a normal method!) so
  // that 'this' stays bound correctly when the audio engine calls it.
  // It is called once per audio block. 'this.blocksize' samples must be written
  // for every connected output port on every call.
  process = () => {
    // Look up the ports you declared above by their tag name. Do this once per
    // call, outside the sample loop, for performance.
    const inputPort  = this.inputPorts.get('in')
    const amountPort = this.inputPorts.get('amount')
    const outputPort = this.outputPorts.get('out')

    for (let i = 0; i < this.blocksize; i++) {
      // If you need the sample rate for any calculations, use the global variable
      // sampleRate (provided by the audio engine's runtime context)

      // Every input/output port exposes a per-sample '.buffer' array of length
      // 'this.blocksize'. Read/write it directly:
      const value = inputPort.buffer[i]

      outputPort.buffer[i] = value
    }
  }

  // Optional: override 'pollValues()' if your module needs to report extra,
  // non-audio-rate data to the UI (e.g. a VU meter peak, a playhead position).
  //
  // pollValues() {
  //   let data = super.pollValues()
  //   data.someState = this.someState
  //   return data
  // }
}


// --- The 'Visualisation' class (OPTIONAL) --------------------------------------------
// Add this if your module needs to include a small live preview (waveform,
// filter curve, envelope shape, VU meter, etc). Skip it otherwise and remove
// the unused 'ModuleVisualisation' import above as well.
//

export class Visualisation extends ModuleVisualisation {
  render() {
    const rect = this.container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    // Build an inline SVG string reflecting current state, e.g.:
    this.container.innerHTML =
      '<svg viewBox="0 0 ' + w + ' ' + h + '">' +
      '<line x1="0" y1="' + (h / 2) + '" x2="' + w + '" y2="' + (h / 2) + '" ' +
      'stroke="' + this.color + '" stroke-width="1" stroke-opacity="0.25" />' +
      '</svg>'
  }
}
