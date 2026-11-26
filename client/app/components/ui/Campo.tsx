import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  id: string;
}

export default function Campo({ label, error, id, ...props }: Props) {
  return (
    <div className="campo">
      <label htmlFor={id} className="campo-label">
        {label}
      </label>
      <input id={id} className={`campo-input${error ? " campo-error" : ""}`} {...props} />
      {error && <span className="campo-msg-error" role="alert">{error}</span>}
    </div>
  );
}
