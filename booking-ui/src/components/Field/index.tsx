interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  /** Small helper text under the control. */
  hint?: string;
  children: React.ReactNode;
}

export default function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-spa-ink"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p
          className="text-[13px] text-spa-muted"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {hint}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="text-[13px] font-medium text-spa-danger"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
