import { useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import Layout from "@/layouts/Layout";
import Button from "@/components/Button";
import Field from "@/components/Field";
import Input from "@/components/Input";
import Loading from "@/components/Loading";
import SectionCard from "@/components/SectionCard";
import Textarea from "@/components/Textarea";
import { selectUser } from "@/redux/user/selectors";
import { createService } from "@/service/catalog";
import { getErrorMessage } from "@/rest";

interface FormState {
  name: string;
  description: string;
  durationMinutes: string;
  price: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  durationMinutes: "",
  price: "",
};

const CreateService = () => {
  const navigate = useNavigate();
  const { id, role } = useSelector(selectUser);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [success, setSuccess] = useState("");

  const {
    mutate: create,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setSuccess("Service created.");
    },
  });

  // The user is fetched by Layout; wait for it before deciding access.
  if (id && role !== "ADMIN") return <Navigate to="/" replace />;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSuccess("");
    if (isError) reset();
  };

  const validate = (): boolean => {
    const next: Partial<FormState> = {};
    if (!form.name.trim()) next.name = "Name is required";
    else if (form.name.trim().length > 100)
      next.name = "Name must not exceed 100 characters";

    const duration = Number(form.durationMinutes);
    if (!form.durationMinutes) next.durationMinutes = "Duration is required";
    else if (!Number.isInteger(duration) || duration < 1)
      next.durationMinutes = "Duration must be a whole number above 0";

    const price = Number(form.price);
    if (!form.price) next.price = "Price is required";
    else if (Number.isNaN(price) || price < 0)
      next.price = "Price must not be negative";
    else if (!/^\d{1,8}(\.\d{1,2})?$/.test(form.price))
      next.price = "Up to 8 digits and 2 decimals";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    create({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      durationMinutes: Number(form.durationMinutes),
      price: Number(form.price),
    });
  };

  return (
    <Layout>
      <Loading isLoading={isPending} />
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div>
          <h1
            className="text-2xl font-bold text-surface-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Create service
          </h1>
          <p
            className="text-sm text-surface-500 mt-1"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Add a new service customers can book.
          </p>
        </div>

        <SectionCard>
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

            {isError && (
              <p
                className="text-sm text-red-500"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {getErrorMessage(error)}
              </p>
            )}
            {success && (
              <p
                className="text-sm text-sage-600"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {success}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="secondary"
                onClick={() => navigate("/")}
                disabled={isPending}
              >
                Back
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating…" : "Create service"}
              </Button>
            </div>
          </form>
        </SectionCard>
      </div>
    </Layout>
  );
};

export default CreateService;
