import { formatCents } from '../../shared/format';
import type { MiniAppViewProps } from '../../core/types';
import type { DiscountField, DiscountInput, DiscountOutput, DiscountParams } from './logic';

type Props = MiniAppViewProps<DiscountInput, DiscountOutput, DiscountParams>;

const FIELDS: { key: DiscountField; label: string; help: string; inputMode: 'decimal' | 'text' }[] =
  [
    {
      key: 'price',
      label: 'Einzelpreis in Euro',
      help: 'Zum Beispiel 19,99',
      inputMode: 'decimal',
    },
    { key: 'quantity', label: 'Menge (Stück)', help: 'Ganze Zahl', inputMode: 'text' },
    {
      key: 'coupon',
      label: 'Gutscheincode (optional)',
      help: 'Leer lassen, wenn kein Gutschein',
      inputMode: 'text',
    },
  ];

export function DiscountView({ params, input, onInputChange, output, onRun }: Props) {
  const errors = output && !output.ok ? output.errors : {};
  return (
    <form
      className="miniapp-form"
      aria-label="Rabattrechner"
      onSubmit={(event) => {
        event.preventDefault();
        onRun();
      }}
    >
      <p>
        Produkt: <strong>{params.productName}</strong>
      </p>
      {FIELDS.map((field) => {
        const id = `discount-${field.key}`;
        const error = errors[field.key];
        return (
          <div className="field" key={field.key}>
            <label htmlFor={id}>{field.label}</label>
            <input
              id={id}
              name={field.key}
              type="text"
              inputMode={field.inputMode}
              autoComplete="off"
              value={input[field.key]}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
              onChange={(event) => onInputChange({ ...input, [field.key]: event.target.value })}
            />
            <span className="field-help" id={`${id}-help`}>
              {field.help}
            </span>
            {error && (
              <span className="field-error" id={`${id}-error`}>
                {error}
              </span>
            )}
          </div>
        );
      })}
      <button type="submit" className="button">
        Preis berechnen
      </button>
      <div className="miniapp-result" aria-live="polite" data-testid="discount-result">
        {output === null && <p>Noch nichts berechnet.</p>}
        {output && !output.ok && <p>Bitte die markierten Felder korrigieren.</p>}
        {output && output.ok && (
          <dl className="result-list">
            <dt>Zwischensumme</dt>
            <dd data-testid="subtotal">{formatCents(output.subtotalCents)}</dd>
            <dt>Mengenrabatt ({output.quantityRate} %)</dt>
            <dd data-testid="quantity-discount">−{formatCents(output.quantityDiscountCents)}</dd>
            <dt>Gutschein ({output.couponRate} %)</dt>
            <dd data-testid="coupon-discount">−{formatCents(output.couponDiscountCents)}</dd>
            <dt>Endpreis</dt>
            <dd data-testid="total">
              <strong>{formatCents(output.totalCents)}</strong>
            </dd>
          </dl>
        )}
      </div>
    </form>
  );
}
