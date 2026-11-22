import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Field from "@/components/Field";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import { Section, SectionFooter } from "@/components/Section";
import {
  createService,
  updateService,
  type ServiceItem,
} from "@/service/catalog";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES } from "@/service/media";
import { getErrorMessage } from "@/rest";

export type DetailsPatch = Pick<
  ServiceItem,
  "name" | "description" | "durationMinutes" | "price" | "imageUrl"
>;

interface DetailsSectionProps {
  /** The service being edited, or null to create a new one. */
  service: ServiceItem | null;
  onSaved: (patch: DetailsPatch) => void;
  onCreated: (created: ServiceItem | undefined) => void;
}

export default function DetailsSection({
  service,
  onSaved,
  onCreated,
}: DetailsSectionProps) {
  const isEdit = service !== null;
  const saved = {
    name: service?.name ?? "",
    description: service?.description ?? "",
    duration: service ? String(service.durationMinutes) : "",
    price: service ? String(service.price) : "",
    imageUrl: service?.imageUrl ?? "",
  };

  const [name, setName] = useState(saved.name);
  const [description, setDescription] = useState(saved.description);
  const [duration, setDuration] = useState(saved.duration);
  const [price, setPrice] = useState(saved.price);
  const [formError, setFormError] = useState("");

  // A newly picked image is only sent with the rest of the form on save.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(saved.imageUrl);
  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  // The saved image was cleared and no replacement was picked.
  const removeImage = Boolean(saved.imageUrl) && !imageUrl && !imageFile;
  const shownUrl = previewUrl ?? (imageUrl || null);
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const payload = () => ({
    name: name.trim(),
    description: description.trim() || undefined,
    durationMinutes: Number(duration),
    price: Number(price),
  });

  const {
    mutate: save,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        // A full update: keep whatever active state the service has now.
        const res = await updateService(
          service.id,
          {
            ...payload(),
            removeImage: removeImage || undefined,
            active: service.active,
          },
          imageFile,
        );
        return res.data?.data as ServiceItem | undefined;
      }
      const res = await createService(payload(), imageFile);
      return res.data?.data as ServiceItem | undefined;
    },
    onSuccess: (result) => {
      if (isEdit) {
        const p = payload();
        // With a new image the backend decides the final URL.
        const savedImageUrl = result?.imageUrl ?? "";
        setName(p.name);
        setDescription(p.description ?? "");
        setImageUrl(savedImageUrl);
        setImageFile(null);
        onSaved({
          name: p.name,
          description: p.description,
          durationMinutes: p.durationMinutes,
          price: p.price,
          imageUrl: savedImageUrl || undefined,
        });
      } else {
        onCreated(result);
      }
    },
  });

  const dirty = isEdit
    ? name !== saved.name ||
      description !== saved.description ||
      duration !== saved.duration ||
      price !== saved.price ||
      imageFile !== null ||
      removeImage
    : Boolean(name || description || duration || price || imageFile);

  const touch = () => {
    setFormError("");
    if (isError) reset();
  };

  const discard = () => {
    setName(saved.name);
    setDescription(saved.description);
    setDuration(saved.duration);
    setPrice(saved.price);
    setImageUrl(saved.imageUrl);
    setImageFile(null);
    touch();
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    if (!IMAGE_ACCEPT.split(",").includes(file.type))
      return setFormError("Upload a PNG, JPG or WebP image");
    if (file.size > MAX_IMAGE_BYTES)
      return setFormError("Image must not exceed 5 MB");
    touch();
    setImageFile(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImageUrl("");
    touch();
  };

  const handleSave = () => {
    if (!name.trim()) return setFormError("Name is required");
    if (name.trim().length > 100)
      return setFormError("Name must not exceed 100 characters");
    const minutes = Number(duration);
    if (!duration) return setFormError("Duration is required");
    if (!Number.isInteger(minutes) || minutes < 1)
      return setFormError("Duration must be a whole number above 0");
    if (!price) return setFormError("Price is required");
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(price))
      return setFormError(
        "Price must be a non-negative number, up to 8 digits and 2 decimals",
      );
    setFormError("");
    save();
  };

  return (
    <Section
      id="h-details"
      title="Details"
      description="Image, name, description, duration and price."
      badge={saved.name || undefined}
      defaultOpen
    >
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col items-center gap-2.5 w-30">
          <div className="relative w-24 h-24">
            <label
              htmlFor="service-image"
              className={`relative flex items-center justify-center w-24 h-24 overflow-hidden rounded-full bg-spa-green-50 text-spa-green-800 text-3xl font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-spa-green ${
                isPending ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
            >
              <span className="sr-only">
                Service image. Click to upload or replace.
              </span>
              {shownUrl ? (
                <img
                  src={shownUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span aria-hidden="true">{initials}</span>
              )}
              <input
                id="service-image"
                type="file"
                accept={IMAGE_ACCEPT}
                className="sr-only"
                onChange={pickFile}
                disabled={isPending}
              />
            </label>
            {shownUrl && (
              <button
                type="button"
                aria-label="Remove image"
                disabled={isPending}
                onClick={clearImage}
                className="absolute -top-2 -right-2 w-11 h-11 p-0 border-0 bg-transparent flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green rounded-full"
              >
                <span
                  aria-hidden="true"
                  className="w-7 h-7 rounded-full bg-spa-ink text-white flex items-center justify-center border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 basis-90 min-w-0 flex flex-col gap-[18px]">
          <Field label="Name" htmlFor="name">
            <Input
              id="name"
              value={name}
              placeholder="e.g. Swedish Massage"
              onChange={(e) => {
                setName(e.target.value);
                touch();
              }}
              disabled={isPending}
            />
          </Field>
          <Field
            label="Description"
            htmlFor="description"
            hint="Shown to guests when they choose a service."
          >
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                touch();
              }}
              disabled={isPending}
              className="resize-y"
            />
          </Field>

          <div className="flex flex-wrap gap-5">
            <div className="flex-1 basis-50">
              <Field
                label="Duration (minutes)"
                htmlFor="duration"
                hint="Blocks this much time in the calendar."
              >
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  step="5"
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                    touch();
                  }}
                  disabled={isPending}
                />
              </Field>
            </div>
            <div className="flex-1 basis-50">
              <Field label="Price ($)" htmlFor="price">
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    touch();
                  }}
                  disabled={isPending}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <SectionFooter
        dirty={dirty}
        saving={isPending}
        error={formError || (isError ? getErrorMessage(error) : undefined)}
        saveLabel={isEdit ? "Save details" : "Create service"}
        onDiscard={discard}
        onSave={handleSave}
      />
    </Section>
  );
}
