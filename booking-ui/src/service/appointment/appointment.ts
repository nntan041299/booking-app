import { request, ENDPOINT } from "@/rest";

/** WAITING_PAYMENT: the slot is held for the customer, who has not paid yet. EXPIRED: not paid in time. */
export type AppointmentStatus = "WAITING_PAYMENT" | "EXPIRED" | "UPCOMING" | "COMPLETED";

export interface AppointmentItem {
  id: number;
  customerId: number;
  employeeId: number;
  employeeName: string;
  serviceId: number;
  /** The service as it was when the appointment was booked. */
  serviceName: string;
  durationMinutes: number;
  /** Local date-time without a zone, e.g. "2026-11-22T10:30:00". */
  startAt: string;
  endAt: string;
  /** The price when the appointment was booked. */
  price: number;
  paid: boolean;
  status: AppointmentStatus;
  note?: string;
}

/** The signed-in customer's appointments, latest first. */
export const listMyAppointments = async (): Promise<AppointmentItem[]> => {
  const res = await request.get({ path: ENDPOINT.APPOINTMENTS });
  return res.data.data;
};

/** A local date-time range without a zone. */
export interface TimeRange {
  start: string;
  end: string;
}

export interface EmployeeAvailability {
  id: number;
  fullName: string;
  avatarUrl?: string;
  /** The employee's shifts on the day. */
  workingRanges: TimeRange[];
  /** Everything already booked on the day, for any customer. */
  busy: TimeRange[];
  busyMinutes: number;
}

export interface Availability {
  serviceId: number;
  serviceName: string;
  durationMinutes: number;
  price: number;
  imageUrl?: string;
  /** "2026-11-23" */
  date: string;
  employees: EmployeeAvailability[];
}

/** Every employee who offers the service, with their shifts and booked slots on the day. */
export const getAvailability = async (
  serviceId: number,
  date: string,
): Promise<Availability> => {
  const query = new URLSearchParams({ serviceId: String(serviceId), date });
  const res = await request.get({
    path: `${ENDPOINT.APPOINTMENTS}/availability?${query}`,
  });
  return res.data.data;
};

export interface HoldAppointmentPayload {
  employeeId: number;
  serviceId: number;
  /** Local date-time, e.g. "2026-11-23T10:00:00". */
  startAt: string;
}

/** Books the slot as WAITING_PAYMENT: it counts as booked for every customer. */
export const holdAppointment = async (
  payload: HoldAppointmentPayload,
): Promise<AppointmentItem> => {
  const res = await request.post({
    path: ENDPOINT.APPOINTMENTS,
    body: { ...payload },
  });
  return res.data.data;
};

export const getAppointment = async (id: number): Promise<AppointmentItem> => {
  const res = await request.get({ path: `${ENDPOINT.APPOINTMENTS}/${id}` });
  return res.data.data;
};

/** Marks the booking as PAID. */
export const payAppointment = async (
  id: number,
  note?: string,
): Promise<AppointmentItem> => {
  const res = await request.post({
    path: `${ENDPOINT.APPOINTMENTS}/${id}/pay`,
    body: { note },
  });
  return res.data.data;
};

/** Drops a WAITING_PAYMENT booking so the slot is free again. */
export const releaseAppointment = async (id: number) => {
  await request.delete({ path: `${ENDPOINT.APPOINTMENTS}/${id}` });
};
