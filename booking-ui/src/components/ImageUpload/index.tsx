import { FaCamera } from "react-icons/fa";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES } from "@/service/media";

interface ImageUploadProps {
  id: string;
  /** What the image is, for screen readers, e.g. "Service image". */
  label: string;
  /** Shown in the circle until an image is set (its initials). */
  name: string;
  /** The image to show, or null for none. */
  src: string | null;
  disabled?: boolean;
  /** Show a camera icon over the image on hover and focus. */
  hoverIcon?: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
  /** Called when the picked file is not an accepted image. */
  onError: (message: string) => void;
}

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

/** A round image you click to upload or replace, with a badge to remove it. */
export default function ImageUpload({
  id,
  label,
  name,
  src,
  disabled = false,
  hoverIcon = false,
  onPick,
  onRemove,
  onError,
}: ImageUploadProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    if (!IMAGE_ACCEPT.split(",").includes(file.type))
      return onError("Upload a PNG, JPG or WebP image");
    if (file.size > MAX_IMAGE_BYTES)
      return onError("Image must not exceed 5 MB");
    onPick(file);
  };

  return (
    <div className="flex flex-col items-center gap-2.5 w-30">
      <div className="relative w-24 h-24">
        <label
          htmlFor={id}
          className={`group relative flex items-center justify-center w-24 h-24 overflow-hidden rounded-full bg-spa-green-50 text-spa-green-800 text-3xl font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-spa-green ${
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
        >
          <span className="sr-only">{label}. Click to upload or replace.</span>
          {src ? (
            <img src={src} alt="" className="w-full h-full object-cover" />
          ) : (
            <span aria-hidden="true">{getInitials(name)}</span>
          )}
          {hoverIcon && !disabled && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
              <FaCamera aria-hidden="true" className="text-xl" />
            </span>
          )}
          <input
            id={id}
            type="file"
            accept={IMAGE_ACCEPT}
            className="sr-only"
            onChange={handleChange}
            disabled={disabled}
          />
        </label>
        {src && (
          <button
            type="button"
            aria-label="Remove image"
            disabled={disabled}
            onClick={onRemove}
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
  );
}
