import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Field from "@/components/Field";
import ImageUpload from "@/components/ImageUpload";
import { useImageField } from "@/components/ImageUpload/useImageField";
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
  const [bio, setBio] = useState(saved.bio);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  // A newly picked image is only sent with the rest of the form on save.
  const avatar = useImageField(saved.avatarUrl);

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
            removeAvatar: avatar.removed || undefined,
          },
          avatar.file,
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
        avatar.file,
      );
      return res.data?.data as EmployeeItem | undefined;
    },
    onSuccess: (result) => {
      if (isEdit) {
        // With a new image the backend decides the final URL.
        const savedAvatarUrl = result?.avatarUrl ?? "";
        setFullName(fullName.trim());
        avatar.commit(savedAvatarUrl);
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

  const dirty = isEdit
    ? fullName !== saved.fullName || avatar.dirty || bio !== saved.bio
    : Boolean(fullName || avatar.dirty || bio || username || email || password);

  const touch = () => {
    setFormError("");
    if (isError) reset();
  };

  const discard = () => {
    setFullName(saved.fullName);
    avatar.reset();
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

  return (
    <Section
      id="h-profile"
      title="Profile"
      description="Name, bio and avatar shown to guests."
      badge={saved.fullName || undefined}
      defaultOpen
    >
      <div className="flex flex-wrap gap-6">
        <ImageUpload
          id="employee-avatar"
          label="Employee photo"
          name={fullName}
          src={avatar.src}
          disabled={isPending}
          onPick={(file) => {
            touch();
            avatar.pick(file);
          }}
          onRemove={() => {
            touch();
            avatar.clear();
          }}
          onError={setFormError}
        />

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
