import { appHeader } from "../components/appHeader.js"
import { sidebar } from "../components/sidebar.js"
import { L } from "../i18n/language.js"
import { make } from '../utils/make.js'
import pkg from '../../package.json'
const buildDate = __BUILD_DATE__

export function about(container, messageHandler) {
  appHeader(container)
	sidebar(container, messageHandler)

	const aboutDIV = make('div', {id: 'content'})
	container.appendChild(aboutDIV)

  aboutDIV.innerHTML = `
<style>
  .version { margin: 50px -5px 50px -5px; padding: 20px 0 20px 10px; background-color: #f2f2f2; border-radius: 5px; }
</style>
  <h1>${L.get('aboutAmbar')}</h1>
  <hr>
<div style="margin-bottom: 50px;">
<p class="ambar" style="font-size: 1.4em; line-height: 140%; ">Das altgriechische Wort für Bernstein ist <i>ḗlektron</i>. Bereits den alten Griechen war bekannt, dass durch das Reiben von Bernstein an gewissen Materialien statische Elektrizität entsteht, und somit wurde dieses Wort zum Namensgeber der Elektrizität. Das spanische Wort <i>ámbar</i>, das ursprünglich aus dem Arabischen stammt, bezeichnet ebenfalls Bernstein.</p>
  <p>AMBAR SOUNDBOX ist eine browserbasierte Programmierumgebung für elektronische Musik. Sie wurde am <a href="https://www.zhdk.ch/forschung/icst">Institute for Computermusic and Sound Technology ICST</a> der <a href="https://www.zhdk.ch">Zürcher Hochschule der Künste ZHdK</a> in Zusammenarbeit mit dem <a href="https://creativecomputinglab.ch">Creative Computing Lab</a> der <a href="https://phzh.ch">Pädagogischen Hochschule Zürich PHZH</a> entwickelt.</p>
  <p>AMBAR SOUNDBOX entstand im Rahmen des Projekts &laquo;Informatik und Computermusik in der Schule&raquo;, unterstützt durch die <a href="https://dizh.uzh.ch">Digitalisierungsinitiative der Zürcher Hochschulen</a>.<br></p>
	<div class="version"><b>Version: ${pkg.version}</b>&nbsp;&nbsp;|&nbsp;&nbsp;${buildDate}</div>
  <h2>Konzept und Programmierung</h2>
  <p>Philippe Kocher</p>
  <h2>Inhaltliche Mitarbeit</h2>
  <p>Noémi Büchi<br>Adrian Degonda<br>Sascha Jösler<br>Caspar Nötzli<br>Thomas Schmalfeldt</p>
  <h2>Design</h2>
  <p>Lorena Strohner<br>Magdalena Zanquila</p>
</div>`	
}

