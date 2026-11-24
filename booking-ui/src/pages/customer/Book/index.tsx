import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";
import Layout from "@/layouts/Layout";
import BookingSteps from "@/components/BookingSteps";
import Loading from "@/components/Loading";
import { getErrorMessage } from "@/rest";
import {
  getAvailability,
  holdAppointment,
  type Availability,
  type EmployeeAvailability,
} from "@/service/appointment";
import {
  clock,
  dateKey,
  formatPrice,
  initialsOf,
  localIso,
  toDate,
} from "@/utils/appointment";

const STEP_MINUTES = 30;
const DAYS_AHEAD = 7;
const DEFAULT_OPEN = 9 * 60;
const DEFAULT_CLOSE = 18 * 60;
/** The calendar shows one column per therapist, so each column is a stand-in day. */
const columnDay = (index: number, minutes = 0) =>
  new Date(2001, 0, 1 + index, 0, minutes);

const AVATAR_COLORS = [
  { bg: "#F3E3D6", fg: "#6B3A1E" },
  { bg: "#E1E8F3", fg: "#27415F" },
  { bg: "#F1E1E6", fg: "#6A2B3E" },
  { bg: "#E3EEE9", fg: "#1F4238" },
];

const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();

/** Whether the therapist can take the whole service starting at `start`. */
const isFree = (
  employee: EmployeeAvailability,
  start: Date,
  minutes: number,
  now: Date,
) => {
  if (start.getTime() <= now.getTime()) return false;
  const end = new Date(start.getTime() + minutes * 60000);
  const inShift = employee.workingRanges.some(
    (r) => toDate(r.start) <= start && end <= toDate(r.end),
  );
  return (
    inShift &&
    !employee.busy.some((b) => toDate(b.start) < end && start < toDate(b.end))
  );
};

/** Every start time (on the half hour) the therapist can take. */
const startsFor = (
  availability: Availability,
  employee: EmployeeAvailability,
  now: Date,
) => {
  const day = toDate(`${availability.date}T00:00:00`);
  const starts: Date[] = [];
  for (let m = 0; m < 24 * 60; m += STEP_MINUTES) {
    const start = new Date(day.getTime() + m * 60000);
    if (isFree(employee, start, availability.durationMinutes, now)) {
      starts.push(start);
    }
  }
  return starts;
};

interface Selection {
  employee: EmployeeAvailability;
  start: Date;
}

interface Pick {
  day: string;
  employeeId: number;
  startMs: number;
}

const hoursText = (minutes: number) =>
  `${Math.round((minutes / 60) * 10) / 10} h booked`;

const Avatar = ({
  employee,
  index,
  size,
}: {
  employee: EmployeeAvailability;
  index: number;
  size: number;
}) => {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return employee.avatarUrl ? (
    <img
      src={employee.avatarUrl}
      alt=""
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden="true"
      className="rounded-full inline-flex items-center justify-center font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        background: color.bg,
        color: color.fg,
        fontSize: size * 0.36,
      }}
    >
      {initialsOf(employee.fullName)}
    </span>
  );
};

