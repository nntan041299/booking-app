import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Dropdown from "@/components/Dropdown";
import Field from "@/components/Field";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import { searchAdminServices } from "@/service/catalog";
import {
  createResource,
  updateResource,
  type ResourceItem,
  type ResourceType,
} from "@/service/resource";
import { getErrorMessage } from "@/rest";

const LIST_PATH = "/admin/resources";

const TYPE_OPTIONS = [
  { value: "ROOM", label: "Room" },
  { value: "EQUIPMENT", label: "Equipment" },
];

const card =
  "bg-white border border-spa-line rounded-[14px] p-7 flex flex-col gap-5";

interface ResourceFormProps {
  /** The resource being edited, or null to create a new one. */
  resource: ResourceItem | null;
}

export default function ResourceForm({ resource }: ResourceFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = resource !== null;

  const [name, setName] = useState(resource?.name ?? "");
  const [type, setType] = useState<ResourceType>(resource?.type ?? "ROOM");
  const [description, setDescription] = useState(resource?.description ?? "");
  const [imageUrl, setImageUrl] = useState(resource?.imageUrl ?? "");
  const [serviceIds, setServiceIds] = useState<number[]>(
    resource?.serviceIds ?? [],
  );
  const [formError, setFormError] = useState("");

  // Active services that can be linked (backend caps page size at 100).
  const {
    data: servicePage,
    isLoading: servicesLoading,
    isError: servicesError,
  } = useQuery({
    queryKey: ["admin-services", "assignable"],
    queryFn: () => searchAdminServices({ active: true, size: 100 }),
  });
  const services = servicePage?.content ?? [];
  const selected = new Set(serviceIds);
  const linkedButInactive = serviceIds.filter(
    (id) => !services.some((s) => s.id === id),
  ).length;

  const {
    mutate: save,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        serviceIds,
      };
      return isEdit
        ? updateResource(resource.id, payload)
        : createResource(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
      navigate(LIST_PATH);
    },
  });

  const touch = () => {
    setFormError("");
    if (isError) reset();
  };

  const toggleService = (id: number) => {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    touch();
  };

  const handleSave = () => {
    if (!name.trim()) return setFormError("Name is required");
    if (name.trim().length > 100)
      return setFormError("Name must not exceed 100 characters");
    if (imageUrl.trim().length > 255)
      return setFormError("Image URL must not exceed 255 characters");
    setFormError("");
    save();
  };

  const previewUrl = imageUrl.trim();

  return (
    <>
      <section aria-labelledby="h-details" className={card}>
        <h2 id="h-details" className="m-0 text-lg font-semibold">
          Details
        </h2>

        <div className="flex flex-wrap items-start gap-5">
          <div
            role="img"
            aria-label="Resource image preview"
            className="w-40 h-30 rounded-xl flex-none overflow-hidden bg-spa-green-50 text-spa-green-800 flex flex-col items-center justify-center gap-1.5 text-[12.5px] font-medium"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <svg
                  aria-hidden="true"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-5 9 5-9 5-9-5z" />
                  <path d="M3 14l9 5 9-5" />
                </svg>
                Image preview
              </>
            )}
          </div>
          <div className="flex-1 basis-70 min-w-0">
            <Field
              label="Image URL"
              htmlFor="imageUrl"
              hint="Shown in the admin list and on the booking page. Use a landscape photo, at least 800 px wide."
            >
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  touch();
                }}
                disabled={isPending}
              />
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap gap-5">
          <div className="flex-[2_1_280px] min-w-0">
            <Field label="Name" htmlFor="name">
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  touch();
                }}
                disabled={isPending}
              />
            </Field>
          </div>
          <div className="flex-[1_1_180px] min-w-0 flex flex-col gap-1.5">
            <span
              id="type-label"
              className="text-[13px] font-medium text-spa-text"
            >
              Type
            </span>
            <Dropdown
              id="type"
              labelId="type-label"
              value={type}
              options={TYPE_OPTIONS}
              onChange={(v) => {
                setType(v as ResourceType);
                touch();
              }}
              disabled={isPending}
            />
          </div>
        </div>

        <Field label="Description" htmlFor="description">
          <Textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              touch();
            }}
            disabled={isPending}
            className="resize-y"
          />
        </Field>
      </section>

      <section aria-labelledby="h-svc" className={`${card} !gap-4`}>
        <div>
          <h2 id="h-svc" className="m-0 text-lg font-semibold">
            Used with services
          </h2>
          <p className="mt-1 text-sm text-spa-muted">
            Pick every service that can use this resource.{" "}
            <span className="font-semibold text-spa-ink">
              {serviceIds.length} selected
            </span>
          </p>
        </div>

        {servicesLoading ? (
          <p className="m-0 text-sm text-spa-muted">Loading services…</p>
        ) : servicesError ? (
          <p className="m-0 text-sm text-spa-danger">
            Could not load services.
          </p>
        ) : services.length === 0 ? (
          <p className="m-0 text-sm text-spa-muted">
            No active services. Add one first.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {services.map((s) => {
              const on = selected.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  disabled={isPending}
                  onClick={() => toggleService(s.id)}
                  className={`min-h-11 px-4 rounded-full border-[1.5px] text-sm cursor-pointer inline-flex items-center gap-2
                              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
                              disabled:opacity-50 disabled:cursor-not-allowed
                              ${
                                on
                                  ? "border-spa-green bg-spa-green-50 text-spa-green-800 font-semibold"
                                  : "border-spa-border-strong bg-white text-spa-text font-medium"
                              }`}
                >
                  {on && (
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                  {s.name}
                </button>
              );
            })}
          </div>
        )}
        {linkedButInactive > 0 && (
          <p className="m-0 text-[13px] text-spa-muted">
            Also linked: {linkedButInactive} inactive service(s), kept as is.
          </p>
        )}
      </section>

      {(formError || isError) && (
        <p role="alert" className="m-0 text-sm font-medium text-spa-danger">
          {formError || getErrorMessage(error)}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <Link
            to={LIST_PATH}
            className="inline-flex items-center min-h-11 px-5 rounded-[10px] border border-spa-border-strong bg-white text-spa-ink font-medium no-underline hover:bg-spa-canvas
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
          >
            Cancel
          </Link>
          <Button onClick={handleSave} disabled={isPending} className="!px-6">
            {isPending ? "Saving…" : "Save resource"}
          </Button>
        </div>
      </div>
    </>
  );
}
