import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Field from "@/components/Field";
import ImageUpload from "@/components/ImageUpload";
import { useImageField } from "@/components/ImageUpload/useImageField";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import { Section, SectionFooter } from "@/components/Section";
import {
  createService,
  updateService,
  type ServiceItem,
} from "@/service/catalog";
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
  const image = useImageField(saved.imageUrl);

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
            removeImage: image.removed || undefined,
            active: service.active,
          },
          image.file,
        );
        return res.data?.data as ServiceItem | undefined;
      }
      const res = await createService(payload(), image.file);
      return res.data?.data as ServiceItem | undefined;
    },
    onSuccess: (result) => {
      if (isEdit) {
        const p = payload();
        // With a new image the backend decides the final URL.
        const savedImageUrl = result?.imageUrl ?? "";
        setName(p.name);
        setDescription(p.description ?? "");
        image.commit(savedImageUrl);
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
      image.dirty
    : Boolean(name || description || duration || price || image.dirty);

  const touch = () => {
    setFormError("");
    if (isError) reset();
  };

  const discard = () => {
    setName(saved.name);
    setDescription(saved.description);
    setDuration(saved.duration);
    setPrice(saved.price);
    image.reset();
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
        <ImageUpload
          id="service-image"
          label="Service image"
          name={name}
          src={image.src}
          disabled={isPending}
          onPick={(file) => {
            touch();
            image.pick(file);
          }}
          onRemove={() => {
            touch();
            image.clear();
          }}
          onError={setFormError}
        />

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
