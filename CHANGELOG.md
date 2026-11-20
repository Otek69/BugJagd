# Changelog

Alle wichtigen Änderungen an BugJagd. Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionsnummern nach [Semantic Versioning](https://semver.org/lang/de/).

## [0.1.0] – 2026-11-20

### Neu

- Mini-App **Rabattrechner (Discount Calculator)** mit Anforderungen A1–A7. Schwellen, Prozente, Gutscheincode und
  Produkt ändern sich mit dem Übungscode.
- **5 Fehlerarten**, jede mit 1–2 Varianten, Hinweisen und Erklärung (fehlerhafter und korrigierter Code,
  Testtechnik, „Was hast du gerade gelernt?“, Lehrplan-Kapitel):
  - Grenzwertfehler beim Mengenrabatt (Boundary Error)
  - Fehlende Prüfung der Menge (Input Validation)
  - Abschneiden statt kaufmännisch runden (Rounding Error)
  - Rabatte addiert statt nacheinander angewendet (Calculation Error)
  - Dezimalkomma falsch gelesen (Localization)
- **Übungsart 1: Erkunden & Fehler melden** mit Fehlerbericht-Vorlage, automatischer Prüfung der Beweis-Eingabe
  und Bewertung nach 9 festen Regeln (R1–R9).
- **Übungscodes** `BUG-XXXX-XXXX`, zufällige Übung, Übung des Tages (Wiener Zeit), Link zum Teilen.
- **Schwierigkeitsstufen 1–3**.
- **Fortschritt:** Erfahrungspunkte, Ränge, Statistik nach Fehlerkategorie, Liste der Übungen,
  Export und Import als JSON-Datei.
- **Einstellungen:** Hell/Dunkel/System, 4 Schriftgrößen, Fortschritt löschen.
- Tests: 164 Unit-Tests (Vitest), 10 End-to-End-Tests (Playwright) mit Barrierefreiheits-Prüfung (axe-core).
- GitHub Actions: Prüfung bei jedem Hochladen, Veröffentlichung auf GitHub Pages vom Zweig `main`.
