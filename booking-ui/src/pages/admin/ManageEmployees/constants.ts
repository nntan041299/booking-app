export const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
] as const;

/** The backend may return "HH:mm:ss"; <input type="time"> wants "HH:mm". */
export const toTimeInput = (time: string) => time.slice(0, 5);
