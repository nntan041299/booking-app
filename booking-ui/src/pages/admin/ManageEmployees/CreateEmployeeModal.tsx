import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Button from "@/components/Button";
import Field from "@/components/Field";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import PasswordInput from "@/components/PasswordInput";
import { createEmployee } from "@/service/employee";
import { getErrorMessage } from "@/rest";

interface FormState {
  fullName: string;
  username: string;
  email: string;
  password: string;
  avatarUrl: string;
}

const EMPTY_FORM: FormState = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  avatarUrl: "",
};

interface CreateEmployeeModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function CreateEmployeeModal({
  onClose,
  onSaved,
}: CreateEmployeeModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const {
    mutate: create,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({ mutationFn: createEmployee, onSuccess: onSaved });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (isError) reset();
  };

  const validate = (): boolean => {
    const next: Partial<FormState> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    else if (form.fullName.trim().length > 100)
      next.fullName = "Full name must not exceed 100 characters";

    const username = form.username.trim();
    if (!username) next.username = "Username is required";
    else if (username.length < 3 || username.length > 50)
      next.username = "Username must be between 3 and 50 characters";

    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = "Invalid email format";

    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 8)
      next.password = "Password must be at least 8 characters";

    if (form.avatarUrl.length > 255)
      next.avatarUrl = "Avatar URL must not exceed 255 characters";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    create({
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      avatarUrl: form.avatarUrl.trim() || undefined,
    });
  };

  return (
    <Modal title="Add employee" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
          <Input
            id="fullName"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            disabled={isPending}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Username" htmlFor="username" error={errors.username}>
            <Input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              disabled={isPending}
              autoComplete="off"
            />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={isPending}
              autoComplete="off"
            />
          </Field>
        </div>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            disabled={isPending}
            autoComplete="new-password"
          />
        </Field>
        <Field
          label="Avatar URL (optional)"
          htmlFor="avatarUrl"
          error={errors.avatarUrl}
        >
          <Input
            id="avatarUrl"
            name="avatarUrl"
            value={form.avatarUrl}
            onChange={handleChange}
            disabled={isPending}
          />
        </Field>

        {isError && (
          <p
            className="text-sm text-red-500"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {getErrorMessage(error)}
          </p>
        )}

        <p className="text-xs text-surface-500">
          After adding the employee, edit them to set services and working
          hours.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding…" : "Add employee"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
