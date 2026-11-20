import { useState } from 'react';
import { exerciseShareUrl } from '../../app/router';

export function ShareLink({ code, level }: { code: string; level: number }) {
  const [message, setMessage] = useState('');
  const url = exerciseShareUrl(code, level);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Der Link wurde in die Zwischenablage kopiert.');
    } catch {
      setMessage('Kopieren war nicht möglich. Markiere den Link im Feld und kopiere ihn selbst.');
    }
  }

  return (
    <div className="share-link">
      <label htmlFor="share-url">Link zu dieser Übung (zum Wiederholen oder Teilen)</label>
      <div className="share-row">
        <input id="share-url" type="text" readOnly value={url} onFocus={(e) => e.target.select()} />
        <button type="button" className="button button-secondary" onClick={copy}>
          Link kopieren
        </button>
      </div>
      <p className="field-help" role="status">
        {message}
      </p>
    </div>
  );
}
