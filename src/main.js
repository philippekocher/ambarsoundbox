import { App } from './core/app.js'
import { Player } from './core/player.js'


if(window.location.pathname.includes('/embed/')) {
  new Player().init()
}
else {
  new App().init()
}