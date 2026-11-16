// Label + input wrapper that shows the inline error message under the input.

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Field({ label, error, hint, htmlFor, children }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
      {error && (
        <div className="field-error" role="alert">
          ⚠ {capitalize(error)}
        </div>
      )}
    </div>
  );
}
