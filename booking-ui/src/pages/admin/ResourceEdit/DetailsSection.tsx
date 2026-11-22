import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Dropdown from "@/components/Dropdown";
import Field from "@/components/Field";
import ImageUpload from "@/components/ImageUpload";
import { useImageField } from "@/components/ImageUpload/useImageField";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import { Section, SectionFooter } from "@/components/Section";
import {
  createResource,
  updateResource,
  type ResourceItem,
  type ResourceType,
} from "@/service/resource";
import { getErrorMessage } from "@/rest";

const TYPE_OPTIONS = [
  { value: "ROOM", label: "Room" },
  { value: "EQUIPMENT", label: "Equipment" },
];

interface DetailsSectionProps {
  /** The resource being edited, or null to create a new one. */
  resource: ResourceItem | null;
  /** Called with the saved resource after an update. */
  onSaved: (updated: ResourceItem) => void;
  /** Called with the new resource after a create. */
  onCreated: (created: ResourceItem) => void;
}

export default function DetailsSection({
  resource,
  onSaved,
  onCreated,
}: DetailsSectionProps) {
  const isEdit = resource !== null;
  const saved = {
    name: resource?.name ?? "",
    type: resource?.type ?? ("ROOM" as ResourceType),
    description: resource?.description ?? "",
    imageUrl: resource?.imageUrl ?? "",
  };

  const [name, setName] = useState(saved.name);
  const [type, setType] = useState<ResourceType>(saved.type);
  const [description, setDescription] = useState(saved.description);
  const [formError, setFormError] = useState("");
  // A newly picked image is only sent with the rest of the form on save.
  const image = useImageField(saved.imageUrl);

  const {
    mutate: save,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    // Services and active state are left out, so the backend keeps them as is.
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        type,
        description: description.trim() || undefined,
      };
      return isEdit
        ? updateResource(
            resource.id,
            { ...payload, removeImage: image.removed || undefined },
            image.file,
          )
        : createResource(payload, image.file);
    },
    onSuccess: (result) => {
      if (isEdit) {
        setName(name.trim());
        setDescription(description.trim());
        // With a new image the backend decides the final URL.
        image.commit(result.imageUrl ?? "");
        onSaved(result);
      } else {
        onCreated(result);
      }
    },
  });

  const dirty = isEdit
    ? name !== saved.name ||
      type !== saved.type ||
      description !== saved.description ||
      image.dirty
    : Boolean(name || description || image.dirty || type !== saved.type);

  const touch = () => {
    setFormError("");
    if (isError) reset();
  };

  const discard = () => {
    setName(saved.name);
    setType(saved.type);
    setDescription(saved.description);
    image.reset();
    touch();
  };

  const handleSave = () => {
    if (!name.trim()) return setFormError("Name is required");
    if (name.trim().length > 100)
      return setFormError("Name must not exceed 100 characters");
    setFormError("");
    save();
  };

  return (
    <Section
      id="h-details"
      title="Details"
      description="Image, name, type and description."
      badge={saved.name || undefined}
      defaultOpen
    >
      <div className="flex flex-wrap gap-6">
        <ImageUpload
          id="resource-image"
          label="Resource image"
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
            hint="Shown to guests when they choose a resource."
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
            <div className="flex-[1_1_200px] min-w-0 flex flex-col gap-1.5">
              <span id="type-label" className="text-sm font-medium">
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
        </div>
      </div>

      <SectionFooter
        dirty={dirty}
        saving={isPending}
        error={formError || (isError ? getErrorMessage(error) : undefined)}
        saveLabel={isEdit ? "Save details" : "Create resource"}
        onDiscard={discard}
        onSave={handleSave}
      />
    </Section>
  );
}
