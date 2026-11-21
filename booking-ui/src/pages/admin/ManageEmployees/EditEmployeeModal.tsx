import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Button from "@/components/Button";
import Field from "@/components/Field";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import Textarea from "@/components/Textarea";
import { searchAdminServices } from "@/service/catalog";
import {
  updateEmployee,
  type EmployeeItem,
  type WorkingHours,
} from "@/service/employee";
import { getErrorMessage } from "@/rest";
import { DAYS, toTimeInput } from "./constants";

interface EditEmployeeModalProps {
  employee: EmployeeItem;
  onClose: () => void;
  onSaved: () => void;
}

const validateHours = (hours: WorkingHours[]): string => {
  for (const h of hours) {
    if (!h.startTime || !h.endTime) return "Fill in every start and end time";
    if (h.startTime >= h.endTime)
      return "Each working range must start before it ends";
  }
  const sorted = [...hours].sort(
    (a, b) =>
      a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
  );
  for (let i = 1; i < sorted.length; i++) {
    if (
      sorted[i].dayOfWeek === sorted[i - 1].dayOfWeek &&
      sorted[i].startTime < sorted[i - 1].endTime
    )
      return "Working ranges on the same day must not overlap";
  }
  return "";
};

export default function EditEmployeeModal({
  employee,
  onClose,
  onSaved,
}: EditEmployeeModalProps) {
  const [fullName, setFullName] = useState(employee.fullName);
  const [bio, setBio] = useState(employee.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(employee.avatarUrl ?? "");
  const [active, setActive] = useState(employee.active);
  const [serviceIds, setServiceIds] = useState<number[]>(employee.serviceIds);
  const [hours, setHours] = useState<WorkingHours[]>(
    employee.workingHours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      startTime: toTimeInput(h.startTime),
      endTime: toTimeInput(h.endTime),
    })),
  );
  const [formError, setFormError] = useState("");

  // Active services the employee can be assigned to (backend caps page size at 100).
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["admin-services", "assignable"],
    queryFn: () => searchAdminServices({ active: true, size: 100 }),
  });

  const {
    mutate: save,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: () =>
      updateEmployee(employee.id, {
        fullName: fullName.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        active,
        workingHours: hours,
        serviceIds,
      }),
    onSuccess: onSaved,
  });

  const touch = () => {
    setFormError("");
    if (isError) reset();
  };

  const updateHour = (index: number, patch: Partial<WorkingHours>) => {
    setHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, ...patch } : h)),
    );
    touch();
  };

  const toggleService = (id: number) => {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
    touch();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return setFormError("Full name is required");
    if (fullName.trim().length > 100)
      return setFormError("Full name must not exceed 100 characters");
    if (avatarUrl.length > 255)
      return setFormError("Avatar URL must not exceed 255 characters");
    const hoursError = validateHours(hours);
    if (hoursError) return setFormError(hoursError);
    save();
  };

  const assignedButInactive = serviceIds.filter(
    (id) => !services?.content.some((s) => s.id === id),
  );

  return (
    <Modal title="Edit employee" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
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
        <Field label="Bio (optional)" htmlFor="bio">
          <Textarea
            id="bio"
            rows={2}
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              touch();
            }}
            disabled={isPending}
          />
        </Field>
        <Field label="Avatar URL (optional)" htmlFor="avatarUrl">
          <Input
            id="avatarUrl"
            value={avatarUrl}
            onChange={(e) => {
              setAvatarUrl(e.target.value);
              touch();
            }}
            disabled={isPending}
          />
        </Field>

        <label
          className="flex items-center gap-2 text-sm text-surface-700 cursor-pointer"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <input
            type="checkbox"
            checked={active}
            disabled={isPending}
            onChange={(e) => {
              setActive(e.target.checked);
              touch();
            }}
          />
          Active (can sign in and be booked)
        </label>

        <fieldset className="space-y-2">
          <legend
            className="text-sm font-medium text-surface-700"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Services
          </legend>
          {servicesLoading ? (
            <p className="text-sm text-surface-500">Loading services…</p>
          ) : !services?.content.length ? (
            <p className="text-sm text-surface-500">
              No active services. Add one first.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
              {services.content.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center gap-2 text-sm text-surface-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={serviceIds.includes(service.id)}
                    disabled={isPending}
                    onChange={() => toggleService(service.id)}
                  />
                  {service.name}
                </label>
              ))}
            </div>
          )}
          {assignedButInactive.length > 0 && (
            <p className="text-xs text-surface-500">
              Also assigned: {assignedButInactive.length} inactive service(s),
              kept as is.
            </p>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend
            className="text-sm font-medium text-surface-700"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Working hours
          </legend>
          {hours.length === 0 && (
            <p className="text-sm text-surface-500">
              No working hours set, so this employee cannot be booked.
            </p>
          )}
          {hours.map((h, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Day of week"
                value={h.dayOfWeek}
                disabled={isPending}
                onChange={(e) =>
                  updateHour(i, { dayOfWeek: Number(e.target.value) })
                }
                className="px-3 py-2 rounded-xl border border-surface-200 bg-white text-sm text-surface-700"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <input
                type="time"
                aria-label="Start time"
                value={h.startTime}
                disabled={isPending}
                onChange={(e) => updateHour(i, { startTime: e.target.value })}
                className="px-3 py-2 rounded-xl border border-surface-200 bg-white text-sm"
              />
              <span className="text-surface-400">–</span>
              <input
                type="time"
                aria-label="End time"
                value={h.endTime}
                disabled={isPending}
                onChange={(e) => updateHour(i, { endTime: e.target.value })}
                className="px-3 py-2 rounded-xl border border-surface-200 bg-white text-sm"
              />
              <button
                type="button"
                aria-label="Remove working range"
                disabled={isPending}
                onClick={() => {
                  setHours((prev) => prev.filter((_, idx) => idx !== i));
                  touch();
                }}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
              >
                <i className="pi pi-trash text-sm" />
              </button>
            </div>
          ))}
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => {
              setHours((prev) => [
                ...prev,
                { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
              ]);
              touch();
            }}
          >
            <i className="pi pi-plus text-xs mr-2" />
            Add range
          </Button>
        </fieldset>

        {(formError || isError) && (
          <p
            className="text-sm text-red-500"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {formError || getErrorMessage(error)}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
