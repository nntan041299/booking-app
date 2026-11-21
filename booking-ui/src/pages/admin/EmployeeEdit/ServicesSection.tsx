import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Dropdown from "@/components/Dropdown";
import { searchAdminServices } from "@/service/catalog";
import { updateEmployee, type EmployeeItem } from "@/service/employee";
import { getErrorMessage } from "@/rest";
import { Section, SectionFooter } from "@/components/Section";

interface ServicesSectionProps {
  employee: EmployeeItem;
  onSaved: (serviceIds: number[]) => void;
}

type Show = "all" | "selected" | "unselected";

const SHOW_OPTIONS = [
  { value: "all", label: "All services" },
  { value: "selected", label: "Selected" },
  { value: "unselected", label: "Not selected" },
];

const sameIds = (a: number[], b: number[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

const fieldLabel = "text-[13px] font-medium text-spa-text";

export default function ServicesSection({
  employee,
  onSaved,
}: ServicesSectionProps) {
  const saved = employee.serviceIds;
  const [selected, setSelected] = useState<number[]>(saved);
  const [query, setQuery] = useState("");
  const [show, setShow] = useState<Show>("all");

  // Active services the employee can be assigned to (backend caps page size at 100).
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-services", "assignable"],
    queryFn: () => searchAdminServices({ active: true, size: 100 }),
  });
  const services = data?.content ?? [];

  const {
    mutate: save,
    isPending,
    isError: isSaveError,
    error,
    reset,
  } = useMutation({
    mutationFn: () => updateEmployee(employee.id, { serviceIds: selected }),
    onSuccess: () => onSaved(selected),
  });

  const dirty = !sameIds(selected, saved);
  const selectedSet = new Set(selected);
  const needle = query.trim().toLowerCase();
  const rows = services.filter(
    (s) =>
      (!needle || s.name.toLowerCase().includes(needle)) &&
      (show === "all" ||
        (show === "selected" ? selectedSet.has(s.id) : !selectedSet.has(s.id))),
  );
  const chips = services.filter((s) => selectedSet.has(s.id));
  const assignedButInactive = selected.filter(
    (id) => !services.some((s) => s.id === id),
  );
  const allShownOn =
    rows.length > 0 && rows.every((s) => selectedSet.has(s.id));

  const change = (next: number[]) => {
    setSelected(next);
    if (isSaveError) reset();
  };

  const toggle = (id: number) =>
    change(
      selectedSet.has(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );

  const toggleAll = () => {
    const shownIds = new Set(rows.map((s) => s.id));
    change(
      allShownOn
        ? selected.filter((id) => !shownIds.has(id))
        : [...new Set([...selected, ...shownIds])],
    );
  };

  return (
    <Section
      id="h-svc"
      title="Services"
      description="Choose the services this employee performs."
      badge={`${selected.length} selected`}
      defaultOpen
    >
      <div className="flex flex-col gap-2">
        <div className={fieldLabel}>Selected services</div>
        <div className="flex flex-wrap items-center gap-2 min-h-11 px-2.5 py-2 bg-spa-canvas rounded-[10px]">
          {chips.length === 0 && (
            <span className="text-sm text-spa-muted">
              Nothing selected yet. Search below and tick the ones to assign.
            </span>
          )}
          {chips.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 pl-3 pr-0.5 py-0.5 rounded-full bg-spa-green-50 text-spa-green-800 text-[13px] font-semibold"
            >
              {s.name}
              <button
                type="button"
                aria-label={`Remove ${s.name}`}
                onClick={() => toggle(s.id)}
                className="w-8 h-8 rounded-full inline-flex items-center justify-center cursor-pointer hover:bg-white/60
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
              >
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 basis-65 flex flex-col gap-1.5">
          <label htmlFor="svc-q" className={fieldLabel}>
            Search services
          </label>
          <input
            id="svc-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by service name"
            className="h-11 box-border px-3.5 rounded-[10px] border border-spa-border-strong bg-white text-[15px] placeholder:text-spa-muted
                       focus:outline-2 focus:outline-offset-2 focus:outline-spa-green"
          />
        </div>
        <div className="flex-none basis-45 flex flex-col gap-1.5">
          <span id="svcf-label" className={fieldLabel}>
            Show
          </span>
          <Dropdown
            id="svcf"
            labelId="svcf-label"
            value={show}
            options={SHOW_OPTIONS}
            onChange={(v) => setShow(v as Show)}
            menuWidth="w-50"
          />
        </div>
        <button
          type="button"
          onClick={() => change([])}
          disabled={selected.length === 0}
          className="min-h-11 px-3.5 bg-transparent text-spa-danger text-sm font-medium cursor-pointer
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green rounded-[10px]"
        >
          Clear all
        </button>
      </div>

      <div className="border border-spa-line rounded-xl max-h-85 overflow-y-auto">
        {isLoading ? (
          <div className="p-7 text-center text-sm text-spa-muted">
            Loading services…
          </div>
        ) : isError ? (
          <div className="p-7 text-center text-sm text-spa-danger">
            Could not load services.
          </div>
        ) : services.length === 0 ? (
          <div className="p-7 text-center text-sm text-spa-muted">
            No active services. Add one first.
          </div>
        ) : rows.length === 0 ? (
          <div className="p-7 text-center text-sm text-spa-muted">
            No services match your search.
          </div>
        ) : (
          <>
            <label className="flex items-center gap-3.5 min-h-14 px-4 py-1.5 border-b border-spa-divider cursor-pointer bg-white">
              <input
                type="checkbox"
                checked={allShownOn}
                onChange={toggleAll}
                className="w-[22px] h-[22px] accent-spa-green flex-shrink-0 m-0"
              />
              <span className="flex-1 min-w-0 text-[15px] font-medium">
                Select all results
              </span>
              <span className="text-[13px] text-spa-muted whitespace-nowrap">
                {rows.length} items
              </span>
            </label>
            {rows.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-3.5 min-h-14 px-4 py-1.5 border-b border-spa-divider last:border-b-0 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(s.id)}
                  onChange={() => toggle(s.id)}
                  className="w-[22px] h-[22px] accent-spa-green flex-shrink-0 m-0"
                />
                <span className="flex-1 min-w-0 text-[15px] font-medium">
                  {s.name}
                </span>
                <span className="text-[13px] text-spa-muted whitespace-nowrap">
                  {s.durationMinutes} min · ${s.price}
                </span>
              </label>
            ))}
          </>
        )}
      </div>

      <p className="m-0 text-[13px] text-spa-muted">
        Showing {rows.length} of {data?.totalElements ?? services.length}{" "}
        services. Scroll the list to see more.
        {assignedButInactive.length > 0 &&
          ` Also assigned: ${assignedButInactive.length} inactive service(s), kept as is.`}
      </p>

      <SectionFooter
        dirty={dirty}
        saving={isPending}
        error={isSaveError ? getErrorMessage(error) : undefined}
        saveLabel="Save services"
        onDiscard={() => change(saved)}
        onSave={() => save()}
      />
    </Section>
  );
}
