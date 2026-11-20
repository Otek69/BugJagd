# BugJagd – Plan (Entwurf zur Freigabe)

Stand: 2026-11-20 · Status: **wartet auf OK des Product Owners**

Dieses Dokument beschreibt, wie BugJagd aufgebaut wird. Es ist in einfachem Deutsch geschrieben.
Fachbegriffe stehen zusätzlich auf Englisch in Klammern.

---

## 1. Ziel in einem Satz

BugJagd ist eine Web-App im Browser. Sie erzeugt kleine Programme mit versteckten Fehlern.
Du findest die Fehler, beweist sie mit einer konkreten Eingabe, schreibst einen Fehlerbericht
und bekommst danach eine Erklärung mit Bezug zum ISTQB-CTFL-v4.0-Lehrplan.

---

## 2. Technik und Begründung

| Thema | Entscheidung | Begründung |
|---|---|---|
| Grundgerüst | Vite + React + TypeScript | Wie vorgeschlagen. Verbreitet in Firmen, gut für das Portfolio. |
| Server | keiner | Alles läuft im Browser. Keine Kosten, keine Anmeldung, keine Daten verlassen den Computer. |
| Seiten-Navigation | „Hash-Router“ (Adressen wie `…/#/uebung`) | GitHub Pages kann keine Server-Weiterleitungen. Mit `#` funktionieren Links und das Neuladen der Seite immer. |
| Speichern | **localStorage** (nicht IndexedDB) für Version 0.1 | Der Fortschritt ist klein (wenige Kilobyte). localStorage ist einfacher und leichter zu testen. Der Speicher-Code steckt hinter einer Schnittstelle. Ein Wechsel zu IndexedDB später ändert nur eine Datei. |
| Export/Import | JSON-Datei, beim Import geprüft mit **zod** | zod prüft, ob die importierte Datei das richtige Format hat. Eine kaputte Datei kann den Fortschritt dann nicht zerstören. |
| Unit-Tests | Vitest | Wie vorgeschlagen. |
| End-to-End-Tests | Playwright + **axe-core** | axe-core prüft automatisch die Barrierefreiheit der Seiten. Das passt zum Thema und zeigt Qualität im Portfolio. |
| Code-Qualität | ESLint + Prettier + TypeScript „strict“ | Einheitlicher Code, Fehler werden früh gefunden. |
| Automatische Prüfung | GitHub Actions | Bei jedem Hochladen laufen Tests und Build. Danach wird die Seite auf GitHub Pages veröffentlicht. |
| Code-Editor (erst Übungsart 6) | Entscheidung später | Monaco (wie VS Code) ist groß (mehrere MB). CodeMirror 6 ist kleiner und barrierefreier. Ich frage dich, wenn wir dort sind. |
| Externe Dienste | keine | Keine KI-Dienste, kein Tracking, keine Schriftarten von fremden Servern. |

**Start für dich:** `npm install` und danach `npm run dev`. Voraussetzung: Node.js ab Version 20 ist installiert.
**Ehrlicher Hinweis:** Für die Playwright-Tests auf deinem eigenen Computer braucht man einmalig einen dritten Befehl
(`npx playwright install`), weil Playwright eigene Browser herunterlädt. Für das Starten der App ist er nicht nötig.

---

## 3. Grundidee: Wie entsteht ein Fehler?

Jede Mini-App besteht aus zwei Teilen:

1. **Logik** (reines TypeScript, ohne Oberfläche): rechnet, prüft, entscheidet.
2. **Oberfläche** (React): zeigt Eingabefelder und Ergebnisse.

Die Logik hat benannte **Einfügepunkte** (injection points). Beispiel Rabattrechner:
`preisEinlesen`, `mengePruefen`, `mengenrabattBerechnen`, `rabatteKombinieren`, `runden`.
Jeder Einfügepunkt hat eine **korrekte Standard-Umsetzung**.

Eine **Fehlerart** (bug type) ist eine Datei. Sie ersetzt genau einen Einfügepunkt durch eine fehlerhafte Version.

