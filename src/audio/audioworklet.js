import { ugens } from '../modules/modules.gen.js'

class AudioWorklet extends AudioWorkletProcessor {
	constructor() {
		super()
		this.ugens = new Map()
		this.outUgens = []
		this.virtualOutUgens = []
		this.blockCount = 0
		this.port.onmessage = msg => {
//       console.log("message to worklet:\n", msg.data)
      this.handleMessage(msg.data)
    }
  }
  
	handleMessage(msg) {		
		let ugen;

    switch(msg.action) {
      case 'clearAll':
        this.outUgens = []
        for(const [, ugen] of this.ugens) { ugen.destroy() }  
        this.ugens = new Map()
        break
        
      case 'new':
  			if(ugens[msg.class]?.UGen) {
  			  const newUGen = new ugens[msg.class].UGen()
  			  const ugenDefinition = ugens[msg.class].definition
	  			this.ugens.set(msg.id, newUGen)
	  			if(msg.class == 'Out') {
	  			  this.outUgens.push(newUGen)
	  			}
          if(ugenDefinition.inputs) {
            for(const [tag, input] of Object.entries(ugenDefinition.inputs)) {
              if(input.ports != false)
                newUGen.createInput(tag, input.value, input.min, input.max)
            }
          }
          if(ugenDefinition.outputs) {
            for(const [tag, output] of Object.entries(ugenDefinition.outputs)) {
              if(output.ports == 2) {
                newUGen.createOutput(tag+'_0')
                newUGen.createOutput(tag+'_1')              
              }
              else if(output.portName) {
                newUGen.createOutput(output.portName)
              }
              else {
                newUGen.createOutput(tag)
              }
            }
          }
          if(msg.class == 'Subpatch') {
            for(const tag of Object.keys(ugenDefinition.inputs)) {
              newUGen.createInput(tag+'_temp')
              newUGen.createOutput(tag+'_temp')
            }
          }
          if(msg.class == 'Inlet') {
            for(const tag of Object.keys(ugenDefinition.outputs)) {
              newUGen.createInput(tag)
       	  		this.ugens.get(msg.subpatchId).plug(tag+'_temp', newUGen, tag)
            }            
          }
          if(msg.class == 'Outlet') {
           for(const tag of Object.keys(ugenDefinition.inputs)) {
              newUGen.createOutput(tag)
       	  		this.ugens.get(msg.id).plug(tag, this.ugens.get(msg.subpatchId), tag+'_temp')
            }            
          }
		  	}
		  	break
		  	
		  case 'delete':
  			ugen = this.ugens.get(msg.id)
	  		if(ugen) {
	  		  
	  		  this.outUgens = this.outUgens.filter(u => u !== ugen)
  			  this.ugens.delete(msg.id)
  			  ugen.destroy()
			  }
			  break
			  
			case 'plug':
  			ugen = this.ugens.get(msg.srcId)
	  		if(ugen) {
   	  		ugen.plug(msg.srcPort, this.ugens.get(msg.dstId), msg.dstPort)
   		  }
   		  break
   		  
			case 'unplug':
  			ugen = this.ugens.get(msg.srcId)
	  		if(ugen) {
   	  		ugen.unplug(msg.srcPort, this.ugens.get(msg.dstId), msg.dstPort)
   		  }
   		  break
   		  
   		case 'set':
   		  if(this.ugens.get(msg.id)) {
    			this.ugens.get(msg.id).set(msg.data)
    		}
  			break
  			
  		case 'detectVirtualOuts':
        this.virtualOutUgens = Array.from(this.ugens.values())
          .filter(ugen => !this.outUgens.includes(ugen))
          .filter(ugen => {
            const connectedInputs = Array.from(ugen.inputPorts.values())
              .filter(port => port.connectedPorts.length > 0).length
            const connectedOutputs = Array.from(ugen.outputPorts.values())
              .filter(port => port.connectedPorts.length > 0).length
              
//             const isVirtualOut = (connectedInputs > 0 || ugen.noInForVirtualOut) && connectedOutputs === 0
//             if (isVirtualOut) console.log(ugen, 'is virtual out!')        

            return (connectedInputs > 0 || ugen.noInForVirtualOut) && connectedOutputs === 0
          });
  		break
		}
	}
	
	process(inputs, outputs, parameters) {
		if(this.outUgens == []) return true
		
  	const blockSize = outputs[0][0].length
  	const output = outputs[0]
  	this.blockCount++

		for (let ch = 0; ch < output.length; ++ch) {
      const block = output[ch];
      block.fill(0)
    }

    for(let outUnit of this.outUgens) {
    	const buffers = outUnit.getMultichannelAudioBlock(this.blockCount)
  	  for(let ch = 0; ch < output.length; ++ch) {
        for(let i = 0; i < blockSize; ++i) {
       	  output[ch][i] += buffers[ch][i]
        }
      }
    }
    
    for(let virtualOutUnit of this.virtualOutUgens) {
      for(const outputPort of virtualOutUnit.outputPorts) {
        outputPort[1].getAudioBlock(this.blockCount)
      }
    }

    if(this.blockCount % 64 === 0) {
      const data = {}
      for(const [ugenId, ugen] of this.ugens) {
        data[ugenId] = ugen.pollValues()
      }
      this.port.postMessage(data)
    }
    return true;
  }
}

registerProcessor("AudioWorklet", AudioWorklet)