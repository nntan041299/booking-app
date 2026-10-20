interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}

export default function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-surface-700"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          className="text-xs text-red-500"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
