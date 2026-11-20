# AGENTS.md – Architektur, Entscheidungen, Regeln

Diese Datei ist für alle, die an BugJagd arbeiten: Menschen und KI-Assistenten.
Sprache der Dokumentation: Deutsch (Entscheidung des Product Owners, 2026-11-20). Namen im Code: Englisch.

## 1. Rollen

- **Product Owner:** Inhaber des Repositorys. Lernt Softwaretesten (ISTQB CTFL v4.0), programmiert nicht selbst.
  Entscheidet über Umfang und Reihenfolge.
- **Entwicklung:** KI-Assistent (Claude Code). Erklärt jeden Schritt in einfachem, wörtlichem Deutsch,
  ohne Redewendungen und ohne Ironie. Berichtet ehrlich, was funktioniert und was nicht.
  Fragt bei Entscheidungen mit mehreren sinnvollen Wegen mit 2–3 klaren Optionen.

## 2. Ziel

Eine Lern-Web-App, die unendlich viele Übungen zum Softwaretesten erzeugt. Gleichzeitig ein öffentliches
Portfolio-Projekt. Darum gilt: sauber, gut dokumentiert, selbst gut getestet.

## 3. Architektur

```
src/
├─ core/            Reine Logik ohne React. Am besten testbar.
│  ├─ random/       rng.ts (Zufall mit Startwert), code.ts (Übungscodes, Übung des Tages)
│  ├─ generator/    generator.ts (Code + Stufe → Übung), catalog-version.ts
│  ├─ grading/      proof.ts (Beweis-Eingabe prüfen), report-rules.ts (Regeln R1–R9)
│  ├─ testing/      bug-contract.ts (gemeinsamer Vertrags-Test für jede Fehlerart)
│  └─ types.ts      Alle gemeinsamen Typen
├─ catalog/         Fehlerkategorien, Schweregrad- und Prioritätstexte
├─ content/         Lehrplan-Kapitel, Fachbegriffe (Deutsch + Englisch)
├─ miniapps/        Eine Mini-App pro Ordner, Fehlerarten in <app>/bugs/
│  └─ registry.ts   Findet Mini-Apps und Fehlerarten automatisch (import.meta.glob)
├─ exercises/       Übungsarten (v0.1: explore-report = Erkunden & Fehler melden)
├─ features/        progress (Speichern, Punkte, Export/Import), settings
├─ pages/           Seiten: Start, Übung, Fortschritt, Einstellungen
├─ app/             App-Rahmen, Layout, Hash-Router
└─ ui/              Wiederverwendbare Bausteine
e2e/                Playwright-Tests
docs/               Plan, Verlauf, Anleitungen, Screenshots
```

### 3.1 Kernidee: Einfügepunkte

Jede Mini-App hat eine **korrekte Logik** mit benannten **Einfügepunkten** (injection points),
zum Beispiel `quantityRate` oder `roundCents` im Rabattrechner. Eine **Fehlerart** ist eine Datei,
die genau einen Einfügepunkt durch eine fehlerhafte Version ersetzt.

- Korrekte Logik ohne Fehler = **Testorakel** (test oracle).
- Korrekte Logik + versteckte Fehler = **Testobjekt**, das der Benutzer testet.

### 3.2 Beweis-Eingabe (objektive Prüfung)

Eine Eingabe beweist den versteckten Fehler F, wenn beides gilt:

1. Das Testobjekt liefert ein anderes Ergebnis als das Testorakel.
2. Wenn man **nur F** entfernt, ändert sich das Ergebnis des Testobjekts.

Umsetzung: `src/core/grading/proof.ts`. Vergleich der Ergebnisse: `outputsDiffer` der Mini-App.

### 3.3 Übungscodes und Stabilität

- Format `BUG-XXXX-XXXX`, Zeichen 2–9 und A–Z ohne I, L, O (31 Zeichen, über 850 Milliarden Codes).
- `generateExercise(catalog, { code, level, catalogVersion })` ist deterministisch.
- Jeder Bereich hat einen eigenen Zufallsstrom (`rng.fork(label)`). So beeinflussen sich Bereiche nicht.
- Jede Mini-App und jede Fehlerart hat `since` (Katalog-Version). Eine Übung merkt sich ihre Katalog-Version.
  Neue Dateien mit höherem `since` ändern alte Codes nicht. Der Test „Golden Seeds“ sichert das ab.
- Übung des Tages: Code aus dem Datum in der Zeitzone Europe/Vienna.

### 3.4 Generator-Regeln

- Stufe 1: genau 1 Fehler mit `obviousness: 1`, Kategorie wird genannt, Hinweise kostenlos.
- Stufe 2: 1–2 Fehler, Hinweise kosten 5 XP.
- Stufe 3: 2–3 Fehler, keine Hinweise.
- Fehler einer Übung ersetzen verschiedene Einfügepunkte.
- Jeder Fehler muss mit seiner Beispiel-Eingabe im fertigen Testobjekt beweisbar sein. Sonst wählt der Generator
  eine andere Kombination (deterministisch, höchstens 50 Versuche).

### 3.5 Fortschritt

