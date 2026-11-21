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
  // UI only for now: the picked file is previewed in the browser but not uploaded or saved.
  const [picked, setPicked] = useState<{
    name: string;
    previewUrl: string;
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
        imageUrl: imageUrl.trim() || undefined,
      };
      return isEdit
        ? updateResource(resource.id, payload)
        : createResource(payload);
    },
    onSuccess: (result) => {
      if (isEdit) {
        setName(name.trim());
        setDescription(description.trim());
        setImageUrl(imageUrl.trim());
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
      imageUrl !== saved.imageUrl
    : Boolean(name || description || imageUrl || type !== saved.type);

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
    setPicked({ name: file.name, previewUrl: URL.createObjectURL(file) });
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
    if (imageUrl.trim().length > 255)
      return setFormError("Image URL must not exceed 255 characters");
    setFormError("");
    save();
  };

  const previewUrl = picked?.previewUrl ?? imageUrl.trim();
  const hasImage = Boolean(picked || imageUrl.trim());
  const fileName = picked?.name ?? (imageUrl.split("/").pop() || "");

  return (
    <Section
      id="h-details"
      title="Details"
      description="Image, name, type and description."
      badge={saved.name || undefined}
      defaultOpen
    >
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">Resource image</div>
        <div className="flex flex-wrap items-stretch gap-5">
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

          <div className="flex-1 basis-75 min-w-0 min-h-30 flex flex-col justify-center gap-2">
            {!hasImage ? (
              <label
                htmlFor="image-upload"
                className="relative flex flex-col items-center justify-center gap-1.5 flex-1 min-h-30 p-4 box-border text-center cursor-pointer
                           border-[1.5px] border-dashed border-spa-dashed rounded-xl bg-[#F8FAF9] text-spa-green-800
                           hover:bg-spa-green-50 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-spa-green"
              >
                <svg
                  aria-hidden="true"
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                </svg>
                <span className="text-[15px] font-semibold">Upload image</span>
                <span className="text-[13px] text-spa-muted">
                  PNG, JPG or WebP, up to 5 MB. Landscape photo, at least 800 px
                  wide.
                </span>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={pickFile}
                  disabled={isPending}
                  className="absolute w-px h-px opacity-0 overflow-hidden"
                />
              </label>
            ) : (
              <div className="flex flex-wrap items-center gap-3 px-3.5 py-3 border border-spa-line rounded-xl bg-white">
                <span
                  className="flex-1 basis-40 min-w-0 text-sm font-semibold truncate"
                  title={fileName}
                >
                  {fileName}
                </span>
                <label
                  htmlFor="image-replace"
                  className="relative inline-flex items-center min-h-11 px-4 box-border rounded-[10px] border border-spa-border-strong text-sm font-medium cursor-pointer
                             hover:bg-spa-canvas focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-spa-green"
                >
                  Replace
                  <input
                    id="image-replace"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={pickFile}
                    disabled={isPending}
                    className="absolute w-px h-px opacity-0 overflow-hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={isPending}
                  className="min-h-11 px-4 rounded-[10px] border border-spa-danger-line bg-white text-spa-danger text-sm font-medium cursor-pointer hover:bg-red-50
                             focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>
            )}
            {fileError && (
              <p
                role="alert"
                className="m-0 text-[13px] font-medium text-spa-danger"
              >
                {fileError}
              </p>
            )}
          </div>
        </div>
      </div>

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