```
korrekte Logik  ──►  Referenz („Testorakel“, test oracle)
korrekte Logik + Fehler A + Fehler B  ──►  das Programm, das du testest
```

**Wie die Beweis-Eingabe objektiv geprüft wird:**
Die App führt deine Eingabe zweimal aus:
- einmal mit der korrekten Logik,
- einmal mit einer Version, die **nur diesen einen Fehler** enthält.

Wenn die beiden Ergebnisse verschieden sind, löst deine Eingabe genau diesen Fehler aus. Das ist eine klare Ja/Nein-Prüfung, kein Gefühl.
Wenn deine Eingabe ein anderes falsches Verhalten zeigt, sagt die App dir, welcher versteckte Fehler stattdessen ausgelöst wurde.

---

## 4. Ordnerstruktur

```
BugJagd/
├─ src/
│  ├─ core/                  Reine Logik ohne React (am besten testbar)
│  │  ├─ random/             Seed-Code, Zufallsgenerator mit festem Startwert
│  │  ├─ generator/          Baut aus Code + Stufe eine Übung
│  │  ├─ grading/            Prüft Beweis-Eingabe und Fehlerbericht (Regeln)
│  │  └─ types.ts            Gemeinsame Datentypen
│  ├─ catalog/
│  │  └─ categories.ts       Die 10 Fehlerkategorien mit Texten und Lehrplan-Bezug
│  ├─ miniapps/
│  │  ├─ registry.ts         Findet alle Mini-Apps und Fehlerarten automatisch
│  │  └─ discount-calculator/
│  │     ├─ index.ts         Beschreibung der Mini-App
│  │     ├─ logic.ts         Korrekte Logik mit Einfügepunkten
│  │     ├─ spec.ts          Anforderungen (die „Testbasis“, test basis)
│  │     ├─ DiscountCalculator.tsx   Oberfläche
│  │     └─ bugs/            EINE Datei pro Fehlerart + EINE Testdatei pro Fehlerart
│  ├─ exercises/
│  │  └─ explore-report/     Übungsart 1: Erkunden & Fehler melden
│  ├─ features/
│  │  ├─ progress/           Fortschritt, Erfahrungspunkte, Speichern, Export/Import
│  │  └─ settings/           Hell/Dunkel, Schriftgröße, Bewegung, Geräusche
│  ├─ content/               Lehrplan-Kapitel, später Glossar und Prüfungsfragen
│  ├─ ui/                    Wiederverwendbare Bausteine (Knopf, Feld, Layout)
│  └─ pages/                 Die einzelnen Seiten
├─ e2e/                      Playwright-Tests
├─ docs/
│  ├─ PLAN.md                Dieses Dokument
│  ├─ HISTORY.md             Was gefragt, was gemacht, warum, Ergebnis
│  ├─ ADDING_A_BUG.md        Anleitung: neue Fehlerart hinzufügen
│  └─ ADDING_A_MINIAPP.md    Anleitung: neue Mini-App hinzufügen
├─ AGENTS.md                 Architektur, Entscheidungen, Regeln
├─ CLAUDE.md                 Kurz, verweist auf AGENTS.md
├─ CHANGELOG.md              Änderungen pro Version
└─ README.md                 Deutsch und Englisch
```

**Plugin-artig:** `registry.ts` findet neue Dateien in `miniapps/*/bugs/` automatisch
(mit `import.meta.glob` von Vite). Eine neue Fehlerart = eine neue Datei + eine Testdatei. Keine andere Datei muss geändert werden.

---

## 5. Datenmodell

Die Namen im Code sind englisch (üblich in der Branche). Die Texte für dich sind deutsch.

### 5.1 Mini-App

```ts
interface MiniAppDefinition<Input, Output, Params> {
  id: string;                       // z. B. "discount-calculator"
  title: Term;                      // "Rabattrechner (Discount Calculator)"
  generateParams(rng): Params;      // Zufällige Varianten: Schwellen, Prozente, Codes, Produktnamen
  spec(params): Requirement[];      // Anforderungen als nummerierte Liste, z. B. "A3: Ab 10 Stück gibt es 5 % Rabatt."
  injectionPoints: string[];        // Namen der Einfügepunkte
  run(input, params, bugs): Output; // Führt die Logik aus (mit oder ohne Fehler)
  outputsDiffer(a, b): boolean;     // Vergleicht zwei Ergebnisse
  inputFields: FieldDefinition[];   // Felder für Oberfläche und Beweis-Eingabe
  Component: React-Komponente;
}
```

