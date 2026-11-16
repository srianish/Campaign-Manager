// Appears when rows are ticked in the tree. Lets the user change one field on
// every selected item at once, or pause / activate / archive them all.

import { useState } from 'react';
import { BULK_FIELDS } from '../data/constants.js';
import { validateBulkValue } from '../logic/validation.js';
import { readImageFile } from './imageUtils.js';

const LEVEL_NAME = { campaign: 'campaign', adset: 'ad set', ad: 'ad' };
const defaultValue = (field) => (field.type === 'select' ? field.options[0] : '');

export default function BulkBar({ selection, onApply, onStatus, onClear, onToast }) {
  const fields = BULK_FIELDS[selection.level];
  const [fieldKey, setFieldKey] = useState(fields[0].key);
  const field = fields.find((f) => f.key === fieldKey) || fields[0];
  const [value, setValue] = useState(defaultValue(field));
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const count = selection.ids.length;

  const changeField = (key) => {
    const next = fields.find((f) => f.key === key);
    setFieldKey(key);
    setValue(defaultValue(next));
    setFileName('');
    setError('');
  };

  const apply = () => {
    const message = validateBulkValue(field.key, value);
    if (message) return setError(message);
    setError('');
    onApply(field.key, value);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { dataUrl, name } = await readImageFile(file);
      setValue(dataUrl);
      setFileName(name);
      setError('');
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  return (
    <section className="bulkbar" aria-label="Bulk edit">
      <strong>
        {count} {LEVEL_NAME[selection.level]}
        {count === 1 ? '' : 's'} selected
      </strong>

      <div className="bulk-edit">
        <select aria-label="Field to edit" value={field.key} onChange={(e) => changeField(e.target.value)}>
          {fields.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>

        {field.type === 'select' && (
          <select aria-label="New value" value={value} onChange={(e) => setValue(e.target.value)}>
            {field.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        )}
        {['text', 'url', 'number', 'date'].includes(field.type) && (
          <input
            aria-label="New value"
            type={field.type === 'text' ? 'text' : field.type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="New value"
          />
        )}
        {field.type === 'image' && (
          <span className="bulk-file">
            <input aria-label="New creative" type="file" accept="image/*" onChange={handleFile} />
            {fileName && <small>{fileName}</small>}
          </span>
        )}

        <button className="btn primary" onClick={apply}>
          Apply to {count}
        </button>
      </div>

      <div className="bulk-status">
        <button className="btn" onClick={() => onStatus('Paused')}>
          Pause
        </button>
        <button className="btn" onClick={() => onStatus('Active')}>
          Activate
        </button>
        <button className="btn" onClick={() => onStatus('Archived')}>
          Archive
        </button>
        <button className="btn ghost" onClick={onClear}>
          Clear selection
        </button>
      </div>
      {error && (
        <div className="field-error" role="alert">
          ⚠ {error}
        </div>
      )}
    </section>
  );
}
