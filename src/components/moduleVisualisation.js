export class ModuleVisualisation {
  constructor() {
    this.color = '#000'
  }
  set(data) {
    for(var key in data) {
      this[key] = data[key]
    }
  }
  render() {
    return '<b>no visualisation</b>'
  }
}

