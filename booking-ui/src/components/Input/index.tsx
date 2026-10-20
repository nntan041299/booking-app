export const INPUT_CLASS = `
  w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-900
  bg-white placeholder:text-surface-400
  focus:outline-none focus:ring-2 focus:ring-ink-900/20 focus:border-ink-900/40
  disabled:bg-surface-50 disabled:text-surface-400
  transition-all duration-150
`;

export default function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`${INPUT_CLASS} ${className}`}
      style={{ fontFamily: "var(--font-sans)" }}
    />
  );
}
