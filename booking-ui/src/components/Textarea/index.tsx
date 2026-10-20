import { INPUT_CLASS } from "@/components/Input";

export default function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${INPUT_CLASS} ${className}`}
      style={{ fontFamily: "var(--font-sans)" }}
    />
  );
}