Wichtig: **Auch die Anforderungen ändern sich mit dem Seed.** Einmal gibt es ab 10 Stück 5 % Rabatt,
ein anderes Mal ab 25 Stück 8 %. So musst du jedes Mal die Anforderungen lesen und kannst die Fehler nicht auswendig lernen.

### 5.2 Fehlerart (eine Datei)

```ts
interface BugDefinition<Params> {
  id: string;                    // z. B. "discount.boundary-quantity-threshold"
  miniApp: string;               // "discount-calculator"
  category: BugCategory;         // "boundary" | "validation" | "calculation" | ...
  since: number;                 // Katalog-Version, ab der es diese Fehlerart gibt (für stabile Seeds)
  obviousness: 1 | 2 | 3;        // 1 = leicht zu sehen, 3 = gut versteckt
  generateParams(rng): Params;   // Varianten des Fehlers
  injectionPoint: string;        // welcher Einfügepunkt ersetzt wird
  inject(params): Funktion;      // die fehlerhafte Umsetzung
  exampleTrigger(appParams, params): Input;  // Eine Eingabe, die den Fehler sicher auslöst (für Tests und Lösung)
  expectedSeverity: Severity;    // Referenz-Schweregrad für die Bewertung
  hints: string[];               // Hinweise, vom allgemeinen zum genauen
  explanation: {
    why: string;                 // Warum passiert der Fehler? (mit Code-Ausschnitt: falsch / richtig)
    howToFind: string;           // Welche Testtechnik hätte ihn systematisch gefunden?
    learned: string;             // "Was hast du gerade gelernt?" (2–3 Sätze)
    syllabusRef: string;         // z. B. "CTFL 4.0, Kapitel 4.2.2 Grenzwertanalyse"
  };
}
```

### 5.3 Fehlerkategorien (Katalog)

| Kategorie | Deutsch (Englisch) | Erste Version |
|---|---|---|
| boundary | Grenzwertfehler (Boundary Error, Off-by-one) | 0.1 |
| validation | Eingabeprüfung (Input Validation) | 0.1 |
| calculation | Rundungs- und Rechenfehler (Calculation/Rounding Error) | 0.1 |
| locale | Text und Sprache (Localization) | 0.1 |
| state | Zustandsfehler (State Transition Error) | später |
| datetime | Datum und Zeit (Date/Time Error) | später |
| a11y | Barrierefreiheit (Accessibility) | später |
| api | API-Fehler (API Error) | später |
| security | Sicherheits-Grundlagen, nur simuliert (Security Basics) | später |
| performance | Performance (Performance) | später |

### 5.4 Übung (Exercise)

```ts
interface Exercise {
  code: string;            // "BUG-7F3A-K9Q2"
  level: 1 | 2 | 3;        // Schwierigkeitsstufe
  catalogVersion: number;  // welche Fehlerarten zur Auswahl standen
  miniApp: string;
  appParams: object;       // die konkrete Variante der Anforderungen
  bugs: { id: string; params: object }[];   // die versteckten Fehler
}
```

### 5.5 Fehlerbericht (Bug Report)

```ts
interface BugReport {
  title: string;
  steps: string[];          // nummerierte Schritte
  expected: string;         // erwartetes Ergebnis
  actual: string;           // tatsächliches Ergebnis
  severity: "kritisch" | "hoch" | "mittel" | "niedrig";   // Schweregrad (Severity)
  priority: "hoch" | "mittel" | "niedrig";                // Priorität (Priority)
  environment: string;      // wird automatisch vorausgefüllt: Browser, App-Version, Übungscode
  proofInput: Input;        // Beweis-Eingabe
}
```

### 5.6 Gespeicherter Fortschritt

