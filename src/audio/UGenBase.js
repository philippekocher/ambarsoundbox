const BLOCKSIZE = 128
// An AudioWorklet processes audio in 128-frame quanta by default.


// Base Class

export class UGenBase {
	constructor() {
		this.blocksize = BLOCKSIZE
		this.localBlockCount = -1
		this.outputPorts = new Map()
		this.inputPorts = new Map()
		this.parameters = {}
	}
	
  destroy() {
    for(const [, inputPort] of this.inputPorts) {
      for(const port of inputPort.connectedPorts) {
        port.removeConnection(inputPort)
      }
    }
    for(const [, outputPort] of this.outputPorts) {
      for(const port of outputPort.connectedPorts) {
        port.removeConnection(outputPort)
      }
    }
    this.inputPorts = null
    this.outputPorts = null
  }
		
  process = () => {}
  
	createInput = (portName, initValue, minValue, maxValue) => {
    this.inputPorts.set(portName, new InputPort(initValue, minValue, maxValue));
  }

	createOutput = (portName, initValue) => {
    this.outputPorts.set(portName, new OutputPort(initValue, this));
  }
  
  plug = (srcPort, dstUnit, dstPort) => {
    const source = this.outputPorts.get(srcPort)
  	const destination = dstUnit.inputPorts.get(dstPort)
  	if(source && destination) {
	  	source.addConnection(destination)
	  	destination.addConnection(source)
	  }
  }

  unplug = (srcPort, dstUnit, dstPort) => {
    const source = this.outputPorts.get(srcPort)
  	const destination = dstUnit.inputPorts.get(dstPort);
  	if(destination) {
      source.removeConnection(destination)
      destination.removeConnection(source)
	  }
  }
  
  set = (data) => {
    if(data == undefined) return
  	for(const [tag, value] of Object.entries(data)) {
  	  const inputPort = this.inputPorts.get(tag)
  	  if(inputPort) {
    		inputPort.setValue(value)
    		continue
    	}
  	  const outputPort = this.outputPorts.get(tag)
  	  if(outputPort) {
    		outputPort.setValue(value)
    		continue
    	}
    	if(tag in this.parameters) {
    	  this.parameters[tag] = value
    	}
  	}
  }
  
  pollValues() {
    let data = {}
    for(const [tag, port] of this.inputPorts) {
      data[tag] = port.buffer[0]
      data[tag+'_err'] = port.error
    }
    return data
  }
}

// Ports

class InputPort {
	constructor(initValue = 0, minValue, maxValue) {
		this.buffer = new Array(BLOCKSIZE).fill(initValue)
		this.connectedPorts = []
		this.staticValue = initValue
		this.minValue = minValue
		this.maxValue = maxValue
	}
	setValue(value) {
	  this.staticValue = value
	  this.buffer.fill(value)
  	// todo: ramp to the new value
  }
	process(blockCount) {
		if(this.connectedPorts.length == 0) return;
		
		this.buffer.fill(0)
    this.error = false
		for(const connectedPort of this.connectedPorts) {
    	const input = connectedPort.getAudioBlock(blockCount)
      for(let i=0; i<BLOCKSIZE; i++) {
      	this.buffer[i] += input[i];
      }
		}
    if(this.minValue != undefined || this.maxValue != undefined) {
      for(let i=0; i<BLOCKSIZE; i++) {
        if(this.minValue != undefined && this.buffer[i] < this.minValue) {
          this.buffer[i] = this.minValue
          this.error = true
        }
        if(this.maxValue != undefined && this.buffer[i] > this.maxValue) {
          this.buffer[i] = this.maxValue
          this.error = true
        }
      }
    }
	}
	addConnection(port) {
		this.connectedPorts.push(port)
  }
  removeConnection(port) {
    this.error = false
		this.connectedPorts = this.connectedPorts.filter(p => p != port)
		if(this.connectedPorts.length == 0) this.buffer.fill(this.staticValue)
		// todo: fill the buffer with 0 when audio output
	}
}

class OutputPort {
  constructor(initValue = 0, unit) {
    this.unit = unit
		this.connectedPorts = []
		this.buffer = new Array(BLOCKSIZE).fill(initValue)
  }
	getAudioBlock = (blockCount) => {
    if(blockCount > this.unit.localBlockCount) {
      this.unit.localBlockCount = blockCount
                
      for(let inputPort of this.unit.inputPorts) {
        inputPort[1].process(blockCount)
      }

			this.unit.process();
		}
		return this.buffer;
	}
	setValue = (value) => {
	  this.staticValue = value
	  this.buffer.fill(value)
  	// todo: ramp to the new value
  }
	addConnection(port) {
		this.connectedPorts.push(port)
  }
  removeConnection(port) {
		this.connectedPorts = this.connectedPorts.filter(p => p != port)
	}
}