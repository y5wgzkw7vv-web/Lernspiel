# Victorias Blockwelt – testen und installieren

## Tests nach Phase

1. **Grundgerüst:** Spiel starten und „Wort-Diktat“ wählen. Die Aufgabe muss vollständig still bleiben, bis der Lautsprecher angeklickt wird. Danach darf ausschließlich das gesuchte Wort gesprochen werden. Victoria schreibt es frei mit der normalen Laptop- oder Tablet-Tastatur; Buchstabenkacheln dürfen nicht erscheinen. Beim Satz-Training gilt dasselbe: erst Lautsprecher anklicken, nur den Satz hören und frei eintippen. Beim Bildschirmwechsel muss jede laufende Stimme sofort stoppen. Begrüßung, Anweisung, Lob, Fehlerhinweis und Bewegungspause bleiben still. Beim ersten Fehler muss ein gelber Hinweis ohne Buzzer erscheinen; beim zweiten Fehler folgt die Abschreib-Hilfe. Neu laden und prüfen, ob die Sterne erhalten bleiben.
   Zusätzlich „Aktuelle Lernwörter“ wählen. In dieser Mission dürfen ausschließlich die 29 fest eingetragenen aktuellen Schulwörter vorkommen; pro Runde werden fünf davon nach dem Leitner-Prinzip ausgewählt.
2. **Elternbereich:** „Für Erwachsene“ öffnen, Rechenaufgabe lösen, eine Liste „Diktat 14.10.“ anlegen und aktivieren. Auf der Startseite muss sie als Wochenliste erscheinen. Ein Fehlerwort muss anschließend in der Statistik und im Leitner-Fach 1 stehen.
3. **Spielmodi:** Unter Einstellungen die Modi aktivieren und mehrere Runden spielen. Prüfen: Silben-Klatschen, Hör-Diktat, Lückenwort, Buchstabensalat, Lese-Blitz, Groß/Klein, Verlängern, Abschreiben und Satz-Diktat. Nach jeder Runde muss eine vorgelesene Bewegungspause erscheinen.
4. **Belohnung:** Sterne, Sammlung, Level-Karte, Tages-Serie und Statistik öffnen. JSON exportieren und wieder importieren.
5. **Tablet:** Hoch- und Querformat, Ton, deutsche Stimme und Mikrofonaufnahme prüfen. Nach einmaligem Laden im Flugmodus neu öffnen; das Spiel muss offline starten.

## Echte Diktat-Simulation

Die dritte Diktatstufe wird nach drei geschafften Runden automatisch freigeschaltet. Zum sofortigen Testen im Elternbereich Schwierigkeit 4 auswählen.

Nach dem Start spricht die Stimme fünf Sätze langsam hintereinander. Nach jedem vollständig gesprochenen Satz folgt eine Schreibpause von etwa sieben Sekunden. Im Statusfeld steht währenddessen „Schreibpause – Mila wartet“. Victoria kann durchgehend in dasselbe große Textfeld schreiben. Nach Satz 5 und dessen Schreibpause kündigt die Stimme die Wiederholung an, wartet nochmals kurz und liest den vollständigen Text genau einmal langsam vor. Erst danach erscheint „Ganz wiederholt. Lies deinen Text jetzt noch einmal durch.“

Beim Wort- und Satztraining gibt es zwei Wiederholtasten: **🔊 normal** liest die komplette Anweisung erneut vor; **🐢 langsam** spricht nur das gesuchte Wort beziehungsweise den Satz in reduziertem Tempo. Es gibt keinen Zeitdruck pro Aufgabe.

## Natürlichere Stimme einstellen

Im Spiel `Für Erwachsene → Einstellungen → Stimme auswählen` öffnen. Zuerst „Automatisch beste deutsche Stimme“ oder eine Stimme mit „Natural“, „Neural“, „Premium“ bzw. einen natürlich klingenden Namen wählen und über „Stimme probehören“ vergleichen. Auf Windows wird beispielsweise „Microsoft Katja“ gegenüber einfacheren Standardstimmen bevorzugt.

