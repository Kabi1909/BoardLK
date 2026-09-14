import { useId } from 'react';
export function FormInput({ label, error, hint, ...props }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {props.required && <span> *</span>}
      </label>
      <input
        id={id}
        {...props}
        aria-invalid={!!error}
        aria-describedby={error || hint ? id + '-help' : undefined}
      />
      {(error || hint) && (
        <small id={id + '-help'} className={error ? 'error' : ''}>
          {error || hint}
        </small>
      )}
    </div>
  );
}
export function FormSelect({
  label,
  error,
  options = [],
  placeholder = 'Select an option',
  ...props
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {props.required && ' *'}
      </label>
      <select
        id={id}
        {...props}
        aria-invalid={!!error}
        aria-describedby={error ? id + '-error' : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option
            key={typeof o === 'string' ? o : o.value}
            value={typeof o === 'string' ? o : o.value}
          >
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
      {error && (
        <small id={id + '-error'} className="error">
          {error}
        </small>
      )}
    </div>
  );
}
export function FormTextarea({ label, error, ...props }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {props.required && ' *'}
      </label>
      <textarea id={id} rows={4} {...props} aria-invalid={!!error} />
      {error && <small className="error">{error}</small>}
    </div>
  );
}
export function Checkbox({ label, ...props }) {
  return (
    <label className="checkbox">
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}
