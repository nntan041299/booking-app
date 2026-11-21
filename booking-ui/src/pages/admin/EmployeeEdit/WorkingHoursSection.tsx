import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  updateEmployee,
  type EmployeeItem,
  type WorkingHours,
} from "@/service/employee";
import { getErrorMessage } from "@/rest";
import { DAYS, toTimeInput } from "../ManageEmployees/constants";
import { Section, SectionFooter } from "./Section";

interface Range {
  start: string;
  end: string;
}

/** Ranges per ISO day of week (1 = Monday). An empty list is a day off. */
type Week = Record<number, Range[]>;

interface WorkingHoursSectionProps {
  employee: EmployeeItem;
  onSaved: (workingHours: WorkingHours[]) => void;
}

const DEFAULT_RANGE: Range = { start: "09:00", end: "17:00" };

const toWeek = (hours: WorkingHours[]): Week => {
  const week: Week = {};
  for (const d of DAYS) week[d.value] = [];
  for (const h of hours) {
    week[h.dayOfWeek]?.push({
      start: toTimeInput(h.startTime),
      end: toTimeInput(h.endTime),
    });
  }
  for (const d of DAYS)
    week[d.value].sort((a, b) => a.start.localeCompare(b.start));
  return week;
};

const toHours = (week: Week): WorkingHours[] =>
  DAYS.flatMap((d) =>
    week[d.value].map((r) => ({
      dayOfWeek: d.value,
      startTime: r.start,
      endTime: r.end,
    })),
  );

/** An error message for the range at `index` of a day, or "" when it is fine. */
const rangeError = (ranges: Range[], index: number): string => {
  const r = ranges[index];
  if (!r.start || !r.end) return "Fill in both times.";
  if (r.start >= r.end) return "The end time must be after the start time.";
  const overlaps = ranges.some(
    (o, i) =>
      i !== index && o.start && o.end && r.start < o.end && o.start < r.end,
  );
  return overlaps ? "This range overlaps another range on the same day." : "";
};

const timeInput =
  "h-11 box-border px-2.5 rounded-[10px] border bg-white text-[15px] " +
  "focus:outline-2 focus:outline-offset-2 focus:outline-spa-green";

