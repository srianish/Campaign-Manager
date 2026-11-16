import Field from './Field.jsx';
import { GENDERS, LOCATIONS, STATUSES } from '../data/constants.js';
import { fieldErrors } from '../logic/validation.js';

const toNumber = (v) => (v === '' ? '' : Number(v));

export default function AdSetForm({ item, campaign, onChange, onStatus }) {
  const err = fieldErrors(item, { budgetType: campaign?.budgetType });
  const id = (n) => `${item.id}-${n}`;
  const t = item.targeting;
  const s = item.schedule;
  const setTargeting = (changes) => onChange({ targeting: { ...t, ...changes } });
  const setSchedule = (changes) => onChange({ schedule: { ...s, ...changes } });
  const toggleLocation = (loc) =>
    setTargeting({
      locations: t.locations.includes(loc) ? t.locations.filter((l) => l !== loc) : [...t.locations, loc],
    });
  const lifetime = campaign?.budgetType === 'Lifetime';

  return (
    <div className="form-grid">
      <Field label="Ad set name" error={err.name} htmlFor={id('name')}>
        <input id={id('name')} value={item.name} onChange={(e) => onChange({ name: e.target.value })} />
      </Field>

      <Field label={`${lifetime ? 'Lifetime' : 'Daily'} budget (₹)`} error={err.budget} htmlFor={id('budget')}>
        <input
          id={id('budget')}
          type="number"
          min="0"
          value={item.budget}
          onChange={(e) => onChange({ budget: toNumber(e.target.value) })}
        />
      </Field>

      <Field label="Start date" error={err.startDate} htmlFor={id('start')}>
        <input id={id('start')} type="date" value={s.start} onChange={(e) => setSchedule({ start: e.target.value })} />
      </Field>

      <Field
        label={lifetime ? 'End date (required)' : 'End date (optional)'}
        error={err.endDate}
        htmlFor={id('end')}
      >
        <input id={id('end')} type="date" value={s.end} onChange={(e) => setSchedule({ end: e.target.value })} />
      </Field>

      <Field label="Age range" error={err.age}>
        <div className="inline-pair">
          <input
            aria-label="Minimum age"
            type="number"
            value={t.ageMin}
            onChange={(e) => setTargeting({ ageMin: toNumber(e.target.value) })}
          />
          <span>to</span>
          <input
            aria-label="Maximum age"
            type="number"
            value={t.ageMax}
            onChange={(e) => setTargeting({ ageMax: toNumber(e.target.value) })}
          />
        </div>
      </Field>

      <Field label="Gender" htmlFor={id('gender')}>
        <select id={id('gender')} value={t.gender} onChange={(e) => setTargeting({ gender: e.target.value })}>
          {GENDERS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </Field>

      <Field label="Locations" error={err.locations}>
        <div className="chips">
          {LOCATIONS.map((loc) => (
            <label key={loc} className={`chip${t.locations.includes(loc) ? ' on' : ''}`}>
              <input type="checkbox" checked={t.locations.includes(loc)} onChange={() => toggleLocation(loc)} />
              {loc}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Interests" htmlFor={id('interests')} hint="Comma separated, e.g. Fashion, Shopping">
        <input
          id={id('interests')}
          value={t.interests}
          onChange={(e) => setTargeting({ interests: e.target.value })}
        />
      </Field>

      <Field label="Status" htmlFor={id('status')}>
        <select id={id('status')} value={item.status} onChange={(e) => onStatus(e.target.value)}>
          {STATUSES.map((st) => (
            <option key={st}>{st}</option>
          ))}
        </select>
      </Field>
    </div>
  );
}
