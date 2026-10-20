import { useState } from "react";
import Input from "@/components/Input";

export default function PasswordInput(
  props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-10" />
      <button
        type="button"
        onClick={() => setShow((p) => !p)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
        tabIndex={-1}
      >
        <i className={`pi ${show ? "pi-eye-slash" : "pi-eye"} text-sm`} />
      </button>
    </div>
  );
}
