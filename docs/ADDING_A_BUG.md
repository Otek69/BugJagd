# Anleitung: Neue Fehlerart hinzufügen

Eine Fehlerart = **eine Datei** + **eine Testdatei**. Keine andere Datei muss geändert werden.
Die Registry (`src/miniapps/registry.ts`) findet die neue Datei automatisch.

## Schritt 1: Katalog-Version erhöhen

Öffne `src/core/generator/catalog-version.ts` und erhöhe `CURRENT_CATALOG_VERSION` um 1
(nur einmal pro Veröffentlichung, auch wenn du mehrere Fehlerarten hinzufügst).

**Warum?** Alte Übungscodes sollen gleich bleiben. Ein alter Code merkt sich seine Katalog-Version
und benutzt nur Fehlerarten mit `since` kleiner oder gleich dieser Version.

## Schritt 2: Datei anlegen

Pfad: `src/miniapps/<mini-app-id>/bugs/<name-der-fehlerart>.ts`

Vorlage (Rabattrechner):

```ts
import { input, type DiscountBug } from '../bug-types';

interface Params {
  mode: 'variante-a' | 'variante-b';
}

const bug: DiscountBug<Params> = {
  id: 'discount.mein-neuer-fehler', // eindeutig, nie mehr ändern
  miniAppId: 'discount-calculator',
  category: 'validation', // siehe src/catalog/categories.ts
  since: 2, // = neue Katalog-Version aus Schritt 1
  obviousness: 2, // 1 leicht, 2 mittel, 3 gut versteckt
  injectionPoint: 'couponRate', // genau EIN Einfügepunkt aus DiscountHooks
  severity: 'medium', // Referenz-Schweregrad für Regel R8

  generateParams: (rng) => ({ mode: rng.pick(['variante-a', 'variante-b'] as const) }),

  // Liefert NUR den einen Einfügepunkt. `correct` sind die korrekten Funktionen.
  inject: (bp, appParams, correct) => ({
    couponRate(raw, params) {
      // fehlerhafte Version …
      return correct.couponRate(raw, params);
    },
  }),

  exampleTrigger: (app, bp) => input('100', '1', ' ' + app.coupon.code), // zeigt den Fehler
  exampleNonTrigger: (app) => input('100', '1', app.coupon.code), // zeigt ihn nicht

  hints: (app, bp) => ['allgemeiner Hinweis', 'genauerer Hinweis', 'fast die Lösung'],

  explain: (app, bp) => ({
    title: 'Kurzer Name des Fehlers',
    why: 'Warum passiert er? Bezug auf die Anforderung (z. B. A4).',
    buggyCode: 'vereinfachter fehlerhafter Code',
    fixedCode: 'vereinfachter korrigierter Code',
    howToFind: 'Welche Testtechnik findet ihn systematisch, mit konkreten Werten?',
    learned: '2–3 Sätze: Was hast du gerade gelernt?',
    syllabus: ['4.2.1'], // muss in src/content/syllabus.ts stehen
  }),
};

export default bug;
```

### Regeln für die Beispiel-Eingaben

- `exampleTrigger` muss den Fehler für **jede** Variante der Mini-App auslösen (die Zahlen ändern sich mit dem Code).
  Berechne die Eingabe darum aus `app` (den Parametern der Mini-App), nicht mit festen Zahlen.
- Verwende für Preise einen Dezimalpunkt oder ganze Zahlen, damit der Dezimalkomma-Fehler nicht stört (Entscheidung E8).
- `exampleNonTrigger` ist eine ähnliche Eingabe, bei der sich das Programm mit dem Fehler korrekt verhält.

## Schritt 3: Testdatei anlegen

Pfad: `src/miniapps/<mini-app-id>/bugs/<name-der-fehlerart>.test.ts` (gleicher Name, Endung `.test.ts`).

```ts
import { describe, expect, it } from 'vitest';
import { describeBugContract } from '../../../core/testing/bug-contract';
import app from '../index';
import { input } from '../bug-types';
import { runBoth, total } from '../test-fixtures';
import bug from './mein-neuer-fehler';

// Pflicht: beweist für 200 Varianten "mit Fehler falsch, ohne Fehler korrekt".
describeBugContract(bug, app);

// Empfohlen: konkrete, gut lesbare Beispiele mit festen Parametern.
describe('Mein neuer Fehler – Beispiele', () => {
  it('zeigt den Fehler bei …', () => {
    const { actual, expected } = runBoth(bug, { mode: 'variante-a' }, input('100', '1', ' SPAR10'));
    expect(total(expected)).toBe(9000);
    expect(total(actual)).toBe('error');
  });
});
```

## Schritt 4: Prüfen

```bash
npm test
```

Diese Tests müssen grün sein:

- der Vertrags-Test deiner Fehlerart,
- `registry.test.ts` (Testdatei vorhanden, Kategorie und Lehrplan-Kapitel bekannt),
- `generator.test.ts` (inklusive **Golden Seeds**: alte Codes unverändert).

Wenn „Golden Seeds“ fehlschlägt, hast du wahrscheinlich `since` vergessen oder zu klein gewählt.

## Schritt 5: Dokumentieren

- `CHANGELOG.md`: neue Fehlerart unter „Neu“.
- `docs/HISTORY.md`: Eintrag mit Anfrage, Umsetzung, Grund, Ergebnis.
- Falls eine neue Kategorie freigeschaltet wird: `availableFrom` in `src/catalog/categories.ts` anpassen.
