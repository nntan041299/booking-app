import { useState } from "react";
import Field from "@/components/Field";
import Input from "@/components/Input";

interface PasswordFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  error?: string;
  hint?: string;
}

/** A labelled password input with a Show / Hide toggle. */
export default function PasswordField({
  id,
  label,
  error,
  hint,
  className = "",
  ...props
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <div className="relative">
        <Input
          {...props}
          id={id}
          type={show ? "text" : "password"}
          aria-invalid={Boolean(error)}
          className={`h-12 pr-16 ${error ? "border-spa-danger" : ""} ${className}`}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute top-0 right-0 h-12 min-w-14 px-3.5 border-0 bg-transparent text-spa-green hover:text-spa-green-800 text-sm font-semibold cursor-pointer rounded-r-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </Field>
  );
}