```ts
interface Progress {
  schemaVersion: 1;         // für spätere Umwandlungen (Migrationen)
  xp: number;               // Erfahrungspunkte
  attempts: Attempt[];      // jede abgeschlossene Übung mit Bewertung
  foundByCategory: Record<BugCategory, { found: number; missed: number }>;
  settings: Settings;
}
```

---

## 6. Seeds (Übungscodes)

- **Format:** `BUG-XXXX-XXXX`, zum Beispiel `BUG-7F3A-K9Q2`.
  Es werden nur Zeichen benutzt, die man nicht verwechseln kann (kein O/0, kein I/1/L).
  Das ergibt über eine Billion verschiedene Codes.
- **Gleicher Code + gleiche Stufe = gleiche Übung.** Ein Link zum Teilen enthält beides, zum Beispiel
  `…/#/uebung?code=BUG-7F3A-K9Q2&stufe=2`.
- **Zufälliger Code** = Knopf „Neue Übung“.
- **Übung des Tages** = der Code wird aus dem Datum berechnet (Zeitzone Europe/Vienna). Alle Personen bekommen am gleichen Tag die gleiche Übung.
- **Stabilität:** Jede Fehlerart hat eine Katalog-Version (`since`). Ein Code merkt sich die Katalog-Version.
  Wenn später neue Fehlerarten dazukommen, ergibt ein alter Code trotzdem die gleiche Übung wie vorher.
  Ein Test („Golden Seeds“) prüft das: Eine Liste fester Codes muss immer die gleiche Übung ergeben.

---

## 7. Schwierigkeitsstufen in Version 0.1

| Stufe | Anzahl Fehler | Hinweise | Was du vorher siehst |
|---|---|---|---|
| 1 | genau 1, gut sichtbar (`obviousness` 1) | Hinweise sofort sichtbar | Die Fehlerkategorie wird genannt |
| 2 | 1–2 | Hinweise auf Knopfdruck (kostet Punkte) | Nur die Anzahl der Fehler |
| 3 | 2–3 | keine Hinweise | Nur die Anzahl der Fehler |

Später (ab Version 0.3): Stufen 4–5 mit Fehlern, die sich gegenseitig verdecken (Fehlermaskierung, defect masking).
Beispiel: Ein Eingabefehler verhindert, dass man den Grenzwertfehler dahinter überhaupt erreicht.

---

## 8. Version 0.1 – genauer Umfang

### 8.1 Mini-App: Rabattrechner

Eingaben: Einzelpreis in Euro (mit Dezimalkomma, z. B. `19,99`), Menge (ganze Zahl), Gutscheincode (optional).
Ausgaben: Zwischensumme, Mengenrabatt, Gutscheinrabatt, Endpreis – oder eine Fehlermeldung.

Beispiel-Anforderungen (die Zahlen ändern sich je nach Seed):
- A1: Der Einzelpreis muss zwischen 0,01 € und 9.999,99 € liegen. Dezimalkomma und Dezimalpunkt sind erlaubt.
- A2: Die Menge muss eine ganze Zahl von 1 bis 999 sein.
- A3: Ab 10 Stück gibt es 5 % Mengenrabatt. Ab 50 Stück gibt es 10 %.
- A4: Der Gutschein `SPAR10` gibt 10 % auf den Preis **nach** dem Mengenrabatt.
- A5: Der Endpreis wird kaufmännisch auf 2 Nachkommastellen gerundet.

### 8.2 Die 5 Fehlerarten

