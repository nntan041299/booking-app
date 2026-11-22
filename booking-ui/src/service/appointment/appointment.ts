import { request, ENDPOINT } from "@/rest";

export type AppointmentStatus = "UPCOMING" | "COMPLETED";

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
