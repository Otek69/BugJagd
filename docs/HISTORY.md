# Projektverlauf (HISTORY)

Für jeden Schritt: Was wurde gefragt, was wurde gemacht, warum, und was ist das Ergebnis.
Neueste Einträge oben.

---

## 2026-11-20 – Schritt 2: Version 0.1

**Gefragt:** Version 0.1 nach dem freigegebenen Plan bauen: 1 Mini-App (Rabattrechner), 5 Fehlerarten,
Übungsart 1 (Erkunden & Fehler melden) mit Beweis-Eingabe, Seeds, Fortschritt speichern.
Entscheidungen des Product Owners: 1A (privat bis v0.1 fertig, dann öffentlich), 2A (MIT), 3A (Doku auf Deutsch).

**Gemacht:**

- Projekt angelegt: Vite 8, React 19, TypeScript 5.9 (strict), zod 4, Vitest 5, Playwright 1.63, ESLint 9, Prettier 3.
- Kern ohne React: Zufallsgenerator mit Startwert, Übungscodes, Übung des Tages, Generator, Prüfung der
  Beweis-Eingabe, Bewertungsregeln R1–R9.
- Rabattrechner mit 7 Anforderungen und 8 Einfügepunkten. Geld wird in ganzen Cent gerechnet.
- 5 Fehlerarten, jede in einer eigenen Datei mit eigener Testdatei.
- Oberfläche: Start, Übung, Fortschritt, Einstellungen. Keine Animationen, keine Pop-ups.
- Fortschritt in localStorage, Prüfung mit zod, Export/Import als JSON-Datei.
- GitHub-Actions-Workflow für Tests und Veröffentlichung.
- Dokumentation: README (DE/EN), AGENTS.md, CLAUDE.md, CHANGELOG.md, Anleitungen für neue Fehlerarten und Mini-Apps.

**Warum so:**

- Einfügepunkte machen Fehlerarten zu einzelnen Dateien (Plugin-artig) und erlauben eine objektive Prüfung
  gegen die korrekte Logik (Testorakel).
- Katalog-Versionen (`since`) halten alte Übungscodes stabil, auch wenn neue Fehlerarten dazukommen.
- Details: AGENTS.md, Abschnitt 4 (Entscheidungen E1–E13).

**Ergebnis (ehrlich):**

- `npm run lint`: keine Fehler.
- `npm run typecheck`: keine Fehler.
- `npm test`: **164 von 164 Unit-Tests bestanden** (15 Testdateien). Darunter für jede Fehlerart:
  200 zufällige Varianten „mit Fehler falsch, ohne Fehler korrekt“; Generator mit je 1000 Codes pro Stufe.
- `npm run e2e`: **10 von 10 End-to-End-Tests bestanden** (Chromium), inklusive axe-Prüfung der Barrierefreiheit
  auf Start, Übung, Lösung, Fortschritt und Einstellungen (WCAG 2.1 A/AA).
- `npm run build`: erfolgreich. Größe: 387 kB JavaScript (118 kB komprimiert).
- Handy-Breite (390 px): auf keiner Seite seitliches Scrollen.
- `npm run dev` startet die App unter http://localhost:5173/.

**Probleme unterwegs:**

- Ein E2E-Test fand 2 Überschriften statt 1. Ursache: Der Test war zu ungenau. Test korrigiert.
- Nach dem Start einer Übung sprang der Fokus auf die alte Überschrift. Ursache: Kopfzeile und Seite haben die
  Adresse zu verschiedenen Zeitpunkten gelesen. Lösung: Die Adresse wird nur noch an einer Stelle gelesen (E13).
- `@axe-core/playwright` brachte eine andere Playwright-Version mit. Lösung: `playwright-core` exakt festgelegt (E12).
- Ein Hilfsbefehl hing, weil er auf eine Eingabe wartete (Fehler des Assistenten). Er wurde gestoppt.

**Noch nicht getestet:**

- Die Tests liefen nur in Chromium. Firefox und Safari wurden nicht getestet.
- Der GitHub-Actions-Workflow wurde lokal nicht ausgeführt. Er läuft erst auf GitHub.
- Die Veröffentlichung auf GitHub Pages funktioniert erst, wenn das Repository öffentlich ist und Pages
  eingeschaltet ist (Settings → Pages → Source: „GitHub Actions“).
- Bekannte Grenze: Die Bewertungsregeln prüfen die Form des Berichts, nicht jede inhaltliche Feinheit.

---

## 2026-11-20 – Schritt 1: Plan

**Gefragt:** Zuerst einen Plan zeigen (Architektur, Ordnerstruktur, Datenmodell für Mini-Apps, Fehler-Katalog
und Übungen) und auf das OK warten.

**Gemacht:** `docs/PLAN.md` geschrieben. Drei offene Entscheidungen mit Optionen vorgelegt
(Online-Version, Lizenz, Sprache der Dokumentation).

**Warum:** Wunsch des Product Owners: erst planen, dann bauen.

**Ergebnis:** Plan freigegeben. Antworten: 1A, 2A, 3A.
