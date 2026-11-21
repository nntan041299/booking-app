type Variant = "primary" | "secondary";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-spa-green text-white hover:bg-spa-green-800",
  secondary:
    "border border-spa-border-strong text-spa-ink bg-white hover:bg-spa-canvas",
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
        inline-flex items-center justify-center min-h-11 px-5 rounded-[10px] text-[15px] font-semibold
        transition-colors duration-150 cursor-pointer
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
        disabled:opacity-40 disabled:cursor-not-allowed
        ${VARIANT_CLASS[variant]} ${className}
      `}
      style={{ fontFamily: "var(--font-sans)" }}
    />
  );
}
