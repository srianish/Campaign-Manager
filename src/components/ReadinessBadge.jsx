// Green "Ready" or red "N issues" indicator, used on every row and in the editor header.

export default function ReadinessBadge({ count, archived }) {
  if (archived) return null;
  if (count === 0) return <span className="badge badge-ok">✓ Ready</span>;
  return (
    <span className="badge badge-bad">
      {count} issue{count === 1 ? '' : 's'}
    </span>
  );
}
