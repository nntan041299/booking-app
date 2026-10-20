type Variant = "primary" | "secondary";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-ink-900 text-parchment hover:bg-ink-800",
  secondary:
    "border border-surface-200 text-surface-700 bg-white hover:bg-surface-50",
};

export default function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`
        px-5 py-2.5 rounded-xl text-sm font-semibold
        transition-colors duration-150 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${VARIANT_CLASS[variant]} ${className}
      `}
      style={{ fontFamily: "var(--font-sans)" }}
    />
  );
}
