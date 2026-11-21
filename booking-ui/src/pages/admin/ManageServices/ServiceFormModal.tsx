import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Button from "@/components/Button";
import Field from "@/components/Field";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import Textarea from "@/components/Textarea";
import {
  createService,
  updateService,
  type ServiceItem,
} from "@/service/catalog";
import { getErrorMessage } from "@/rest";

interface FormState {
  name: string;
  description: string;
  durationMinutes: string;
  price: string;
  active: boolean;
}

interface ServiceFormModalProps {
  /** The service being edited, or null to create a new one. */
  service: ServiceItem | null;
  onClose: () => void;
  onSaved: () => void;
}

const toFormState = (service: ServiceItem | null): FormState => ({
  name: service?.name ?? "",
  description: service?.description ?? "",
  durationMinutes: service ? String(service.durationMinutes) : "",
  price: service ? String(service.price) : "",
  active: service?.active ?? true,
});

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function ServiceFormModal({
  service,
  onClose,
  onSaved,
}: ServiceFormModalProps) {
  const isEdit = service !== null;
  const [form, setForm] = useState<FormState>(() => toFormState(service));
  const [errors, setErrors] = useState<FormErrors>({});

  const {
    mutate: save,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: (payload: {
      name: string;
      description?: string;
      durationMinutes: number;
      price: number;
    }) =>
      isEdit
        ? updateService(service.id, { ...payload, active: form.active })
        : createService(payload),
    onSuccess: onSaved,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (isError) reset();
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Name is required";
    else if (form.name.trim().length > 100)
      next.name = "Name must not exceed 100 characters";

    const duration = Number(form.durationMinutes);
    if (!form.durationMinutes) next.durationMinutes = "Duration is required";
    else if (!Number.isInteger(duration) || duration < 1)
      next.durationMinutes = "Duration must be a whole number above 0";

    if (!form.price) next.price = "Price is required";
    else if (!/^\d{1,8}(\.\d{1,2})?$/.test(form.price))
      next.price = "Use a non-negative number, up to 8 digits and 2 decimals";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    save({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      durationMinutes: Number(form.durationMinutes),
      price: Number(form.price),
    });
  };

  return (
    <Modal title={isEdit ? "Edit service" : "Add service"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" htmlFor="name" error={errors.name}>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={isPending}
            placeholder="e.g. Haircut"
          />
        </Field>

        <Field label="Description (optional)" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            disabled={isPending}
            rows={3}
            placeholder="What does this service include?"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Duration (minutes)"
            htmlFor="durationMinutes"
            error={errors.durationMinutes}
          >
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min={1}
              step={1}
              value={form.durationMinutes}
              onChange={handleChange}
              disabled={isPending}
              placeholder="30"
            />
          </Field>

          <Field label="Price" htmlFor="price" error={errors.price}>
            <Input
              id="price"
              name="price"
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={handleChange}
              disabled={isPending}
              placeholder="25.00"
            />
          </Field>
        </div>

        {isEdit && (
          <label
            className="flex items-center gap-2 text-sm text-surface-700 cursor-pointer"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <input
              type="checkbox"
              checked={form.active}
              disabled={isPending}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, active: e.target.checked }))
              }
            />
            Active (visible to customers)
          </label>
        )}

        {isError && (
          <p
            className="text-sm text-red-500"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {getErrorMessage(error)}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save changes" : "Add service"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
