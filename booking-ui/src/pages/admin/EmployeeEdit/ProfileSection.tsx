import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FaCamera } from "react-icons/fa";
import Field from "@/components/Field";
import Input from "@/components/Input";
import PasswordInput from "@/components/PasswordInput";
import Textarea from "@/components/Textarea";
import {
  createEmployee,
  updateEmployee,
  type EmployeeItem,
} from "@/service/employee";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES } from "@/service/media";
import { getErrorMessage } from "@/rest";
import { Section, SectionFooter } from "@/components/Section";

export type ProfilePatch = Pick<EmployeeItem, "fullName" | "bio" | "avatarUrl">;

interface ProfileSectionProps {
  /** The employee being edited, or null to create a new one. */
  employee: EmployeeItem | null;
  onSaved: (patch: ProfilePatch) => void;
  onCreated: (created: EmployeeItem | undefined) => void;
}

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export default function ProfileSection({
  employee,
  onSaved,
  onCreated,
}: ProfileSectionProps) {
  const isEdit = employee !== null;
  const saved = {
    fullName: employee?.fullName ?? "",
    avatarUrl: employee?.avatarUrl ?? "",
    bio: employee?.bio ?? "",
  };

  const [fullName, setFullName] = useState(saved.fullName);
  const [avatarUrl, setAvatarUrl] = useState(saved.avatarUrl);
  const [bio, setBio] = useState(saved.bio);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  // A newly picked image is only sent with the rest of the form on save.
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const {
    mutate: save,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        const res = await updateEmployee(
          employee.id,
          {
            fullName: fullName.trim(),
            bio: bio.trim(),
            removeAvatar: removeAvatar || undefined,
          },
          avatarFile,
        );
        return res.data?.data as EmployeeItem | undefined;
      }
      const res = await createEmployee(
        {
          fullName: fullName.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
          bio: bio.trim() || undefined,
        },
        avatarFile,
      );
      return res.data?.data as EmployeeItem | undefined;
    },
    onSuccess: (result) => {
      if (isEdit) {
        // With a new image the backend decides the final URL.
        const savedAvatarUrl = result?.avatarUrl ?? "";
        setFullName(fullName.trim());
        setAvatarUrl(savedAvatarUrl);
        setAvatarFile(null);
        setBio(bio.trim());
        onSaved({
          fullName: fullName.trim(),
          bio: bio.trim(),
          avatarUrl: savedAvatarUrl,
        });
      } else {
        onCreated(result);
      }
    },
  });

  // The current photo was cleared and no replacement was picked.
  const removeAvatar = Boolean(saved.avatarUrl) && !avatarUrl && !avatarFile;

  const dirty = isEdit
    ? fullName !== saved.fullName ||
      avatarUrl !== saved.avatarUrl ||
      avatarFile !== null ||
      bio !== saved.bio
    : Boolean(fullName || avatarFile || bio || username || email || password);

  const touch = () => {
    setFormError("");
    if (isError) reset();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    if (!IMAGE_ACCEPT.split(",").includes(file.type))
      return setFormError("Upload a PNG, JPG or WebP image");
    if (file.size > MAX_IMAGE_BYTES)
      return setFormError("Image must not exceed 5 MB");
    touch();
    setAvatarFile(file);
  };

  const discard = () => {
    setFullName(saved.fullName);
    setAvatarUrl(saved.avatarUrl);
    setAvatarFile(null);
    setBio(saved.bio);
    setUsername("");
    setEmail("");
    setPassword("");
    touch();
  };

  const handleSave = () => {
    if (!fullName.trim()) return setFormError("Full name is required");
    if (fullName.trim().length > 100)
      return setFormError("Full name must not exceed 100 characters");
    if (!isEdit) {
      const name = username.trim();
      if (name.length < 3 || name.length > 50)
        return setFormError("Username must be between 3 and 50 characters");
      if (!EMAIL_PATTERN.test(email.trim()))
        return setFormError("Enter a valid email");
      if (password.length < 8)
        return setFormError("Password must be at least 8 characters");
    }
    setFormError("");
    save();
  };

  const initials =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <Section
      id="h-profile"
      title="Profile"
      description="Name, bio and avatar shown to guests."
      badge={saved.fullName || undefined}
      defaultOpen
    >
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col items-center gap-2.5 w-30">
          <div className="relative">
            <button
              type="button"
              aria-label="Change photo"
              title="Click to change photo"
              disabled={isPending}
              onClick={() => fileInput.current?.click()}
              className="group relative w-24 h-24 rounded-full overflow-hidden bg-spa-green-50 text-spa-green-800 flex items-center justify-center text-3xl font-semibold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green disabled:cursor-not-allowed disabled:opacity-60"
            >
              {previewUrl || avatarUrl.trim() ? (
                <img
                  src={previewUrl ?? avatarUrl.trim()}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                <FaCamera aria-hidden="true" className="text-xl" />
              </span>
            </button>
            {(avatarUrl || avatarFile) && (
              <button
                type="button"
                aria-label="Remove image"
                disabled={isPending}
                onClick={() => {
                  setAvatarUrl("");
                  setAvatarFile(null);
                  touch();
                }}
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
          <input
            ref={fileInput}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={handleFile}
          />
        </div>

        <div className="flex-1 basis-90 min-w-0 flex flex-col gap-[18px]">
          <Field label="Full name" htmlFor="fullName">
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                touch();
              }}
              disabled={isPending}
            />
          </Field>

          {!isEdit && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Username" htmlFor="username">
                  <Input
                    id="username"
                    value={username}
                    autoComplete="off"
                    onChange={(e) => {
                      setUsername(e.target.value);
                      touch();
                    }}
                    disabled={isPending}
                  />
                </Field>
                <Field label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    autoComplete="off"
                    onChange={(e) => {
                      setEmail(e.target.value);
                      touch();
                    }}
                    disabled={isPending}
                  />
                </Field>
              </div>
              <Field
                label="Password"
                htmlFor="password"
                hint="At least 8 characters. The employee signs in with this account."
              >
                <PasswordInput
                  id="password"
                  value={password}
                  autoComplete="new-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    touch();
                  }}
                  disabled={isPending}
                />
              </Field>
            </>
          )}

          <Field
            label="Bio"
            htmlFor="bio"
            hint="Shown to guests on the booking page."
          >
            <Textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                touch();
              }}
              disabled={isPending}
              className="resize-y"
            />
          </Field>
        </div>
      </div>

      <SectionFooter
        dirty={dirty}
        saving={isPending}
        error={formError || (isError ? getErrorMessage(error) : undefined)}
        saveLabel={isEdit ? "Save profile" : "Create employee"}
        onDiscard={discard}
        onSave={handleSave}
      />
    </Section>
  );
}
