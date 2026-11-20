/** Formatiert Cent-Beträge im österreichischen Format, z. B. 123456 → "1.234,56 €". */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? '−' : '';
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, '0');
  const grouped = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${grouped},${rest} €`;
}

/** Formatiert ganze Cent als Preis-Eingabe mit Punkt, z. B. 199 → "1.99". */
export function centsToDotInput(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}
