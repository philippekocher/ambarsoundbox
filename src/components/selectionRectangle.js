export class SelectionRectangle {
	constructor(editor) {
	  this.editorSVG = editor.editorSVG
	  this.visible = false
	  this.p1 = { x: 0, y: 0 }
	  this.p2 = { x: 0, y: 0 }
		this.x = 0
		this.y = 0
		this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
		this.svgElement.classList.add('selectionRect')
// 		this.svgElement.setAttribute('style', 'fill:#0000ff06;stroke:#0000ff;stroke-width:1')
		
		this.svgElement.onpointerdown = (e) => {
			e.stopPropagation()
			editor.deselectAll()
			editor.selectPatchCord(this)			
		}
	}
	
	hide() {
	  this.editorSVG.removeChild(this.svgElement)
	  this.visible = false
	}
	
	start(pos) {
	  this.p1 = this.p2 = pos
	  this.update()

    this.editorSVG.appendChild(this.svgElement)    
	  this.visible = true
	}
	
	move(pos) {
	  this.p2 = pos
	  this.update()
	}
	
	update() {
    this.svgElement.setAttribute('x', Math.min(this.p1.x, this.p2.x))
    this.svgElement.setAttribute('y', Math.min(this.p1.y, this.p2.y))
    this.svgElement.setAttribute('width', Math.abs(this.p1.x - this.p2.x))
    this.svgElement.setAttribute('height', Math.abs(this.p1.y - this.p2.y))
	}
	
	overlap(rect1) {
    const rect2 = this.svgElement.getBoundingClientRect();

  return !(
    rect1.top > rect2.bottom ||
    rect1.right < rect2.left ||
    rect1.bottom < rect2.top ||
    rect1.left > rect2.right
  );
	}
}