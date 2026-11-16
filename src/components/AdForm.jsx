import Field from './Field.jsx';
import { CTAS, LIMITS, STATUSES } from '../data/constants.js';
import { fieldErrors } from '../logic/validation.js';
import { readImageFile } from './imageUtils.js';

export default function AdForm({ item, onChange, onStatus, onToast }) {
  const err = fieldErrors(item);
  const id = (n) => `${item.id}-${n}`;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again
    if (!file) return;
    try {
      const { dataUrl, name } = await readImageFile(file);
      onChange({ creative: dataUrl, creativeName: name });
    } catch (error) {
      onToast(error.message, 'error');
    }
  };

  return (
    <div className="ad-layout">
      <div className="form-grid">
        <Field label="Ad name" error={err.name} htmlFor={id('name')}>
          <input id={id('name')} value={item.name} onChange={(e) => onChange({ name: e.target.value })} />
        </Field>

        <Field label="Creative" error={err.creative} htmlFor={id('creative')}>
          <div className="creative-input">
            <input id={id('creative')} type="file" accept="image/*" onChange={handleFile} />
            <input
              aria-label="Or paste an image URL"
              placeholder="…or paste an image URL"
              value={item.creative.startsWith('data:') ? '' : item.creative}
              onChange={(e) => onChange({ creative: e.target.value, creativeName: e.target.value })}
            />
            {item.creative && (
              <button className="link-btn danger" onClick={() => onChange({ creative: '', creativeName: '' })}>
                Remove creative
              </button>
            )}
          </div>
        </Field>

        <Field
          label="Headline"
          error={err.headline}
          htmlFor={id('headline')}
          hint={`${item.headline.length}/${LIMITS.headline}`}
        >
          <input id={id('headline')} value={item.headline} onChange={(e) => onChange({ headline: e.target.value })} />
        </Field>

        <Field
          label="Primary text"
          error={err.primaryText}
          htmlFor={id('text')}
          hint={`${item.primaryText.length}/${LIMITS.primaryText} recommended`}
        >
          <textarea
            id={id('text')}
            rows={3}
            value={item.primaryText}
            onChange={(e) => onChange({ primaryText: e.target.value })}
          />
        </Field>

        <Field
          label="Description (optional)"
          error={err.description}
          htmlFor={id('desc')}
          hint={`${item.description.length}/${LIMITS.description}`}
        >
          <input id={id('desc')} value={item.description} onChange={(e) => onChange({ description: e.target.value })} />
        </Field>

        <Field label="Call to action" error={err.cta} htmlFor={id('cta')}>
          <select id={id('cta')} value={item.cta} onChange={(e) => onChange({ cta: e.target.value })}>
            {CTAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="Landing page URL" error={err.landingUrl} htmlFor={id('url')}>
          <input
            id={id('url')}
            type="url"
            placeholder="https://example.com/product"
            value={item.landingUrl}
            onChange={(e) => onChange({ landingUrl: e.target.value })}
          />
        </Field>

        <Field label="Status" htmlFor={id('status')}>
          <select id={id('status')} value={item.status} onChange={(e) => onStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>

      <aside className="ad-preview" aria-label="Ad preview">
        <div className="ad-preview-head">Preview</div>
        <p>{item.primaryText || 'Primary text appears here'}</p>
        {item.creative ? (
          <img src={item.creative} alt="Ad creative preview" />
        ) : (
          <div className="ad-pv-empty">No creative uploaded</div>
        )}
        <div className="ad-pv-foot">
          <div>
            <strong>{item.headline || 'Headline'}</strong>
            <small>{item.description}</small>
          </div>
          <span className="cta">{item.cta || 'CTA'}</span>
        </div>
      </aside>
    </div>
  );
}
