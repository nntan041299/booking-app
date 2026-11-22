import { useEffect, useMemo, useState } from "react";

/**
 * State for an image that is edited together with a form: the saved URL, a newly
 * picked file (previewed locally, sent on save) and whether the saved image was
 * cleared. Pair it with <ImageUpload />.
 *
 * @param savedUrl the image URL currently saved on the record ("" when none)
 */
export function useImageField(savedUrl: string) {
  const [url, setUrl] = useState(savedUrl);
  const [file, setFile] = useState<File | null>(null);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  return {
    /** The picked file to send with the form, if any. */
    file,
    /** What to show: the picked file's preview, else the saved image. */
    src: previewUrl ?? (url || null),
    /** The saved image was cleared and no replacement was picked. */
    removed: Boolean(savedUrl) && !url && !file,
    /** The image differs from what is saved. */
    dirty: file !== null || url !== savedUrl,
    pick: (picked: File) => setFile(picked),
    clear: () => {
      setFile(null);
      setUrl("");
    },
    /** Back to the saved image (Discard). */
    reset: () => {
      setFile(null);
      setUrl(savedUrl);
    },
    /** After a successful save: show the URL the backend stored. */
    commit: (newUrl: string) => {
      setFile(null);
      setUrl(newUrl);
    },
  };
}