Für den natürlichsten Klang `Für Erwachsene → Wortlisten → Eigene menschliche Aussprache` öffnen. Dort kann ein Elternteil das Wort oder den vollständigen Diktatsatz exakt eingeben und anschließend einsprechen. Die Aufnahme ersetzt für genau diesen Inhalt die Computerstimme und bleibt lokal auf dem Gerät.

## Am einfachsten auf einem Windows-Laptop starten

1. Die ZIP-Datei vollständig entpacken: Rechtsklick → **Alle extrahieren**.
2. Im entpackten Ordner **Start-Victorias-Blockwelt.cmd** doppelt anklicken.
3. Nach etwa zwei Sekunden öffnet sich das Spiel im Browser unter `http://localhost:4181`.
4. Zum Beenden das Fenster „Victorias Blockwelt Server“ schließen.

Der Starter nutzt nur Windows PowerShell; Python oder eine andere Entwicklerumgebung ist dafür nicht nötig. Falls Windows nachfragt, darf die lokale Skriptdatei ausgeführt werden. Sie stellt ausschließlich den entpackten Spielordner unter `localhost` bereit.

### Manueller Start

Im entpackten Ordner PowerShell öffnen und ausführen:

```powershell
py -m http.server 4181
```

Danach `http://localhost:4181` öffnen. Falls `py` nicht gefunden wird, stattdessen `python -m http.server 4181` verwenden. `index.html` nicht einfach doppelt anklicken: Offline-Speicher, Installation und Mikrofon funktionieren über einen lokalen Webserver zuverlässiger.

## Als PWA über GitHub Pages aufs Tablet

1. Neues GitHub-Repository anlegen.
2. Den **Inhalt des entpackten ZIP-Ordners** in die oberste Ebene des Repositorys hochladen. `index.html` muss direkt dort liegen.
3. In GitHub `Settings → Pages → Deploy from a branch → main / (root)` wählen.
4. Die angezeigte HTTPS-Adresse auf dem Tablet öffnen und einmal vollständig laden.
5. iPad/iPhone: Safari → Teilen → **Zum Home-Bildschirm**. Android: Chrome → Menü → **App installieren**.

Danach funktioniert die App offline. Fortschritt und Sprachaufnahmen liegen lokal in diesem Browser. Vor einem Gerätewechsel im Elternbereich ein JSON-Backup exportieren. Mikrofonaufnahmen benötigen HTTPS und die ausdrückliche Browserfreigabe.

## Mit Apple Pencil auf dem iPad schreiben

Auf dem iPad kann Victoria direkt mit dem Apple Pencil in die große linierte Schreibfläche schreiben. iPadOS wandelt die Handschrift mit der Funktion **Kritzeln** in getippten Text um, sodass das Spiel das Wort anschließend prüfen kann.

1. Auf dem iPad `Einstellungen → Apple Pencil → Kritzeln` aktivieren.
2. Unter `Einstellungen → Allgemein → Tastatur → Tastaturen` eine deutsche Tastatur hinzufügen.
3. Das Spiel in Safari oder als App vom Home-Bildschirm öffnen.
4. Im Wort- oder Satz-Diktat zuerst auf 🔊 tippen.
5. Danach mit dem Apple Pencil direkt in die linierte Schreibfläche schreiben und **Prüfen** wählen.

Die Umwandlung findet laut Apple direkt auf dem iPad statt. Am Laptop funktioniert dieselbe Schreibfläche weiterhin mit der normalen Tastatur.

## Datenschutz und Sicherung

Es gibt keine Werbung, keine Konten und keine externen Bilder oder Audiodateien. Fortschritt, Statistik und Elternaufnahmen bleiben im lokalen Browserspeicher. Sie werden nicht automatisch zwischen Laptop und Tablet übertragen. Dafür im Elternbereich **Backup exportieren** und auf dem anderen Gerät **Backup importieren** verwenden.
