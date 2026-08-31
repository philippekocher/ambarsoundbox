import { appHeader } from "../components/appHeader.js"
import { sidebar } from "../components/sidebar.js"
import { make } from '../utils/make.js'


export function legal(container, messageHandler) {
  appHeader(container)
	sidebar(container, messageHandler)

	const legalDIV = make('div', {id: 'content'})
	container.appendChild(legalDIV)
	
  legalDIV.innerHTML = `
<div>
  <h1>Impressum</h1>
  <hr>
  <p>Zürcher Hochschule der Künste ZHdK<br>
  Institute for Computer Music and Sound Technology ICST<br>
  Pfingstweidstrasse 96 <br>
  CH-8031 Zürich</p>
  <br>
  <h1>Datenschutzerklärung</h1>
  <hr>
  <h2>1. Einverständnis</h2>
  <p>Mit der Nutzung dieser Webseite akzeptieren Sie diese Datenschutzerklärung und willigen auch in die darin erläuterten Funktionen ein.</p>
  <h2>2. Personendaten</h2>
  <p>Personendaten sind Angaben und Informationen, die sich auf eine bestimmte oder bestimmbare Person beziehen. Wir speichern Ihren Namen und Ihre E-Mail-Adresse, falls Sie sie beim Login angeben.
Wir speichern Personendaten so lange, wie dies für die Zwecke, für die sie erhoben werden, notwendig ist, beziehungsweise wir ein berechtigtes Interesse an der weiteren Speicherung haben. In allen anderen Fällen löschen wir Ihre Personendaten.
Personendaten werden ausschliesslich innerhalb der ZHdK verwendet und nicht an Dritte weitergegeben.</p>
  <h2>3. Nutzungsdaten</h2>
  <p>Jedes Mal, wenn Sie unsere Webseite aufrufen, werden automatisch folgende Informationen über den Zugriff erfasst:</p>
  <ul>
    <li>IP-Adresse des anfragenden Computers bzw. mobilen Endgeräts</li>
    <li>von welcher Webseite aufgerufen wurde (Referrer)</li>
    <li>Datum und Uhrzeit des Webbesuchs</li>
    <li>abgerufene Inhalte</li>
    <li>übertragene Datenmenge</li>
    <li>verwendeter Browser</li>
    <li>verwendetes Betriebssystem</li>
  </ul>
  <p>Diese Informationen werden als Protokolldateien (Logfiles) zum Zwecke der technischen Abläufe sowie für statistische Auswertungen der Zugriffe auf den Servern der ZHdK in der Schweiz (Zürich und Winterthur) gespeichert. Die Auswertungen dienen alleine zur Verbesserung des Onlineangebotes der ZHdK und der dahinterstehenden Technik.</p>
  <h2>4. Verwendung von Fonts</h2>
  <p>Die von dieser Webseite genutzten externe Schriften sind lokal eingebunden. Der Browser nimmt keine Verbindung mit den Servern von Dritten auf.</p> 
  <h2>5. Änderungen dieser Datenschutzerklärung</h2>
  <p>Diese Datenschutzerklärung kann im Zuge der Weiterentwicklung der Webseite sowie der Implementierung neuer Technologien und Gesetzesanpassungen mit sofortiger Wirkung und ohne Ankündigung geändert werden.</p>
</div>`	
}