| # | Datei | Kategorie | Was ist falsch | Beispiel-Beweis-Eingabe | Testtechnik (Lehrplan) |
|---|---|---|---|---|---|
| 1 | `boundary-quantity-threshold` | Grenzwert | `>` statt `>=`: Bei genau 10 Stück gibt es keinen Rabatt | Menge = 10 | Grenzwertanalyse (Boundary Value Analysis), 4.2.2 |
| 2 | `missing-quantity-validation` | Eingabeprüfung | Menge 0 oder negativ wird angenommen, Preis wird 0 oder negativ | Menge = −3 | Äquivalenzklassen (Equivalence Partitioning), 4.2.1 |
| 3 | `rounding-truncation` | Rundung | Nachkommastellen werden abgeschnitten statt gerundet | Preis 1,99 × 10 Stück: 18,905 € soll 18,91 € werden, zeigt aber 18,90 € | Grenzwerte bei Rundung, 4.2.2 |
| 4 | `discount-added-not-chained` | Rechenfehler | Rabatte werden addiert (5 % + 10 % = 15 %) statt nacheinander angewendet (14,5 %) | Menge 10 + Gutschein | Entscheidungstabelle (Decision Table), 4.2.3 |
| 5 | `decimal-comma-parsing` | Text und Sprache | `19,99` wird als `19` gelesen | Preis = `19,99` | Äquivalenzklassen für Eingabeformate, 4.2.1 |

Jede Fehlerart hat mehrere Varianten. Beispiel Fehlerart 1: betrifft die erste oder die zweite Rabattschwelle;
oder der Rabatt beginnt eins zu früh (`>= 9`) statt eins zu spät.

### 8.3 Übungsart 1: Erkunden & Fehler melden – Ablauf

1. Du siehst links die Anforderungen und rechts die Mini-App. Oben steht immer: Übungscode, Stufe, Anzahl versteckter Fehler, „Fertig ist die Übung, wenn …“.
2. Du bedienst die Mini-App frei.
3. Du klickst „Fehler melden“ und füllst die Vorlage aus. Die Beweis-Eingabe kannst du mit einem Knopf aus der Mini-App übernehmen.
4. Die App bewertet sofort (siehe 8.4). Du kannst mehrere Berichte pro Übung schreiben.
5. „Übung beenden“: Die App zeigt alle versteckten Fehler, gefundene und übersehene, jeweils mit Erklärung,
   fehlerhaftem und korrektem Code nebeneinander, Testtechnik und Lehrplan-Kapitel, und „Was hast du gerade gelernt?“.

### 8.4 Bewertung des Fehlerberichts – feste Regeln

| Regel | Prüfung | Punkte |
|---|---|---|
| R1 Beweis | Die Beweis-Eingabe löst einen versteckten Fehler aus | 50 |
| R2 Titel | 10 bis 120 Zeichen lang und nennt ein Feld oder eine Funktion der Mini-App (z. B. „Menge“, „Rabatt“) | 5 |
| R3 Schritte | Mindestens 2 Schritte, jeder Schritt hat mindestens 3 Wörter | 10 |
| R4 Werte in Schritten | Die Werte der Beweis-Eingabe kommen in den Schritten vor | 10 |
| R5 Erwartet | Ausgefüllt und enthält einen konkreten Wert oder eine Anforderungsnummer (z. B. „A3“) | 5 |
| R6 Tatsächlich | Ausgefüllt und enthält einen konkreten Wert | 5 |
| R7 Getrennt | Erwartet und tatsächlich sind verschieden, und das Feld „tatsächlich“ beschreibt nicht das Erwartete (keine Wörter wie „sollte“, „müsste“) | 5 |
| R8 Schweregrad | Höchstens eine Stufe vom Referenz-Schweregrad entfernt | 5 |
| R9 Priorität und Umgebung | Beide ausgefüllt | 5 |

Zu jeder Regel zeigt die App: erfüllt / nicht erfüllt, und bei „nicht erfüllt“ einen konkreten Satz, was fehlt.
**Ehrlicher Hinweis:** Diese Regeln prüfen die Form, nicht jede inhaltliche Feinheit. Ein Mensch würde manchmal anders urteilen. Die Regeln stehen offen in der App, damit du immer weißt, wie bewertet wird.

### 8.5 Fortschritt und Spiel in Version 0.1

- Erfahrungspunkte (XP) und eine einfache Statistik pro Fehlerkategorie (gefunden / übersehen).
- Abzeichen, Fähigkeitenbaum, Vorschläge: ab Version 0.2.
- Speichern automatisch im Browser. Export/Import als JSON-Datei auf der Seite „Fortschritt“.

