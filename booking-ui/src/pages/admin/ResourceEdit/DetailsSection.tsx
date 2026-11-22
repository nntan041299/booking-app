import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Dropdown from "@/components/Dropdown";
import Field from "@/components/Field";
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

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

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
  const [imageUrl, setImageUrl] = useState(saved.imageUrl);
  const [formError, setFormError] = useState("");
  // A newly picked file is previewed here and sent with the rest of the form on save.
  const [picked, setPicked] = useState<{
    name: string;
    previewUrl: string;
    file: File;
  } | null>(null);
  const [fileError, setFileError] = useState("");

  // Release the preview's object URL when it is replaced or the section unmounts.
  useEffect(
    () => () => {
      if (picked) URL.revokeObjectURL(picked.previewUrl);
    },
    [picked],
  );

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
            { ...payload, removeImage: removeImage || undefined },
            picked?.file,
          )
        : createResource(payload, picked?.file);
    },
    onSuccess: (result) => {
      if (isEdit) {
        setName(name.trim());
        setDescription(description.trim());
        // With a new image the backend decides the final URL.
        setImageUrl(result.imageUrl ?? "");
        setPicked(null);
        onSaved(result);
      } else {
        onCreated(result);
      }
    },
  });

  // The saved image was cleared and no replacement was picked.
  const removeImage = Boolean(saved.imageUrl) && !imageUrl && !picked;

  const dirty = isEdit
    ? name !== saved.name ||
      type !== saved.type ||
      description !== saved.description ||
      picked !== null ||
      removeImage
    : Boolean(name || description || picked || type !== saved.type);

  const touch = () => {
    setFormError("");
    if (isError) reset();
  };

  const discard = () => {
    setName(saved.name);
    setType(saved.type);
    setDescription(saved.description);
    setImageUrl(saved.imageUrl);
    setPicked(null);
    setFileError("");
    touch();
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      return setFileError("Use a PNG, JPG or WebP image.");
    }
    if (file.size > IMAGE_MAX_BYTES) {
      return setFileError("The image must be 5 MB or smaller.");
    }
    setFileError("");
    setPicked({
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      file,
    });
  };

  const removeFile = () => {
    setPicked(null);
    setImageUrl("");
    setFileError("");
    touch();
  };

  const handleSave = () => {
    if (!name.trim()) return setFormError("Name is required");
    if (name.trim().length > 100)
      return setFormError("Name must not exceed 100 characters");
    setFormError("");
    save();
  };

  const previewUrl = picked?.previewUrl ?? imageUrl.trim();
  const hasImage = Boolean(picked || imageUrl.trim());
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <Section
      id="h-details"
      title="Details"
      description="Image, name, type and description."
      badge={saved.name || undefined}
      defaultOpen
    >
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col items-center gap-2.5 w-30">
          <div className="relative w-24 h-24">
            <label
              htmlFor="resource-image"
              className={`relative flex items-center justify-center w-24 h-24 overflow-hidden rounded-full bg-spa-green-50 text-spa-green-800 text-3xl font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-spa-green ${
                isPending ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
            >
              <span className="sr-only">
                Resource image. Click to upload or replace.
              </span>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span aria-hidden="true">{initials}</span>
              )}
              <input
                id="resource-image"
                type="file"
                accept={IMAGE_TYPES.join(",")}
                className="sr-only"
                onChange={pickFile}
                disabled={isPending}
              />
            </label>
            {hasImage && (
              <button
                type="button"
                aria-label="Remove image"
                disabled={isPending}
                onClick={removeFile}
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
        error={
          formError ||
          fileError ||
          (isError ? getErrorMessage(error) : undefined)
        }
        saveLabel={isEdit ? "Save details" : "Create resource"}
        onDiscard={discard}
        onSave={handleSave}
      />
    </Section>
  );
}
