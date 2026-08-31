export class PatchCord {
	constructor(editor) {
	  this.editor = editor
		this.startPoint = null
		this.endPoint = null
		this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')
		this.svgElement.classList.add('patchCord')
		this.svgElement.setAttribute('style', 'fill:none;stroke-width:7')
		this.srcModule = null
		this.dstModule = null
		this.srcPort = null
		this.dstPort = null
    this.dstType = -1 // 0 = no, 1 = in, 2 = ctl-in

		this.svgElement.onpointerdown = (e) => {
			e.stopPropagation()
      if(!e.shiftKey) this.editor.deselectAll()
			editor.selectPatchCord(this)			
		}
	}
	
	destroy(updateDst = false) {
		this.svgElement.remove()
		this.srcModule.outPatchCords = this.srcModule.outPatchCords.filter((patchCord) => patchCord !== this)

		if(this.dstModule && updateDst) {
			this.dstModule.inPatchCords = this.dstModule.inPatchCords.filter((patchCord) => patchCord !== this)
		  this.dstModule.update()
  		this.editor.messageHandler?.({action: 'unplug', srcId: this.srcModule.id, srcPort: this.srcPort, dstId: this.dstModule.id, dstPort: this.dstPort})		
		}
		
    if(this.deleteBtn != undefined) {
      this.editor.editorSVG.removeChild(this.deleteBtn)
      this.deleteBtn = null
    }
	}
	
	select() {
		this.svgElement.classList.add('selected')    
 		this.deleteBtn = document.createElementNS('http://www.w3.org/2000/svg', "g")
		if(this.dstType == 1) {
      this.deleteBtn.setAttribute('transform', `translate(${this.endPoint.x - 14}, ${this.endPoint.y})`)
    }
    else {
      this.deleteBtn.setAttribute('transform', `translate(${this.endPoint.x}, ${this.endPoint.y - 14})`)
    }
    this.deleteBtn.setAttribute('stroke-width', 2)
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.classList.add('selected')
    circle.setAttribute('r', 8)
    
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', -5);
    line1.setAttribute('y1', -5);
    line1.setAttribute('x2', 5);
    line1.setAttribute('y2', 5);
    line1.setAttribute('style', 'stroke: white' )

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', -5);
    line2.setAttribute('y1', 5);
    line2.setAttribute('x2', 5);
    line2.setAttribute('y2', -5);
    line2.setAttribute('style', 'stroke: white' )
   
    this.deleteBtn.appendChild(circle)
    this.deleteBtn.appendChild(line1)
    this.deleteBtn.appendChild(line2)
    this.editor.editorSVG.appendChild(this.deleteBtn)
    
    this.deleteBtn.onpointerdown = (e) => {
			e.stopPropagation()
			this.destroy(true)
		}
	}
	
	deselect() {
		this.svgElement.classList.remove('selected')
		if(this.deleteBtn != undefined) {
      this.editor.editorSVG.removeChild(this.deleteBtn)
    }
	}
	
	update() {
		if(this.startPoint === null || this.endPoint === null) {
			this.svgElement.setAttribute('points', '')   				
			return
		}
		let dist = {
		  x: (this.endPoint.x - this.startPoint.x) * 0.5,
		  y: (this.endPoint.y - this.startPoint.y) * 0.5
		}
		dist.x = dist.x < 60 ? 60 : dist.x
		dist.y = dist.y < 100 ? 100 : dist.y
		
		switch(this.dstType) {
		  case 0:		
        this.svgElement.setAttribute('d', `
            M${this.startPoint.x} ${this.startPoint.y} 
            L${this.endPoint.x} ${this.endPoint.y}
        `)
        break
      case 1:
    		this.svgElement.setAttribute('d', `
        		M${this.startPoint.x} ${this.startPoint.y} 
		        C${this.startPoint.x + dist.x} ${this.startPoint.y} ${this.endPoint.x - dist.x} ${this.endPoint.y} ${this.endPoint.x} ${this.endPoint.y}
		    `)
		     break
		  case 2:
        this.svgElement.setAttribute('d', `
            M${this.startPoint.x} ${this.startPoint.y} 
            C${this.startPoint.x + dist.x} ${this.startPoint.y} ${this.endPoint.x} ${this.endPoint.y - dist.y} ${this.endPoint.x} ${this.endPoint.y}
        `)
        break
    }
	}
	
	setSrc(srcModule, srcPort) {
		srcModule.outPatchCords.push(this)
		this.srcModule = srcModule
		this.srcPort = srcPort
	}
	
	setDst(dstModule, dstPort) {
	  if(!dstModule || !dstPort) return false
	  
	  for(const existingPatchcord of this.srcModule.outPatchCords) {
	    if(existingPatchcord.srcModule == this.srcModule &&
	       existingPatchcord.srcPort == this.srcPort &&
	       existingPatchcord.dstModule == dstModule &&
	       existingPatchcord.dstPort == dstPort)
	    return false
	  }
	
		dstModule.inPatchCords.push(this)
		this.dstModule = dstModule
		this.dstPort = dstPort
				
		for(const [tag, inlet] of dstModule.signalInlets) {
		  if(tag == dstPort) {
		    this.dstType = 1
		  }
		}

		if(dstModule.controlInputs.get(dstPort)) {
      this.dstType = 2
		}

		this.update()
		dstModule.update()
		return true
	}
	
	setSrcPosition(pos) {
		this.startPoint = pos
		this.update()
	}
	
	setDstPosition(pos) {
		this.endPoint = pos
		this.update()
	}
	
	moveSrcPosition(dx, dy) {
		this.startPoint.x += dx
		this.startPoint.y += dy
		this.update()
	}
	
	moveDstPosition(dx, dy) {
		this.endPoint.x += dx
		this.endPoint.y += dy
		this.update()
	}
}