- Gespeichert in `localStorage` unter `bugjagd.progress`. Format geprüft mit zod (`features/progress/schema.ts`).
- Beschädigte Daten werden unter `bugjagd.progress.broken` gesichert und nicht verwendet.
- Export/Import als JSON-Datei. Import zeigt vorher, was ersetzt wird, und braucht eine Bestätigung.
- Erfahrungspunkte werden aus den gespeicherten Versuchen berechnet, nicht separat gezählt.

## 4. Entscheidungen (Architecture Decision Records, kurz)

| Nr. | Datum      | Entscheidung                                                              | Begründung                                                                                                     |
| --- | ---------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| E1  | 2026-11-20 | Vite + React + TypeScript (strict)                                        | Verbreitet in Firmen, passt zum Portfolio.                                                                     |
| E2  | 2026-11-20 | Kein Server, alles im Browser                                             | Keine Kosten, keine Anmeldung, Datenschutz.                                                                    |
| E3  | 2026-11-20 | Eigener Hash-Router statt react-router                                    | GitHub Pages kann nicht umleiten. 40 Zeilen statt einer Abhängigkeit.                                          |
| E4  | 2026-11-20 | localStorage statt IndexedDB                                              | Daten sind klein; einfacher. Speicher-Code ist gekapselt (`storage.ts`).                                       |
| E5  | 2026-11-20 | zod für Import und Laden                                                  | Kaputte Dateien dürfen den Fortschritt nicht zerstören.                                                        |
| E6  | 2026-11-20 | Geld in ganzen Cent, exakte Zwischenwerte (Cent × 10 000)                 | Keine Gleitkomma-Fehler im Testorakel.                                                                         |
| E7  | 2026-11-20 | Rabattprozente im Rabattrechner sind ungerade                             | Dann gibt es immer Fälle mit genau einem halben Cent (für Rundungsfehler).                                     |
| E8  | 2026-11-20 | Beispiel-Eingaben verwenden Dezimalpunkt oder ganze Zahlen                | So stört der Dezimalkomma-Fehler die anderen Fehler nicht.                                                     |
| E9  | 2026-11-20 | Keine Animationen, keine Pop-ups, Rückfragen direkt auf der Seite         | Ruhige, vorhersehbare Oberfläche (Wunsch des Product Owners).                                                  |
| E10 | 2026-11-20 | Lizenz MIT                                                                | Entscheidung des Product Owners.                                                                               |
| E11 | 2026-11-20 | Repository bleibt privat bis v0.1 fertig ist, danach öffentlich           | Entscheidung des Product Owners. GitHub Pages braucht ein öffentliches Repository (kostenloser Plan).          |
| E12 | 2026-11-20 | `@playwright/test` und `playwright-core` exakt auf 1.63.0                 | Gleiche Version für Playwright und axe-core; passt zu den Browsern in der Entwicklungsumgebung.                |
| E13 | 2026-11-20 | Adresse (Route) wird an genau einer Stelle gelesen (`Shell` in `App.tsx`) | Sonst sehen Kopfzeile und Seite kurz verschiedene Adressen, und der Fokus springt auf die falsche Überschrift. |

## 5. Regeln für die Arbeit

1. **Jede Fehlerart braucht eine Testdatei** mit gleichem Namen (`<name>.test.ts`). Der Test
   `src/miniapps/registry.test.ts` prüft das automatisch.
2. Jede Testdatei einer Fehlerart ruft `describeBugContract(bug, app)` auf. Das beweist für 200 Varianten:
   mit dem Fehler falsch, ohne den Fehler korrekt, Gegen-Eingabe unauffällig.
3. **`since` und IDs nie ändern**, wenn sie einmal veröffentlicht sind. Neue Dateien bekommen die nächste Katalog-Version.
4. Die korrekte Logik einer Mini-App ist das Testorakel. Sie braucht eigene Tests gegen die Anforderungen.
5. Oberfläche auf Deutsch. Fachbegriffe zusätzlich auf Englisch in Klammern: „Grenzwertanalyse (Boundary Value Analysis)“.
6. Texte: kurz, wörtlich, ohne Redewendungen. Jede Aufgabe sagt, was „fertig“ bedeutet.
7. Keine externen Dienste (keine KI-Dienste, kein Tracking, keine fremden Schriftarten).
8. Keine Animationen, keine Geräusche, keine Pop-ups ohne Grund.
9. Vor jedem Commit: `npm run check` und `npm run e2e`. Ergebnis ehrlich in `docs/HISTORY.md` eintragen.
10. Nach jedem Schritt aktualisieren: `CHANGELOG.md`, `docs/HISTORY.md`, bei Architektur-Änderungen diese Datei.
11. Keine echten ISTQB-Prüfungsfragen kopieren. Eigene Formulierungen verwenden.

## 6. Erweitern

- Neue Fehlerart: [docs/ADDING_A_BUG.md](docs/ADDING_A_BUG.md)
- Neue Mini-App: [docs/ADDING_A_MINIAPP.md](docs/ADDING_A_MINIAPP.md)
- Fahrplan: [docs/PLAN.md](docs/PLAN.md), Abschnitt 10
