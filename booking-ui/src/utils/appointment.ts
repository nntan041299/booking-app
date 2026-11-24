import type { AppointmentItem } from "@/service/appointment";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The API sends local date-times without a zone; `new Date` reads them as local time. */
export const toDate = (value: string) => new Date(value);

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const formatPrice = (price: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);

export const monthShort = (value: string) =>
  toDate(value).toLocaleDateString(undefined, { month: "short" });

export const dayOfMonth = (value: string) =>
  String(toDate(value).getDate()).padStart(2, "0");

const timeOf = (value: string) =>
  toDate(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

/** "Sunday, 10:30" */
export const weekdayAndTime = (value: string) =>
  `${toDate(value).toLocaleDateString(undefined, { weekday: "long" })}, ${timeOf(value)}`;

/** "22 November" */
export const dayAndMonth = (value: string) =>
  toDate(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
  });

/** How many calendar days from today the date is (0 = today, 1 = tomorrow). */
const daysFromToday = (value: string, now = new Date()) =>
  Math.round(
    (startOfDay(toDate(value)).getTime() - startOfDay(now).getTime()) / DAY_MS,
  );

/** "Tomorrow, Sunday 22 November at 10:30" */
export const fullWhen = (value: string) => {
  const days = daysFromToday(value);
  const prefix = days === 0 ? "Today, " : days === 1 ? "Tomorrow, " : "";
  const weekday = toDate(value).toLocaleDateString(undefined, {
    weekday: "long",
  });
  return `${prefix}${weekday} ${dayAndMonth(value)} at ${timeOf(value)}`;
};

/** "today", "tomorrow" or "on Sunday 22 November" (for a sentence). */
export const relativeDay = (value: string) => {
  const days = daysFromToday(value);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  const weekday = toDate(value).toLocaleDateString(undefined, {
    weekday: "long",
  });
  return `on ${weekday} ${dayAndMonth(value)}`;
};

export const greeting = (now = new Date()) => {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const icsStamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

const icsEscape = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/[,;]/g, (c) => `\\${c}`);

/** Downloads a one-event calendar file (.ics) for the appointment. */
export const downloadCalendarEvent = (appointment: AppointmentItem) => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Spa Booking//Appointments//EN",
    "BEGIN:VEVENT",
    `UID:appointment-${appointment.id}@spa-booking`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(toDate(appointment.startAt))}`,
    `DTEND:${icsStamp(toDate(appointment.endAt))}`,
    `SUMMARY:${icsEscape(appointment.serviceName)}`,
    `DESCRIPTION:${icsEscape(`With ${appointment.employeeName}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `appointment-${appointment.id}.ics`;
  link.click();
  URL.revokeObjectURL(url);
};

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-11-23", the local calendar day (what the availability API expects). */
export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** "2026-11-23T10:30:00", a local date-time without a zone (what the API expects). */
export const localIso = (date: Date) =>
  `${dateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;

/** "10:30" */
export const clock = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;
