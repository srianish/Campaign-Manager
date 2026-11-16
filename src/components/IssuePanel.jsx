// Lists everything that blocks launch for the selected item and its children.

import { sentence } from '../logic/validation.js';

export default function IssuePanel({ issues, onGoTo }) {
  if (issues.length === 0) {
    return <div className="issues ok">✓ No issues found. Everything required is filled in.</div>;
  }

  // Group the flat list by item so each item reads as one sentence.
  const groups = new Map();
  issues.forEach((i) => {
    if (!groups.has(i.id)) groups.set(i.id, { id: i.id, type: i.type, name: i.name, messages: [] });
    groups.get(i.id).messages.push(i.message);
  });

  return (
    <div className="issues bad">
      <h3>
        {issues.length} issue{issues.length === 1 ? '' : 's'} to fix before launch
      </h3>
      <ul>
        {[...groups.values()].map((g) => (
          <li key={g.id}>
            <button className="link-btn" onClick={() => onGoTo(g.id)}>
              Fix →
            </button>
            <span>{sentence(g.type, g.messages, g.name)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