### 8.6 Gestaltung in Version 0.1

- Feste Kopfzeile mit immer gleicher Navigation: Start · Übung · Fortschritt · Einstellungen.
- Hell / Dunkel / wie das System. Schriftgröße in 4 Stufen. Bewegung: standardmäßig keine Animationen; „Bewegung reduzieren“ des Systems wird immer beachtet.
- Keine Geräusche. Keine Pop-ups. Rückmeldungen erscheinen an einer festen Stelle direkt unter dem Formular.
- Vollständig per Tastatur bedienbar, alle Felder beschriftet.

---

## 9. Tests (Qualitätsregeln)

**Unit-Tests (Vitest):**
- Für **jede Fehlerart** eine Testdatei mit drei Prüfungen:
  1. Mit dem Fehler löst die Beispiel-Beweis-Eingabe ein falsches Ergebnis aus.
  2. Ohne den Fehler ist das Ergebnis mit derselben Eingabe korrekt.
  3. Für 200 zufällige Seeds und alle Varianten gilt 1. und 2. ebenfalls.
- Ein allgemeiner Test prüft automatisch **alle** registrierten Fehlerarten. Eine neue Fehlerart ohne funktionierende Beweis-Eingabe lässt den Test fehlschlagen.
- Die korrekte Logik wird gegen die Anforderungen getestet (mit Grenzwerten).
- Seeds: gleicher Code = gleiche Übung; Golden-Seeds-Test.
- Bewertungsregeln R1–R9: je ein Test für „erfüllt“ und „nicht erfüllt“.
- Speichern, Export, Import (auch: kaputte Datei wird abgelehnt).

**End-to-End-Tests (Playwright):**
- Übung mit festem Code öffnen, Fehler auslösen, Bericht schreiben, Bewertung sehen.
- Neu laden: Fortschritt ist noch da.
- Export und Import.
- Einstellungen: dunkles Design und Schriftgröße bleiben gespeichert.
- Barrierefreiheit jeder Seite mit axe-core.
- Screenshots für die README werden automatisch erzeugt.

---

## 10. Fahrplan nach Version 0.1

Jeder Schritt bringt genau eine Übungsart oder eine Mini-App. Nach jedem Schritt: Tests, ehrlicher Bericht, Anleitung zum Ausprobieren.

| Version | Inhalt |
|---|---|
| 0.1 | Rabattrechner, 5 Fehlerarten, Übungsart 1, Seeds, Speichern |
| 0.2 | Mini-App Anmeldeformular (Eingabeprüfung, Sonderzeichen, Emojis, sehr lange Texte, Barrierefreiheit). Abzeichen. |
| 0.3 | Übungsart 2: Testfälle entwerfen + Mutation Score (Äquivalenzklassen, Grenzwertanalyse). Stufen 4–5. |
| 0.4 | Mini-App Warenkorb + Entscheidungstabellen in Übungsart 2 |
| 0.5 | Mini-App Ticketbuchung + Zustandsübergänge (State Transition Testing) |
| 0.6 | Übungsart 4: Code lesen (Review) |
| 0.7 | Mini-App Altersprüfung (Datum, Schaltjahr, Zeitzone) |
| 0.8 | Mini-App REST-API + Übungsart 5: API-Testen |
| 0.9 | Übungsart 3: Ursachen finden (Konsole, Netzwerk-Tab, Logs, Stacktraces) |
| 0.10 | Lernmodule zu den 6 Lehrplan-Kapiteln, Glossar mit Karteikarten (Leitner) |
| 0.11 | Prüfungsmodus (eigene Multiple-Choice-Fragen im CTFL-Stil) |
| 0.12 | Übungsart 6: Automatisieren (Editor, Web Worker, `test`/`expect`/`page.fill`) |
| 1.0 | Fähigkeitenbaum, Statistik mit Vorschlägen, Feinschliff |

Die Reihenfolge ist ein Vorschlag. Du kannst sie ändern.

---

## 11. Offene Entscheidungen (bitte beantworten)

Siehe Nachricht im Chat. Die Antworten werden hier und in `AGENTS.md` eingetragen.
