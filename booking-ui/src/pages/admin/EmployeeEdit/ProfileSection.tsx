import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Field from "@/components/Field";
import Input from "@/components/Input";
import PasswordInput from "@/components/PasswordInput";
import Textarea from "@/components/Textarea";
import {
  createEmployee,
  updateEmployee,
  type EmployeeItem,
} from "@/service/employee";
import { getErrorMessage } from "@/rest";
import { Section, SectionFooter } from "@/components/Section";

export type ProfilePatch = Pick<
  EmployeeItem,
  "fullName" | "bio" | "avatarUrl" | "active"
>;

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
    active: employee?.active ?? true,
  };

  const [fullName, setFullName] = useState(saved.fullName);
  const [avatarUrl, setAvatarUrl] = useState(saved.avatarUrl);
  const [bio, setBio] = useState(saved.bio);
  const [active, setActive] = useState(saved.active);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  const {
    mutate: save,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        await updateEmployee(employee.id, {
          fullName: fullName.trim(),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim(),
          active,
        });
        return undefined;
      }
      const res = await createEmployee({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      return res.data?.data as EmployeeItem | undefined;
    },
    onSuccess: (created) => {
      if (isEdit) {
        setFullName(fullName.trim());
        setAvatarUrl(avatarUrl.trim());
        setBio(bio.trim());
        onSaved({
          fullName: fullName.trim(),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim(),
          active,
        });
      } else {
        onCreated(created);
      }
    },
  });

  const dirty = isEdit
    ? fullName !== saved.fullName ||
      avatarUrl !== saved.avatarUrl ||
      bio !== saved.bio ||
      active !== saved.active
    : Boolean(fullName || avatarUrl || bio || username || email || password);

  const touch = () => {
    setFormError("");
    if (isError) reset();
  };

  const discard = () => {
    setFullName(saved.fullName);
    setAvatarUrl(saved.avatarUrl);
    setBio(saved.bio);
    setActive(saved.active);
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
    if (avatarUrl.length > 255)
      return setFormError("Avatar URL must not exceed 255 characters");
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
          <div
            aria-hidden="true"
            className="w-24 h-24 rounded-full overflow-hidden bg-spa-green-50 text-spa-green-800 flex items-center justify-center text-3xl font-semibold"
          >
            {avatarUrl.trim() ? (
              <img
                src={avatarUrl.trim()}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <span className="text-[12.5px] text-spa-muted text-center">
            Avatar preview
          </span>
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

          <Field label="Avatar URL" htmlFor="avatarUrl">
            <Input
              id="avatarUrl"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                touch();
              }}
              disabled={isPending}
            />
          </Field>

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

          {isEdit && (
            <label className="flex items-center gap-3 min-h-11 text-[15px] cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                disabled={isPending}
                onChange={(e) => {
                  setActive(e.target.checked);
                  touch();
                }}
                className="w-[22px] h-[22px] accent-spa-green m-0"
              />
              Active (can sign in and be booked)
            </label>
          )}
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
