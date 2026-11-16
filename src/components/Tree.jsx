// Expandable Campaign > Ad set > Ad tree. Each row is a single line:
// chevron, checkbox, name, status, readiness badge. The action buttons
// (+ Ad set, Duplicate, Delete) appear when you hover over or focus a row.

import { childrenOf } from '../logic/helpers.js';
import { collectIssues } from '../logic/validation.js';
import ReadinessBadge from './ReadinessBadge.jsx';

const CHILD_LABEL = { campaign: '+ Ad set', adset: '+ Ad' };

function Node({ item, ctx, p }) {
  const kids = childrenOf(item);
  const isOpen = p.expanded.has(item.id);
  const issueCount = collectIssues(item, ctx).length;
  const childCtx = item.type === 'campaign' ? { budgetType: item.budgetType } : ctx;

  return (
    <li>
      <div className={`row ${item.type}${p.activeId === item.id ? ' active' : ''}`}>
        {item.type === 'ad' ? (
          <span className="chev-space" />
        ) : (
          <button
            className="icon-btn"
            onClick={() => p.onToggle(item.id)}
            aria-label={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? '▾' : '▸'}
          </button>
        )}
        <input
          type="checkbox"
          checked={p.selection.ids.includes(item.id)}
          onChange={() => p.onSelect(item)}
          aria-label={`Select ${item.name}`}
        />
        <button className="row-name" onClick={() => p.onActivate(item.id)} title={item.name}>
          {item.name || '(unnamed)'}
        </button>
        {item.status !== 'Draft' && (
          <span className={`pill status-${item.status.toLowerCase()}`}>{item.status}</span>
        )}
        <ReadinessBadge count={issueCount} archived={item.status === 'Archived'} />
        <span className="row-actions">
          {CHILD_LABEL[item.type] && (
            <button className="link-btn" onClick={() => p.onAddChild(item)}>
              {CHILD_LABEL[item.type]}
            </button>
          )}
          <button className="link-btn" onClick={() => p.onDuplicate(item.id)}>
            Duplicate
          </button>
          <button className="link-btn danger" onClick={() => p.onDelete(item)}>
            Delete
          </button>
        </span>
      </div>
      {isOpen && kids.length > 0 && (
        <ul>
          {kids.map((k) => (
            <Node key={k.id} item={k} ctx={childCtx} p={p} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Tree({ campaigns, ...p }) {
  if (campaigns.length === 0) {
    return <div className="empty">No campaigns yet. Click “+ New campaign” to start.</div>;
  }
  return (
    <ul className="tree">
      {campaigns.map((c) => (
        <Node key={c.id} item={c} ctx={{}} p={p} />
      ))}
    </ul>
  );
}