export default function WorkingHoursSection({
  employee,
  onSaved,
}: WorkingHoursSectionProps) {
  const saved = toWeek(employee.workingHours);
  const [week, setWeek] = useState<Week>(saved);

  const {
    mutate: save,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: () =>
      updateEmployee(employee.id, { workingHours: toHours(week) }),
    onSuccess: () => onSaved(toHours(week)),
  });

  // Normalise ordering so re-sorted ranges don't look like unsaved edits.
  const dirty = JSON.stringify(toWeek(toHours(week))) !== JSON.stringify(saved);
  const hasErrors = DAYS.some((d) =>
    week[d.value].some((_, i) => rangeError(week[d.value], i)),
  );
  const workingDays = DAYS.filter((d) => week[d.value].length > 0).length;

  const setDay = (day: number, ranges: Range[]) => {
    setWeek((prev) => ({ ...prev, [day]: ranges }));
    if (isError) reset();
  };

  const updateRange = (day: number, index: number, patch: Partial<Range>) =>
    setDay(
      day,
      week[day].map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );

  return (
    <Section
      id="h-hours"
      title="Working hours"
      description="Set the weekly schedule. A day can have several time ranges, for example a break in the middle."
      badge={
        workingDays === 0
          ? "No working days"
          : `${workingDays} working ${workingDays === 1 ? "day" : "days"}`
      }
      defaultOpen
    >
      <div className="flex flex-col">
        {DAYS.map((d) => {
          const ranges = week[d.value];
          const on = ranges.length > 0;
          return (
            <div
              key={d.value}
              className="flex flex-wrap items-start gap-x-6 gap-y-3 py-4 border-t border-spa-divider"
            >
              <div className="w-[150px] flex-none min-h-11 flex flex-col justify-center">
                <div className="font-semibold text-[15px]">{d.label}</div>
                <div className="mt-0.5 text-[13px] text-spa-muted">
                  {on
                    ? ranges.map((r) => `${r.start} to ${r.end}`).join(", ")
                    : "Day off"}
                </div>
              </div>

              <div className="flex-none">
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`${d.label} is ${on ? "a working day" : "a day off"}`}
                  disabled={isPending}
                  onClick={() =>
                    setDay(d.value, on ? [] : [{ ...DEFAULT_RANGE }])
                  }
                  className={`min-h-11 min-w-28 px-4 rounded-full border-[1.5px] text-sm cursor-pointer
                              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
                              disabled:opacity-50 disabled:cursor-not-allowed
                              ${
                                on
                                  ? "border-spa-green bg-spa-green text-white font-semibold"
                                  : "border-spa-border-strong bg-white text-spa-text font-medium"
                              }`}
                >
                  {on ? "Working" : "Day off"}
                </button>
              </div>

              <div className="flex-1 basis-95 min-w-0 flex flex-col gap-2.5">
                {!on && (
                  <div className="min-h-11 flex items-center text-sm text-spa-muted">
                    Not available for bookings.
                  </div>
                )}
                {ranges.map((r, i) => {
                  const err = rangeError(ranges, i);
                  const id = `${d.value}-${i}`;
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <label
                          htmlFor={`s-${id}`}
                          className="w-9 text-[13px] text-spa-muted"
                        >
                          From
                        </label>
                        <input
                          id={`s-${id}`}
                          type="time"
                          value={r.start}
                          disabled={isPending}
                          aria-invalid={Boolean(err)}
                          onChange={(e) =>
                            updateRange(d.value, i, { start: e.target.value })
                          }
                          className={`${timeInput} ${err ? "border-spa-danger" : "border-spa-border-strong"}`}
                        />
                        <label
                          htmlFor={`e-${id}`}
                          className="text-[13px] text-spa-muted"
                        >
                          to
                        </label>
                        <input
                          id={`e-${id}`}
                          type="time"
                          value={r.end}
                          disabled={isPending}
                          aria-invalid={Boolean(err)}
                          onChange={(e) =>
                            updateRange(d.value, i, { end: e.target.value })
                          }
                          className={`${timeInput} ${err ? "border-spa-danger" : "border-spa-border-strong"}`}
                        />
                        <button
                          type="button"
                          aria-label={`Remove time range ${i + 1} for ${d.label}`}
                          disabled={isPending || ranges.length === 1}
                          onClick={() =>
                            setDay(
                              d.value,
                              ranges.filter((_, idx) => idx !== i),
                            )
                          }
                          className="w-11 h-11 rounded-[10px] border border-spa-danger-line bg-white text-spa-danger cursor-pointer
                                     inline-flex items-center justify-center hover:bg-red-50
                                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
                                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                        >
                          <svg
                            aria-hidden="true"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                          </svg>
                        </button>
                      </div>
                      {err && (
                        <div
                          role="alert"
                          className="pl-[46px] text-[13px] font-medium text-spa-danger"
                        >
                          {err}
                        </div>
                      )}
                    </div>
                  );
                })}
                {on && (
                  <div>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        setDay(d.value, [
                          ...ranges,
                          {
                            start: ranges[ranges.length - 1]?.end || "09:00",
                            end: "17:00",
                          },
                        ])
                      }
                      className="min-h-11 px-3.5 rounded-[10px] border-[1.5px] border-dashed border-spa-dashed bg-white text-spa-green-800
                                 text-sm font-semibold cursor-pointer inline-flex items-center gap-2 hover:bg-spa-canvas
                                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        aria-hidden="true"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Add time range
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <SectionFooter
        dirty={dirty}
        valid={!hasErrors}
        saving={isPending}
        error={
          isError
            ? getErrorMessage(error)
            : hasErrors
              ? "Fix the highlighted time ranges to save."
              : undefined
        }
        saveLabel="Save working hours"
        onDiscard={() => {
          setWeek(saved);
          if (isError) reset();
        }}
        onSave={() => save()}
      />
    </Section>
  );
}
