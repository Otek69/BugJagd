/** Kurze Beschreibung der Umgebung für den Fehlerbericht. */
export function browserName(userAgent: string): string {
  const checks: [RegExp, string][] = [
    [/Edg\/(\d+)/, 'Edge'],
    [/OPR\/(\d+)/, 'Opera'],
    [/Firefox\/(\d+)/, 'Firefox'],
    [/Chrome\/(\d+)/, 'Chrome'],
    [/Version\/(\d+).*Safari/, 'Safari'],
  ];
  for (const [pattern, name] of checks) {
    const match = pattern.exec(userAgent);
    if (match) return `${name} ${match[1]}`;
  }
  return 'Unbekannter Browser';
}

export function defaultEnvironment(code: string, level: number): string {
  const agent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  return `BugJagd ${__APP_VERSION__}, ${browserName(agent)}, Übung ${code}, Stufe ${level}`;
}