const Book = () => {
  const { serviceId: serviceParam } = useParams();
  const serviceId = Number(serviceParam);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dayIndex, setDayIndex] = useState(0);
  const [pick, setPick] = useState<Pick | null>(null);
  const [dragging, setDragging] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  const days = useMemo(
    () =>
      Array.from(
        { length: DAYS_AHEAD },
        (_, i) =>
          new Date(today.getFullYear(), today.getMonth(), today.getDate() + i),
      ),
    [today],
  );

  // One request per day: the strip shows how many start times each day has.
  const queries = useQueries({
    queries: days.map((day) => ({
      queryKey: ["availability", serviceId, dateKey(day)],
      queryFn: () => getAvailability(serviceId, dateKey(day)),
      enabled: Number.isFinite(serviceId),
    })),
  });

  const dayKey = dateKey(days[dayIndex]);
  const current = queries[dayIndex];
  // "Now" as of the last load, so what is shown stays stable between renders.
  const asOf = current.dataUpdatedAt || today.getTime();
  const now = new Date(asOf);
  const availability = current.data;
  const service = queries.find((q) => q.data)?.data;

  const startsByDay = queries.map((q) => {
    const data = q.data;
    if (!data) return null;
    const all = new Map<number, Date>();
    data.employees.forEach((e) =>
      startsFor(data, e, now).forEach((s) => all.set(s.getTime(), s)),
    );
    return [...all.values()].sort((a, b) => a.getTime() - b.getTime());
  });
  const dayStarts = startsByDay[dayIndex] ?? [];
  const nextFreeIndex = startsByDay.findIndex(
    (s, i) => i > dayIndex && s && s.length > 0,
  );

  const employees = useMemo(
    () => availability?.employees ?? [],
    [availability],
  );
  const lightest = employees.length
    ? employees.reduce((a, b) => (b.busyMinutes < a.busyMinutes ? b : a)).id
    : null;

  const selection: Selection | null = useMemo(() => {
    if (!availability) return null;
    if (pick && pick.day === dayKey) {
      const employee = availability.employees.find(
        (e) => e.id === pick.employeeId,
      );
      const start = new Date(pick.startMs);
      if (
        employee &&
        isFree(employee, start, availability.durationMinutes, now)
      ) {
        return { employee, start };
      }
    }
    // By default: the therapist with the lightest day, at their first free time.
    const byLoad = [...availability.employees].sort(
      (a, b) => a.busyMinutes - b.busyMinutes,
    );
    for (const employee of byLoad) {
      const first = startsFor(availability, employee, now)[0];
      if (first) return { employee, start: first };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability, pick, dayKey, asOf]);

  const choose = (employee: EmployeeAvailability, start: Date) =>
    setPick({ day: dayKey, employeeId: employee.id, startMs: start.getTime() });

  const chooseTime = (start: Date) => {
    if (!availability) return;
    const keep =
      selection &&
      isFree(selection.employee, start, availability.durationMinutes, now)
        ? selection.employee
        : [...availability.employees]
            .sort((a, b) => a.busyMinutes - b.busyMinutes)
            .find((e) => isFree(e, start, availability.durationMinutes, now));
    if (keep) choose(keep, start);
  };

  const chooseEmployee = (employee: EmployeeAvailability) => {
    if (!availability) return;
    const starts = startsFor(availability, employee, now);
    if (!starts.length) return;
    const from = selection?.start.getTime() ?? 0;
    const same = starts.find((s) => s.getTime() === from);
    choose(
      employee,
      same ?? starts.find((s) => s.getTime() >= from) ?? starts[0],
    );
  };

  const hold = useMutation({
    mutationFn: () =>
      holdAppointment({
        employeeId: selection!.employee.id,
        serviceId,
        startAt: localIso(selection!.start),
      }),
    onSuccess: (appointment) =>
      navigate(`/appointments/${appointment.id}/confirm`),
    // Someone else may have taken the slot: show the fresh calendar.
    onError: () =>
      queryClient.invalidateQueries({ queryKey: ["availability", serviceId] }),
  });

  // Calendar geometry: the hours any therapist works that day.
  const [openMin, closeMin] = useMemo(() => {
    const ranges = employees.flatMap((e) => e.workingRanges);
    if (!ranges.length) return [DEFAULT_OPEN, DEFAULT_CLOSE];
    const open = Math.min(...ranges.map((r) => minutesOfDay(toDate(r.start))));
    const close = Math.max(
      ...ranges.map((r) => {
        const end = toDate(r.end);
        return minutesOfDay(end) === 0 ? 24 * 60 : minutesOfDay(end);
      }),
    );
    return [Math.floor(open / 60) * 60, Math.ceil(close / 60) * 60];
  }, [employees]);

  const events = useMemo<EventInput[]>(() => {
    if (!availability) return [];
    const dayStart = toDate(`${availability.date}T00:00:00`).getTime();
    const toMinutes = (value: string) =>
      Math.max(
        0,
        Math.min(24 * 60, (toDate(value).getTime() - dayStart) / 60000),
      );
    const nowMinutes = (asOf - dayStart) / 60000;
    const list: EventInput[] = [];

    availability.employees.forEach((employee, i) => {
      // Open time: shifts, minus whatever is already past.
      const open = employee.workingRanges
        .map((r) => [
          Math.max(toMinutes(r.start), nowMinutes),
          toMinutes(r.end),
        ])
        .filter(([from, to]) => to > from)
        .sort((a, b) => a[0] - b[0]);
      let cursor = openMin;
      open.forEach(([from, to]) => {
        if (from > cursor) {
          list.push({
            start: columnDay(i, cursor),
            end: columnDay(i, from),
            display: "background",
            classNames: ["spa-off"],
          });
        }
        cursor = Math.max(cursor, to);
      });
      if (cursor < closeMin) {
        list.push({
          start: columnDay(i, cursor),
          end: columnDay(i, closeMin),
          display: "background",
          classNames: ["spa-off"],
        });
      }

      employee.busy.forEach((b, n) => {
        list.push({
          id: `busy-${employee.id}-${n}`,
          title: "Booked",
          start: columnDay(i, toMinutes(b.start)),
          end: columnDay(i, toMinutes(b.end)),
          editable: false,
          classNames: ["spa-busy"],
          extendedProps: { kind: "busy" },
        });
      });
    });

    if (selection) {
      const i = availability.employees.findIndex(
        (e) => e.id === selection.employee.id,
      );
      const startMin = (selection.start.getTime() - dayStart) / 60000;
      list.push({
        id: "mine",
        title: availability.serviceName,
        start: columnDay(i, startMin),
        end: columnDay(i, startMin + availability.durationMinutes),
        durationEditable: false,
        classNames: ["spa-mine"],
        extendedProps: { kind: "mine" },
      });
    }
    return list;
  }, [availability, selection, openMin, closeMin, asOf]);

  /** The real time and therapist a calendar position stands for. */
  const resolve = (columnStart: Date) => {
    if (!availability) return null;
    const employee = availability.employees[columnStart.getDate() - 1];
    if (!employee) return null;
    const start = new Date(
      toDate(`${availability.date}T00:00:00`).getTime() +
        minutesOfDay(columnStart) * 60000,
    );
    return { employee, start };
  };

  if (!Number.isFinite(serviceId)) {
    return (
      <Layout>
        <p className="max-w-300 mx-auto px-4 md:px-8 pt-10 text-spa-muted">
          That service does not exist.
        </p>
      </Layout>
    );
  }

  const noEmployees = !!availability && availability.employees.length === 0;
  const dayFull = !!availability && !noEmployees && dayStarts.length === 0;
  const dayLong = days[dayIndex].toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const dayShort = days[dayIndex].toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <Layout>
      <Loading isLoading={current.isLoading} />
      <div className="max-w-300 mx-auto px-4 md:px-8 pt-8 pb-16 flex flex-col gap-7">
        <div className="flex flex-col gap-5">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 min-h-11 self-start text-[15px] font-semibold text-spa-green no-underline hover:text-spa-green-800"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
            All services
          </Link>
          <BookingSteps current={2} />
          <div>
            <h1
              className="m-0 text-[40px] font-semibold leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Choose a time
            </h1>
            <p className="mt-2 mb-0 text-base text-spa-muted">
              Pick a day and a start time. We suggest the therapist with the
              lightest day, and you can drag your booking on the calendar to
              change it.
            </p>
          </div>
        </div>

        {current.isError && !availability && (
          <p role="alert" className="m-0 text-spa-danger">
            {getErrorMessage(current.error)}{" "}
            <Link to="/services" className="text-spa-green font-semibold">
              Back to services
            </Link>
          </p>
        )}

        <div className="flex flex-wrap gap-7 items-start">
          <div className="flex-[999_1_620px] min-w-0 flex flex-col gap-6">
            {service && (
              <section
                aria-label="Selected service"
                className="bg-white border border-spa-line rounded-2xl p-4 flex flex-wrap items-center gap-x-5 gap-y-4"
              >
                {service.imageUrl ? (
                  <img
                    src={service.imageUrl}
                    alt=""
                    className="w-22 h-22 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="w-22 h-22 rounded-xl bg-spa-sand text-spa-sand-ink flex items-center justify-center shrink-0"
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 21c-4.5-2-7-5.5-7-9.5C5 8 7.5 5 12 3c4.5 2 7 5 7 8.5 0 4-2.5 7.5-7 9.5z" />
                      <path d="M12 8v13" />
                    </svg>
                  </div>
                )}
                <div className="flex-[1_1_240px] min-w-0">
                  <h2 className="m-0 text-[19px] font-semibold">
                    {service.serviceName}
                  </h2>
                  <div className="mt-1.5 text-sm font-semibold">
                    {service.durationMinutes} min · {formatPrice(service.price)}
                  </div>
                </div>
                <Link
                  to="/services"
                  className="inline-flex items-center min-h-11 px-4 rounded-[10px] border border-spa-border-strong text-spa-ink text-sm font-medium no-underline hover:bg-spa-canvas"
                >
                  Change service
                </Link>
              </section>
            )}

            <section
              aria-labelledby="h-day"
              className="bg-white border border-spa-line rounded-[18px] p-6 flex flex-col gap-5"
            >
              <h2 id="h-day" className="m-0 text-xl font-semibold">
                1. Pick a day and a start time
              </h2>
              <div
                role="group"
                aria-label="Days"
                className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(104px,1fr))]"
              >
                {days.map((day, i) => {
                  const starts = startsByDay[i];
                  const on = i === dayIndex;
                  const count = starts ? starts.length : null;
                  const label =
                    i === 0
                      ? "Today"
                      : day.toLocaleDateString(undefined, { weekday: "short" });
                  const countText =
                    count === null
                      ? "…"
                      : count === 0
                        ? "Fully booked"
                        : `${count} start times`;
                  return (
                    <button
                      key={dateKey(day)}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${day.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}, ${countText}`}
                      onClick={() => {
                        setDayIndex(i);
                        setPick(null);
                      }}
                      className={`flex flex-col items-center gap-0.5 min-h-21 px-1.5 py-2.5 rounded-xl border-[1.5px] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green ${
                        on
                          ? "bg-spa-green border-spa-green text-white"
                          : `bg-white border-spa-line hover:border-spa-green ${count === 0 ? "text-spa-muted" : "text-spa-ink"}`
                      }`}
                    >
                      <span className="text-[13px] font-semibold">{label}</span>
                      <span
                        className="text-[26px] font-semibold leading-tight"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {day.getDate()}
                      </span>
                      <span className="text-xs font-medium">{countText}</span>
                    </button>
                  );
                })}
              </div>

              {dayStarts.length > 0 && (
                <div>
                  <div
                    id="h-time"
                    className="text-sm font-semibold text-spa-text mb-2.5"
                  >
                    Start times on {dayLong}
                  </div>
                  <div
                    role="group"
                    aria-labelledby="h-time"
                    className="flex flex-wrap gap-2.5"
                  >
                    {dayStarts.map((start) => {
                      const on = selection?.start.getTime() === start.getTime();
                      return (
                        <button
                          key={start.getTime()}
                          type="button"
                          aria-pressed={on}
                          onClick={() => chooseTime(start)}
                          className={`min-h-11 min-w-19 px-3 rounded-[10px] border-[1.5px] text-[15px] font-semibold cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green ${
                            on
                              ? "bg-spa-green border-spa-green text-white"
                              : "bg-white border-spa-border-strong text-spa-ink hover:border-spa-green hover:bg-spa-green-50"
                          }`}
                        >
                          {clock(start)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {noEmployees && (
                <div className="border-[1.5px] border-dashed border-spa-border-strong rounded-[14px] p-7 text-center">
                  <h3 className="m-0 text-lg font-semibold">
                    No therapist offers this treatment yet
                  </h3>
                  <p className="mt-2 mb-0 text-spa-muted">
                    Please choose another service.
                  </p>
                </div>
              )}

              {dayFull && (
                <div className="border-[1.5px] border-dashed border-spa-border-strong rounded-[14px] p-7 flex flex-col items-center gap-2.5 text-center">
                  <h3 className="m-0 text-lg font-semibold">
                    Fully booked on {dayShort}
                  </h3>
                  <p className="m-0 text-[15px] text-spa-muted max-w-110 leading-normal">
                    None of our therapists have a free{" "}
                    {availability?.durationMinutes} minute slot on this day, as
                    the calendar below shows.
                  </p>
                  {nextFreeIndex >= 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDayIndex(nextFreeIndex);
                        setPick(null);
                      }}
                      className="mt-1.5 min-h-11.5 px-5 rounded-[10px] border-0 bg-spa-green text-white text-[15px] font-semibold cursor-pointer hover:bg-spa-green-800"
                    >
                      See{" "}
                      {days[nextFreeIndex].toLocaleDateString(undefined, {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                      , the next day with free times
                    </button>
                  )}
                </div>
              )}
            </section>

            {availability && !noEmployees && (
              <section
                aria-labelledby="h-cal"
                className="bg-white border border-spa-line rounded-[18px] p-6 flex flex-col gap-4"
              >
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                  <div>
                    <h2 id="h-cal" className="m-0 text-xl font-semibold">
                      2. Your therapist and calendar
                    </h2>
                    <p className="mt-1 mb-0 text-[15px] text-spa-muted">
                      {dayLong} · all therapists
                    </p>
                  </div>
                  <ul
                    aria-label="Legend"
                    className="list-none m-0 p-0 flex flex-wrap gap-x-4.5 gap-y-1.5 text-[13px] text-spa-text"
                  >
                    <li className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="w-4.5 h-3.5 rounded bg-spa-green"
                      />
                      Your booking
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="w-4.5 h-3.5 rounded border border-[#d8d0c1]"
                        style={{
                          background:
                            "repeating-linear-gradient(135deg,#ece6da 0,#ece6da 4px,#e2dacb 4px,#e2dacb 8px)",
                        }}
                      />
                      Already booked
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="w-4.5 h-3.5 rounded border border-[#d8d0c1] bg-white"
                      />
                      Free
                    </li>
                  </ul>
                </div>

                <div className="booking-calendar border border-spa-line rounded-[14px] overflow-x-auto">
                  <div
                    style={{
                      minWidth: 64 + availability.employees.length * 150,
                    }}
                  >
                    <FullCalendar
                      key={`${dayKey}-${availability.employees.length}-${openMin}-${closeMin}`}
                      plugins={[timeGridPlugin, interactionPlugin]}
                      initialView="employees"
                      views={{
                        employees: {
                          type: "timeGrid",
                          duration: { days: availability.employees.length },
                        },
                      }}
                      initialDate={columnDay(0)}
                      headerToolbar={false}
                      allDaySlot={false}
                      height="auto"
                      slotMinTime={`${String(Math.floor(openMin / 60)).padStart(2, "0")}:00:00`}
                      slotMaxTime={
                        closeMin >= 24 * 60
                          ? "24:00:00"
                          : `${String(Math.floor(closeMin / 60)).padStart(2, "0")}:00:00`
                      }
                      slotDuration="00:30:00"
                      snapDuration="00:30:00"
                      slotLabelInterval="01:00:00"
                      slotLabelFormat={{
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }}
                      editable
                      eventDurationEditable={false}
                      eventOverlap
                      longPressDelay={200}
                      events={events}
                      dayHeaderContent={(arg) => {
                        const i = arg.date.getDate() - 1;
                        const employee = availability.employees[i];
                        if (!employee) return null;
                        const free =
                          startsFor(availability, employee, now).length > 0;
                        const on = selection?.employee.id === employee.id;
                        return (
                          <button
                            type="button"
                            aria-pressed={on}
                            disabled={!free}
                            onClick={() => chooseEmployee(employee)}
                            className={`w-full flex flex-col items-center gap-1 px-1.5 py-3 border-0 border-b-[3px] font-[inherit] text-center ${
                              on
                                ? "border-spa-green bg-[#f4f8f6]"
                                : "border-transparent bg-white"
                            } ${free ? "cursor-pointer text-spa-ink hover:bg-[#f4f8f6]" : "cursor-not-allowed text-spa-muted"}`}
                          >
                            <Avatar employee={employee} index={i} size={36} />
                            <span className="text-sm font-semibold leading-tight">
                              {employee.fullName}
                            </span>
                            <span className="text-xs text-[#4a5650]">
                              {free
                                ? hoursText(employee.busyMinutes)
                                : "Fully booked"}
                            </span>
                            {employee.id === lightest && (
                              <span className="px-2 py-0.5 rounded-full bg-spa-green-50 text-spa-green-800 text-[11px] font-semibold">
                                Lightest day
                              </span>
                            )}
                          </button>
                        );
                      }}
                      eventContent={(arg) =>
                        arg.event.extendedProps.kind === "mine" ? (
                          <div className="px-3 py-2.5 flex flex-col gap-1 select-none">
                            <span className="text-sm font-semibold leading-tight pr-5">
                              {arg.event.title}
                            </span>
                            <span className="text-[13px] font-medium">
                              {clock(resolve(arg.event.start!)!.start)} –{" "}
                              {clock(
                                new Date(
                                  resolve(arg.event.start!)!.start.getTime() +
                                    availability.durationMinutes * 60000,
                                ),
                              )}
                            </span>
                            <svg
                              aria-hidden="true"
                              className="absolute top-2 right-2 opacity-85"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <circle cx="9" cy="6" r="1.8" />
                              <circle cx="15" cy="6" r="1.8" />
                              <circle cx="9" cy="12" r="1.8" />
                              <circle cx="15" cy="12" r="1.8" />
                              <circle cx="9" cy="18" r="1.8" />
                              <circle cx="15" cy="18" r="1.8" />
                            </svg>
                          </div>
                        ) : (
                          <div className="px-2 py-1.5 text-xs font-medium">
                            Booked
                          </div>
                        )
                      }
                      eventAllow={(drop) => {
                        const target = resolve(drop.start);
                        return (
                          !!target &&
                          isFree(
                            target.employee,
                            target.start,
                            availability.durationMinutes,
                            new Date(),
                          )
                        );
                      }}
                      eventDragStart={() => setDragging(true)}
                      eventDragStop={() => setDragging(false)}
                      eventDrop={(info) => {
                        const target = resolve(info.event.start!);
                        if (target) choose(target.employee, target.start);
                        else info.revert();
                      }}
                    />
                  </div>
                </div>

                <p
                  aria-live="polite"
                  className="m-0 text-sm leading-normal text-[#4a5650] flex items-center gap-2"
                >
                  <svg
                    aria-hidden="true"
                    className="shrink-0"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v5M12 16.5v.5" />
                  </svg>
                  {dragging
                    ? "Release on a white area to place your booking."
                    : "Drag your booking to another time or therapist, or use the start times above."}
                </p>
              </section>
            )}
          </div>

          <aside
            aria-labelledby="h-sum"
            className="flex-[1_1_320px] max-w-100 min-w-0 bg-white border border-spa-line rounded-[18px] p-6 flex flex-col gap-4.5 box-border"
          >
            <h2 id="h-sum" className="m-0 text-xl font-semibold">
              Your booking
            </h2>
            <dl className="m-0 flex flex-col gap-3.5 text-[15px]">
              <div>
                <dt className="text-[13px] font-semibold text-spa-muted">
                  Service
                </dt>
                <dd className="mt-0.5 mb-0 font-semibold">
                  {service?.serviceName ?? "…"}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-semibold text-spa-muted">
                  Date
                </dt>
                <dd className="mt-0.5 mb-0 font-semibold">{dayLong}</dd>
              </div>
              {selection && availability ? (
                <>
                  <div>
                    <dt className="text-[13px] font-semibold text-spa-muted">
                      Time
                    </dt>
                    <dd className="mt-0.5 mb-0 font-semibold">
                      {clock(selection.start)} –{" "}
                      {clock(
                        new Date(
                          selection.start.getTime() +
                            availability.durationMinutes * 60000,
                        ),
                      )}{" "}
                      ({availability.durationMinutes} min)
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] font-semibold text-spa-muted">
                      Therapist
                    </dt>
                    <dd className="mt-0.5 mb-0 font-semibold flex items-center gap-2.5">
                      <Avatar
                        employee={selection.employee}
                        index={availability.employees.indexOf(
                          selection.employee,
                        )}
                        size={28}
                      />
                      {selection.employee.fullName}
                    </dd>
                    {selection.employee.id === lightest && (
                      <dd className="mt-1.5 mb-0 text-[13px] text-spa-muted leading-snug">
                        Suggested: the therapist with the lightest day.
                      </dd>
                    )}
                  </div>
                </>
              ) : (
                availability && (
                  <div className="px-4 py-3.5 rounded-xl bg-spa-canvas text-spa-text leading-snug">
                    No time is free on this day. Pick another day to continue.
                  </div>
                )
              )}
            </dl>
            <div className="flex items-baseline justify-between pt-4 border-t border-spa-divider">
              <span className="text-[15px] font-medium">Total</span>
              <span
                className="text-[28px] font-semibold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {service ? formatPrice(service.price) : "…"}
              </span>
            </div>
            {hold.isError && (
              <p role="alert" className="m-0 text-sm text-spa-danger">
                {getErrorMessage(hold.error)}
              </p>
            )}
            <button
              type="button"
              disabled={!selection || hold.isPending}
              onClick={() => hold.mutate()}
              className="min-h-12.5 rounded-xl border-0 bg-spa-green text-white text-base font-semibold cursor-pointer hover:bg-spa-green-800 disabled:bg-spa-line disabled:text-spa-muted disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
            >
              {hold.isPending ? "Holding your time…" : "Continue"}
            </button>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default Book;
