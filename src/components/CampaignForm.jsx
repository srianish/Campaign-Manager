import Field from './Field.jsx';
import { BUDGET_TYPES, OBJECTIVES, STATUSES } from '../data/constants.js';
import { fieldErrors } from '../logic/validation.js';

export default function CampaignForm({ item, onChange, onStatus }) {
  const err = fieldErrors(item);
  const id = (n) => `${item.id}-${n}`;

  return (
    <div className="form-grid">
      <Field label="Campaign name" error={err.name} htmlFor={id('name')}>
        <input
          id={id('name')}
          value={item.name}
          placeholder="e.g. Diwali Sale – Sales"
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </Field>

      <Field label="Objective" error={err.objective} htmlFor={id('objective')}>
        <select id={id('objective')} value={item.objective} onChange={(e) => onChange({ objective: e.target.value })}>
          {OBJECTIVES.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </Field>

      <Field
        label="Budget type"
        error={err.budgetType}
        htmlFor={id('budgetType')}
        hint="Lifetime budgets need an end date on every ad set."
      >
        <select id={id('budgetType')} value={item.budgetType} onChange={(e) => onChange({ budgetType: e.target.value })}>
          {BUDGET_TYPES.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </Field>

      <Field label="Status" htmlFor={id('status')} hint="Activating is blocked while issues remain.">
        <select id={id('status')} value={item.status} onChange={(e) => onStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
    </div>
  );
}
