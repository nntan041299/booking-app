export const INPUT_CLASS = `
  w-full min-h-11 box-border px-3.5 py-2.5 rounded-[10px] border border-spa-border-strong text-[15px] text-spa-ink
  bg-white placeholder:text-spa-muted
  focus:outline-2 focus:outline-offset-2 focus:outline-spa-green
  disabled:bg-spa-canvas disabled:text-spa-muted
  transition-colors duration-150
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
