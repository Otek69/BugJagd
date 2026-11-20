# Anleitung: Neue Mini-App hinzufügen

Eine Mini-App ist ein kleines Testobjekt (z. B. Rabattrechner, Anmeldeformular).
Sie besteht aus einem Ordner unter `src/miniapps/<id>/`. Die Registry findet sie automatisch.

Vorlage: der Ordner `src/miniapps/discount-calculator/`.

## Dateien

| Datei              | Inhalt                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `logic.ts`         | Typen für Eingabe, Ausgabe, Parameter. Die **korrekte Logik** mit Einfügepunkten (`Hooks`). `run…()` und `…OutputsDiffer()`. |
| `params.ts`        | `generate…Params(rng)`: zufällige Varianten. `…Requirements(params)`: nummerierte Anforderungen A1, A2, …                    |
| `<Name>View.tsx`   | Die Oberfläche des Testobjekts (React). Bekommt `params`, `input`, `onInputChange`, `output`, `onRun`.                       |
| `index.ts`         | `export default` mit der `MiniAppDefinition`.                                                                                |
| `bug-types.ts`     | Typ-Abkürzung für Fehlerarten dieser Mini-App und eine Hilfsfunktion für Eingaben.                                           |
| `test-fixtures.ts` | Feste Parameter und Hilfsfunktionen für gut lesbare Tests.                                                                   |
| `logic.test.ts`    | Tests der korrekten Logik gegen jede Anforderung (Testorakel muss stimmen!).                                                 |
| `bugs/`            | Fehlerarten, siehe [ADDING_A_BUG.md](ADDING_A_BUG.md).                                                                       |

## Regeln

1. **Eingaben sind Texte** (`Record<string, string>`), genau wie eingetippt. Nur so können Fehler bei der
   Eingabeprüfung und bei Formaten entstehen.
2. **Jede Entscheidung der Logik ist ein Einfügepunkt.** Kleine Funktionen mit einem klaren Zweck,
   z. B. `parsePrice`, `isQuantityValid`, `roundCents`.
3. **Keine Gleitkomma-Rechnung im Testorakel**, wenn Geld oder genaue Werte im Spiel sind (Entscheidung E6).
4. **`outputsDiffer`** vergleicht nur, was der Benutzer sehen kann. Fehlertexte selbst nicht, nur welche Felder betroffen sind.
5. **`since`** = neue Katalog-Version (siehe ADDING_A_BUG.md, Schritt 1).
6. Mindestens eine Fehlerart mit `obviousness: 1`, damit Stufe 1 funktioniert (wird getestet).
7. Die Oberfläche braucht für jedes Feld ein sichtbares `<label>`. Die axe-Tests prüfen das.
8. Die Anforderungen müssen eindeutig sein. Jeder versteckte Fehler muss eine Anforderung verletzen.

## Prüfen

```bash
npm test
npm run e2e
```

Danach: `CHANGELOG.md`, `docs/HISTORY.md`, `README.md` (Abschnitt „Stand“) aktualisieren.
