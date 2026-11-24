import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/layouts/Layout";
import BookingSteps from "@/components/BookingSteps";
import Loading from "@/components/Loading";
import Textarea from "@/components/Textarea";
import { getErrorMessage } from "@/rest";
import {
  payAppointment,
  getAppointment,
  releaseAppointment,
  type AppointmentItem,
} from "@/service/appointment";
import {
  dayAndMonth,
  downloadCalendarEvent,
  formatPrice,
  initialsOf,
  toDate,
} from "@/utils/appointment";

const time = (value: string) =>
  toDate(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const weekday = (value: string) =>
  toDate(value).toLocaleDateString(undefined, { weekday: "long" });

const primary =
  "inline-flex items-center justify-center min-h-12.5 px-6 rounded-xl border-0 bg-spa-green text-white text-base font-semibold no-underline cursor-pointer hover:bg-spa-green-800 disabled:bg-spa-line disabled:text-spa-muted disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green";

const secondary =
  "inline-flex items-center justify-center min-h-12.5 px-6 rounded-xl border-[1.5px] border-spa-green bg-white text-spa-green-800 text-base font-semibold no-underline cursor-pointer hover:bg-spa-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green";

const Details = ({ appointment }: { appointment: AppointmentItem }) => (
  <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
    <div className="flex-[1_1_260px] min-w-0 flex flex-col gap-1.5">
      <h3
        className="m-0 text-[26px] font-semibold"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {appointment.serviceName}
      </h3>
      <div className="text-[17px] font-semibold">
        {weekday(appointment.startAt)} {dayAndMonth(appointment.startAt)},{" "}
        {time(appointment.startAt)} – {time(appointment.endAt)}
      </div>
      <div className="flex items-center gap-2.5 text-[15px] text-spa-text">
        <span
          aria-hidden="true"
          className="w-7 h-7 rounded-full bg-spa-sand text-spa-sand-ink inline-flex items-center justify-center font-semibold text-[11px]"
        >
          {initialsOf(appointment.employeeName)}
        </span>
        With {appointment.employeeName} · {appointment.durationMinutes} minutes
      </div>
    </div>
  </div>
);

const BookConfirm = () => {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const {
    data: appointment,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => getAppointment(id),
    enabled: Number.isFinite(id),
    retry: false,
  });

  const pay = useMutation({
    mutationFn: () => payAppointment(id, note.trim() || undefined),
    onSuccess: (paid) => {
      queryClient.setQueryData(["appointment", id], paid);
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });

  // Going back to change the time frees the held slot first.
  const changeTime = useMutation({
    mutationFn: () => releaseAppointment(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      navigate(`/services/${appointment?.serviceId}/book`);
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <Loading isLoading />
      </Layout>
    );
  }

  if (isError || !appointment) {
    return (
      <Layout>
        <div className="max-w-160 mx-auto px-4 md:px-8 pt-14 text-center flex flex-col items-center gap-4">
          <h1
            className="m-0 text-[32px] font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            This booking is no longer held
          </h1>
          <p className="m-0 text-spa-muted">
            The time may have been released. Choose a time again to book.
          </p>
          <Link to="/services" className={primary}>
            Back to services
          </Link>
        </div>
      </Layout>
    );
  }

  if (appointment.status === "EXPIRED") {
    return (
      <Layout>
        <div className="max-w-160 mx-auto px-4 md:px-8 pt-14 text-center flex flex-col items-center gap-4">
          <h1
            className="m-0 text-[32px] font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            This booking expired
          </h1>
          <p className="m-0 text-spa-muted">
            We did not receive your payment within 5 minutes, so the time was
            released. Choose a time again to book.
          </p>
          <Link to={`/services/${appointment.serviceId}/book`} className={primary}>
            Choose a time again
          </Link>
        </div>
      </Layout>
    );
  }

  if (appointment.status !== "WAITING_PAYMENT") {
    return (
      <Layout>
        <main className="max-w-160 mx-auto px-4 md:px-8 pt-14 pb-16 flex flex-col items-center gap-7 text-center">
          <span
            aria-hidden="true"
            className="w-18 h-18 rounded-full bg-spa-green text-white inline-flex items-center justify-center"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          </span>
          <div>
            <h1
              className="m-0 text-[40px] font-semibold leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Payment received, you are booked
            </h1>
            <p className="mt-2.5 mb-0 text-base text-spa-muted leading-normal">
              We look forward to seeing you.
            </p>
          </div>
          <section
            aria-label="Appointment details"
            className="w-full box-border bg-white border border-spa-line rounded-[18px] p-6 text-left"
          >
            <Details appointment={appointment} />
          </section>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/" className={primary}>
              View my appointments
            </Link>
            <button
              type="button"
              onClick={() => downloadCalendarEvent(appointment)}
              className={secondary}
            >
              Add to calendar
            </button>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center min-h-11 text-[15px] font-semibold text-spa-green no-underline hover:text-spa-green-800"
          >
            Book another treatment
          </Link>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-300 mx-auto px-4 md:px-8 pt-8 pb-16 flex flex-col gap-7">
        <div className="flex flex-col gap-5">
          <button
            type="button"
            disabled={changeTime.isPending}
            onClick={() => changeTime.mutate()}
            className="inline-flex items-center gap-1.5 min-h-11 self-start border-0 bg-transparent p-0 text-[15px] font-semibold text-spa-green cursor-pointer hover:text-spa-green-800"
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
            Change time
          </button>
          <BookingSteps current={3} />
          <div>
            <h1
              className="m-0 text-[40px] font-semibold leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Pay to confirm your booking
            </h1>
            <p className="mt-2 mb-0 text-base text-spa-muted">
              We are holding this time for you. Pay within 5 minutes or it is
              released.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-7 items-start">
          <div className="flex-[999_1_600px] min-w-0 flex flex-col gap-6">
            <section
              aria-labelledby="h-rev"
              className="bg-white border border-spa-line rounded-[18px] p-7 flex flex-col gap-5"
            >
              <h2 id="h-rev" className="m-0 text-xl font-semibold">
                Appointment
              </h2>
              <Details appointment={appointment} />
            </section>
            <section
              aria-labelledby="h-pay"
              className="bg-white border border-spa-line rounded-[18px] p-7 flex flex-col gap-3"
            >
              <h2 id="h-pay" className="m-0 text-xl font-semibold">
                How to pay
              </h2>
              <ol className="m-0 pl-5 flex flex-col gap-2 text-[15px] text-spa-text">
                <li>
                  Transfer {formatPrice(appointment.price)} to the spa account.
                </li>
                <li>
                  Use this reference so we can match your payment:{" "}
                  <strong>BOOKING-{appointment.id}</strong>
                </li>
                <li>Come back here and press “I have paid”.</li>
              </ol>
            </section>
            <section
              aria-labelledby="h-note"
              className="bg-white border border-spa-line rounded-[18px] p-7 flex flex-col gap-3"
            >
              <h2 id="h-note" className="m-0 text-xl font-semibold">
                Anything we should know?
              </h2>
              <label
                htmlFor="note"
                className="text-sm font-medium text-spa-text"
              >
                Note for your therapist (optional)
              </label>
              <Textarea
                id="note"
                rows={4}
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="For example: sore lower back, or please use light pressure."
                className="resize-y"
              />
            </section>
          </div>

          <aside
            aria-labelledby="h-sum"
            className="flex-[1_1_320px] max-w-100 min-w-0 bg-white border border-spa-line rounded-[18px] p-6 flex flex-col gap-4.5 box-border"
          >
            <h2 id="h-sum" className="m-0 text-xl font-semibold">
              Summary
            </h2>
            <dl className="m-0 flex flex-col gap-3 text-[15px]">
              <div className="flex justify-between gap-3">
                <dt className="text-spa-text">{appointment.serviceName}</dt>
                <dd className="m-0 font-semibold">
                  {formatPrice(appointment.price)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-spa-text">Duration</dt>
                <dd className="m-0 font-semibold">
                  {appointment.durationMinutes} min
                </dd>
              </div>
            </dl>
            <div className="flex items-baseline justify-between pt-4 border-t border-spa-divider">
              <span className="text-[15px] font-medium">Total</span>
              <span
                className="text-[28px] font-semibold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {formatPrice(appointment.price)}
              </span>
            </div>
            <p className="m-0 text-sm text-spa-muted leading-normal">
              Your time is held for 5 minutes. Pay before it ends.
            </p>
            {pay.isError && (
              <p role="alert" className="m-0 text-sm text-spa-danger">
                {getErrorMessage(pay.error)}
              </p>
            )}
            <button
              type="button"
              disabled={pay.isPending}
              onClick={() => pay.mutate()}
              className={primary}
            >
              {pay.isPending ? "Checking…" : "I have paid"}
            </button>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default BookConfirm;
