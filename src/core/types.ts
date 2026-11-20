/**
 * Gemeinsame Datentypen von BugJagd.
 *
 * Begriffe:
 * - Mini-App (Testobjekt, test object): kleines Programm, das getestet wird.
 * - Einfügepunkt (injection point): benannte Funktion in der Logik einer Mini-App,
 *   die eine Fehlerart ersetzen darf.
 * - Fehlerart (bug type): eine Datei, die genau einen Einfügepunkt fehlerhaft ersetzt.
 */
import type { ComponentType } from 'react';
import type { Rng } from './random/rng';

/** Fehlerkategorien aus dem Katalog. */
export type BugCategory =
  | 'boundary'
  | 'validation'
  | 'calculation'
  | 'locale'
  | 'state'
  | 'datetime'
  | 'a11y'
  | 'api'
  | 'security'
  | 'performance';

/** Schweregrad (severity): Wie stark wirkt der Fehler auf das System? */
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export const SEVERITIES: readonly Severity[] = ['critical', 'high', 'medium', 'low'];

/** Priorität (priority): Wie dringend soll der Fehler behoben werden? */
export type Priority = 'high' | 'medium' | 'low';
export const PRIORITIES: readonly Priority[] = ['high', 'medium', 'low'];

export type Level = 1 | 2 | 3;
export const LEVELS: readonly Level[] = [1, 2, 3];

/** Verweis auf ein Kapitel des ISTQB-CTFL-v4.0-Lehrplans, z. B. "4.2.2". */
export type SyllabusSection = string;

/** Eine nummerierte Anforderung (Testbasis, test basis). */
export interface Requirement {
  id: string; // z. B. "A3"
  title: string;
  text: string;
}

/** Ein Eingabefeld einer Mini-App. */
export interface InputField<Input> {
  key: keyof Input & string;
  label: string;
  /** Hilfetext unter dem Feld, z. B. "z. B. 19,99" */
  help?: string;
}

/** Werte aller Felder als Texte, genau wie eingetippt. */
export type RawInput = Record<string, string>;

/** Eigenschaften, die jede Mini-App-Oberfläche bekommt. */
export interface MiniAppViewProps<Input, Output, Params> {
  params: Params;
  input: Input;
  onInputChange: (input: Input) => void;
  /** Ergebnis der letzten Ausführung, oder null, wenn noch nichts ausgeführt wurde. */
  output: Output | null;
  onRun: () => void;
}

export interface MiniAppDefinition<
  Input extends RawInput = RawInput,
  Output = unknown,
  Params = unknown,
  Hooks extends object = object,
> {
  id: string;
  /** Deutscher Name */
  title: string;
  /** Englischer Name */
  titleEn: string;
  /** Kurzbeschreibung in einem Satz */
  description: string;
  /** Ab dieser Katalog-Version gibt es die Mini-App. */
  since: number;
  /** Erzeugt die Variante der Anforderungen (Schwellen, Prozente, Namen …). */
  generateParams(rng: Rng): Params;
  requirements(params: Params): Requirement[];
  inputFields: InputField<Input>[];
  emptyInput(): Input;
  /** Die korrekte Umsetzung aller Einfügepunkte. */
  correctHooks: Hooks;
  /** Führt die Logik aus. hooks = korrekte Hooks, eventuell teilweise durch Fehler ersetzt. */
  run(input: Input, params: Params, hooks: Hooks): Output;
  /** Sind zwei Ergebnisse für den Benutzer sichtbar verschieden? */
  outputsDiffer(a: Output, b: Output): boolean;
  /** Ergebnis als kurzer Text für die Lösungsseite. */
  describeOutput(output: Output): string;
  /** Wörter, die in einem guten Fehlerbericht-Titel vorkommen können (Regel R2). */
  reportKeywords: string[];
  View: ComponentType<MiniAppViewProps<Input, Output, Params>>;
}

/** Texte, die nach der Übung erklären, was passiert ist. */
export interface BugExplanation {
  /** Kurzer Name des Fehlers, z. B. "Mengenrabatt beginnt ein Stück zu spät" */
  title: string;
  /** Warum passiert der Fehler? */
  why: string;
  /** Vereinfachter fehlerhafter Code */
  buggyCode: string;
  /** Vereinfachter korrigierter Code */
  fixedCode: string;
  /** Mit welcher Testtechnik hätte man ihn systematisch gefunden? */
  howToFind: string;
  /** "Was hast du gerade gelernt?" (2–3 Sätze) */
  learned: string;
  /** Lehrplan-Kapitel */
  syllabus: SyllabusSection[];
}

export interface BugDefinition<
  Input extends RawInput = RawInput,
  Params = unknown,
  Hooks extends object = object,
  BugParams = unknown,
> {
  /** Eindeutige ID, z. B. "discount.boundary-quantity-threshold" */
  id: string;
  miniAppId: string;
  category: BugCategory;
  /** Ab dieser Katalog-Version gibt es die Fehlerart. Nie nachträglich ändern. */
  since: number;
  /** 1 = leicht zu sehen, 3 = gut versteckt */
  obviousness: 1 | 2 | 3;
  /** Name des Einfügepunkts, den diese Fehlerart ersetzt. */
  injectionPoint: keyof Hooks & string;
  /** Referenz-Schweregrad für die Bewertung (Regel R8). */
  severity: Severity;
  generateParams(rng: Rng, appParams: Params): BugParams;
  /** Liefert die fehlerhafte Umsetzung des Einfügepunkts. */
  inject(bugParams: BugParams, appParams: Params, correct: Hooks): Partial<Hooks>;
  /** Eine Eingabe, die den Fehler sicher auslöst. */
  exampleTrigger(appParams: Params, bugParams: BugParams): Input;
  /** Eine Eingabe, bei der sich der Fehler NICHT zeigt (beweist: der Fehler ist gezielt). */
  exampleNonTrigger(appParams: Params, bugParams: BugParams): Input;
  /** Hinweise, vom allgemeinen zum genauen. */
  hints(appParams: Params, bugParams: BugParams): string[];
  explain(appParams: Params, bugParams: BugParams): BugExplanation;
}

/* Typ-gelöschte Varianten für Listen mit verschiedenen Mini-Apps. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyMiniApp = MiniAppDefinition<any, any, any, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyBug = BugDefinition<any, any, any, any>;

/** Ein versteckter Fehler in einer konkreten Übung. */
export interface PlantedBug {
  bug: AnyBug;
  params: unknown;
}

/** Eine konkrete Übung, vollständig aus Code + Stufe + Katalog-Version berechnet. */
export interface Exercise {
  code: string;
  level: Level;
  catalogVersion: number;
  app: AnyMiniApp;
  appParams: unknown;
  bugs: PlantedBug[];
}
