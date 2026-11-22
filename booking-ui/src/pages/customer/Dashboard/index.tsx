import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/layouts/Layout";
import Loading from "@/components/Loading";
import { selectUser } from "@/redux/user/selectors";
import {
  listMyAppointments,
  type AppointmentItem,
} from "@/service/appointment";
import { searchServices, type ServiceItem } from "@/service/catalog";
import {
  dayAndMonth,
  dayOfMonth,
  downloadCalendarEvent,
  formatPrice,
  fullWhen,
  greeting,
  initialsOf,
  monthShort,
  relativeDay,
  weekdayAndTime,
} from "@/utils/appointment";

const TILE_COLORS = [
  { bg: "#E3EEE9", fg: "#1F4238" },
  { bg: "#F3E3D6", fg: "#6B3A1E" },
  { bg: "#E1E8F3", fg: "#27415F" },
  { bg: "#F1E1E6", fg: "#6A2B3E" },
];

const STEPS = [
  {
    title: "Choose a service",
    text: "Pick a treatment and see how long it takes and what it costs.",
  },
  {
    title: "Pick a time",
    text: "Choose your therapist and a time that suits you.",
  },
  {
    title: "Show up and relax",
    text: "We confirm your booking and send a reminder before your visit.",
  },
];

type Tab = "upcoming" | "past";

const LeafIcon = ({ size }: { size: number }) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
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
);

const primaryLink =
  "inline-flex items-center gap-2 min-h-12 px-6 rounded-xl bg-spa-green text-white font-semibold text-base no-underline hover:bg-spa-green-800 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green";

const secondaryButton =
  "inline-flex items-center justify-center min-h-11 px-4 rounded-[10px] border border-spa-border-strong bg-white text-spa-ink text-sm font-medium cursor-pointer no-underline hover:bg-spa-canvas " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green";

const BookIcon = () => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const CustomerDashboard = () => {
  const { firstName } = useSelector(selectUser);
  const [tab, setTab] = useState<Tab>("upcoming");

  const appointmentsQuery = useQuery({
    queryKey: ["my-appointments"],
    queryFn: listMyAppointments,
  });
  const servicesQuery = useQuery({
    queryKey: ["services", "dashboard"],
    queryFn: () => searchServices({ size: 100 }),
  });

  const upcoming = useMemo(
    () =>
      (appointmentsQuery.data ?? [])
        .filter((a) => a.status === "UPCOMING")
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [appointmentsQuery.data],
  );
  const past = useMemo(
    () =>
      (appointmentsQuery.data ?? [])
        .filter((a) => a.status === "COMPLETED")
        .sort((a, b) => b.startAt.localeCompare(a.startAt)),
    [appointmentsQuery.data],
  );

  const services = useMemo(
    () => servicesQuery.data?.content.filter((s) => s.active) ?? [],
    [servicesQuery.data],
  );
  const serviceById = useMemo(
    () => new Map(services.map((s) => [s.id, s])),
    [services],
  );

  // Services shown at the bottom: the ones booked before first, then the rest.
  const suggestions = useMemo(() => {
    const booked = past
      .map((a) => serviceById.get(a.serviceId))
      .filter((s): s is ServiceItem => Boolean(s));
    const picked = new Map(booked.map((s) => [s.id, s]));
    services.forEach((s) => picked.set(s.id, picked.get(s.id) ?? s));
    return [...picked.values()].slice(0, 4);
  }, [past, services, serviceById]);

  const isLoading = appointmentsQuery.isLoading;
  const next = upcoming[0];
  const lastVisit = past[0];
  const isNewGuest = !upcoming.length && !past.length;
  const shownTab: Tab = tab === "past" && !past.length ? "upcoming" : tab;
  const rows = shownTab === "upcoming" ? upcoming : past;
  const name = firstName ?? "";

  const heading = next
    ? `${greeting()}${name ? `, ${name}` : ""}`
    : `${isNewGuest ? "Welcome" : "Welcome back"}${name ? `, ${name}` : ""}`;
  const subheading = next
    ? `You have ${upcoming.length} upcoming appointment${upcoming.length === 1 ? "" : "s"}. Your next one is ${relativeDay(next.startAt)}.`
    : isNewGuest
      ? "Let's book your first visit."
      : "Ready for your next visit?";

  return (
    <Layout>
      <Loading isLoading={isLoading} />

      <div className="max-w-300 mx-auto px-4 md:px-8 pt-10 pb-16 flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className="m-0 text-[40px] font-semibold leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {heading}
            </h1>
            <p className="mt-2 mb-0 text-base text-spa-muted">{subheading}</p>
          </div>
          {next && (
            <Link to="/services" className={primaryLink}>
              <BookIcon />
              Book an appointment
            </Link>
          )}
        </div>

        {appointmentsQuery.isError && (
          <p role="alert" className="m-0 text-sm text-spa-danger">
            Could not load your appointments.
          </p>
        )}

        {next ? (
          <NextAppointment
            appointment={next}
            imageUrl={serviceById.get(next.serviceId)?.imageUrl}
          />
        ) : (
          !isLoading &&
          !appointmentsQuery.isError && (
            <WelcomeCard isNewGuest={isNewGuest} lastVisit={lastVisit} />
          )
        )}

        <section
          aria-labelledby="h-appts"
          className="bg-white border border-spa-line rounded-[18px] p-7 flex flex-col gap-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="h-appts" className="m-0 text-xl font-semibold">
              Appointments
            </h2>
            {!isNewGuest && (
              <div className="inline-flex gap-1 p-1 bg-spa-canvas rounded-xl">
                {(
                  [
                    ["upcoming", `Upcoming (${upcoming.length})`],
                    ["past", `Past (${past.length})`],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={shownTab === key}
                    onClick={() => setTab(key)}
                    className={`min-h-11 px-4.5 rounded-[9px] text-[15px] cursor-pointer border-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green ${
                      shownTab === key
                        ? "bg-white text-spa-ink font-semibold shadow-[0_1px_3px_rgba(31,42,38,0.15)]"
                        : "bg-transparent text-spa-text font-medium"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {rows.length === 0 ? (
            !isLoading && (
              <div className="border-[1.5px] border-dashed border-spa-border-strong rounded-[14px] px-6 py-9 text-center flex flex-col items-center gap-2">
                <div className="text-[17px] font-semibold">
                  {isNewGuest
                    ? "No appointments yet"
                    : "No upcoming appointments"}
                </div>
                <p className="m-0 max-w-110 text-[15px] leading-normal text-spa-muted">
                  {isNewGuest
                    ? "Once you book a treatment, it will show up here with the time and therapist."
                    : "Your past visits are in the Past tab. Book your next one whenever you are ready."}
                </p>
                <Link
                  to="/services"
                  className="inline-flex items-center min-h-11 px-5 mt-2.5 rounded-[10px] bg-spa-green text-white font-semibold text-[15px] no-underline hover:bg-spa-green-800"
                >
                  Book an appointment
                </Link>
              </div>
            )
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col">
              {rows.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                />
              ))}
            </ul>
          )}
        </section>

        {suggestions.length > 0 && (
          <section aria-labelledby="h-book" className="flex flex-col gap-4.5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 id="h-book" className="m-0 text-xl font-semibold">
                  {past.length
                    ? "Book again or try something new"
                    : "Popular with our guests"}
                </h2>
                <p className="mt-1 mb-0 text-[15px] text-spa-muted">
                  {past.length
                    ? "Based on your past visits."
                    : "A good place to start."}
                </p>
              </div>
              <Link
                to="/services"
                className="inline-flex items-center min-h-11 text-[15px] font-semibold text-spa-green no-underline hover:text-spa-green-800"
              >
                See all services
              </Link>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
              {suggestions.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  color={TILE_COLORS[index % TILE_COLORS.length]}
                />
              ))}
            </div>
          </section>
        )}

        {isNewGuest && !isLoading && !appointmentsQuery.isError && (
          <section aria-labelledby="h-how" className="flex flex-col gap-4.5">
            <h2 id="h-how" className="m-0 text-xl font-semibold">
              How booking works
            </h2>
            <ol className="list-none m-0 p-0 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="bg-white border border-spa-line rounded-2xl px-6 py-5.5 flex flex-col gap-2"
                >
                  <span
                    aria-hidden="true"
                    className="w-9 h-9 rounded-full bg-spa-green-50 text-spa-green-800 inline-flex items-center justify-center font-semibold"
                  >
                    {index + 1}
                  </span>
                  <div className="font-semibold text-[17px]">{step.title}</div>
                  <div className="text-sm text-spa-muted leading-normal">
                    {step.text}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </Layout>
  );
};

function NextAppointment({
  appointment,
  imageUrl,
}: {
  appointment: AppointmentItem;
  imageUrl?: string;
}) {
  return (
    <section
      aria-labelledby="h-next"
      className="bg-spa-green text-white rounded-[18px] p-8 flex flex-wrap gap-7 box-border"
    >
      <div
        aria-hidden="true"
        className="w-45 min-h-50 flex-none rounded-[14px] bg-white/15 flex items-center justify-center overflow-hidden"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <LeafIcon size={44} />
        )}
      </div>
      <div className="flex-[1_1_280px] min-w-0 flex flex-col gap-3.5">
        <div className="text-[13px] font-semibold tracking-[0.06em] uppercase text-spa-green-50">
          Next appointment
        </div>
        <h2
          id="h-next"
          className="m-0 text-[30px] leading-tight font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {appointment.serviceName}
        </h2>
        <div className="text-lg font-semibold">
          {fullWhen(appointment.startAt)}
        </div>
        <ul className="list-none m-0 p-0 flex flex-col gap-2 text-[15px] text-[#F0F6F3]">
          <li className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="w-7 h-7 rounded-full bg-white text-spa-green-800 inline-flex items-center justify-center font-semibold text-[11px]"
            >
              {initialsOf(appointment.employeeName)}
            </span>
            With {appointment.employeeName}
          </li>
          <li>
            {appointment.durationMinutes} minutes ·{" "}
            {formatPrice(appointment.price)}
          </li>
        </ul>
        <div className="flex flex-wrap gap-2.5 mt-auto pt-2">
          <button
            type="button"
            onClick={() => downloadCalendarEvent(appointment)}
            className="min-h-11 px-5 rounded-[10px] border-[1.5px] border-white bg-transparent text-white text-[15px] font-semibold cursor-pointer hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Add to calendar
          </button>
        </div>
      </div>
    </section>
  );
}

function WelcomeCard({
  isNewGuest,
  lastVisit,
}: {
  isNewGuest: boolean;
  lastVisit?: AppointmentItem;
}) {
  return (
    <section
      aria-labelledby="h-empty"
      className="bg-white border border-spa-line rounded-[18px] p-10 flex flex-wrap items-center gap-8 box-border"
    >
      <div
        aria-hidden="true"
        className="w-40 h-40 flex-none rounded-full bg-spa-green-50 text-spa-green flex items-center justify-center"
      >
        <svg
          width="76"
          height="76"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M8 3v4M16 3v4M3.5 10h17" />
          <path d="M12 13v5M9.5 15.5h5" />
        </svg>
      </div>
      <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-3.5">
        <h2
          id="h-empty"
          className="m-0 text-[30px] leading-tight font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {isNewGuest
            ? "Your first treatment is a few taps away"
            : "Ready for your next treatment?"}
        </h2>
        <p className="m-0 text-base leading-normal text-spa-text">
          Choose a service, pick a time with one of our therapists, and we will
          take care of the rest.
        </p>
        {lastVisit && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 bg-spa-canvas rounded-xl">
            <span
              aria-hidden="true"
              className="w-9 h-9 rounded-full bg-spa-green-50 text-spa-green-800 inline-flex items-center justify-center font-semibold text-xs"
            >
              {initialsOf(lastVisit.employeeName)}
            </span>
            <div className="flex-[1_1_200px] min-w-0">
              <div className="text-[13px] text-spa-muted">
                Your last visit, {dayAndMonth(lastVisit.startAt)}
              </div>
              <div className="text-[15px] font-semibold">
                {lastVisit.serviceName} with {lastVisit.employeeName}
              </div>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center min-h-11 px-4.5 rounded-[10px] border-[1.5px] border-spa-green bg-white text-spa-green-800 text-[15px] font-semibold no-underline hover:bg-spa-green-50"
            >
              Book it again
            </Link>
          </div>
        )}
        <div className="flex flex-wrap gap-3 pt-1.5">
          <Link to="/services" className={primaryLink}>
            <BookIcon />
            Book an appointment
          </Link>
          <Link
            to="/services"
            className="inline-flex items-center min-h-12 px-5.5 rounded-xl border border-spa-border-strong bg-white text-spa-ink font-medium text-base no-underline hover:bg-spa-canvas"
          >
            Browse services
          </Link>
        </div>
      </div>
    </section>
  );
}

function AppointmentRow({ appointment }: { appointment: AppointmentItem }) {
  const isUpcoming = appointment.status === "UPCOMING";
  return (
    <li className="flex flex-wrap items-center gap-x-5 gap-y-3.5 py-4 border-t border-spa-divider first:border-t-0">
      <div className="w-15 flex-none text-center bg-spa-canvas rounded-xl py-2">
        <div className="text-xs font-semibold text-spa-muted uppercase">
          {monthShort(appointment.startAt)}
        </div>
        <div
          className="text-2xl font-semibold leading-[1.1]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {dayOfMonth(appointment.startAt)}
        </div>
      </div>
      <div className="flex-[1_1_240px] min-w-0">
        <div className="font-semibold text-base">{appointment.serviceName}</div>
        <div className="text-sm text-spa-muted mt-0.75">
          {weekdayAndTime(appointment.startAt)} · with{" "}
          {appointment.employeeName} · {appointment.durationMinutes} min ·{" "}
          {formatPrice(appointment.price)}
        </div>
      </div>
      <span
        className={`px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap ${
          isUpcoming
            ? "bg-spa-green-50 text-spa-green-800"
            : "bg-spa-divider text-spa-text"
        }`}
      >
        {isUpcoming ? "Confirmed" : "Completed"}
      </span>
      <div className="flex flex-wrap gap-2">
        {isUpcoming ? (
          <button
            type="button"
            onClick={() => downloadCalendarEvent(appointment)}
            className={secondaryButton}
          >
            Add to calendar
          </button>
        ) : (
          <Link
            to="/services"
            className="inline-flex items-center min-h-11 px-4 rounded-[10px] bg-spa-green text-white text-sm font-semibold no-underline hover:bg-spa-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
          >
            Book again
          </Link>
        )}
      </div>
    </li>
  );
}

function ServiceCard({
  service,
  color,
}: {
  service: ServiceItem;
  color: { bg: string; fg: string };
}) {
  return (
    <article className="bg-white border border-spa-line rounded-2xl overflow-hidden flex flex-col">
      <div
        aria-hidden="true"
        className="h-35 flex items-center justify-center"
        style={{ background: color.bg, color: color.fg }}
      >
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <LeafIcon size={36} />
        )}
      </div>
      <div className="px-5 pt-4.5 pb-5 flex flex-col gap-1.5 flex-1">
        <h3 className="m-0 text-[17px] font-semibold">{service.name}</h3>
        {service.description && (
          <p className="m-0 text-sm text-spa-muted leading-snug line-clamp-2">
            {service.description}
          </p>
        )}
        <div className="text-sm font-semibold mt-1">
          {service.durationMinutes} min · {formatPrice(service.price)}
        </div>
        <Link
          to="/services"
          className="mt-auto inline-flex items-center justify-center min-h-11 px-4 rounded-[10px] border-[1.5px] border-spa-green bg-white text-spa-green-800 text-[15px] font-semibold no-underline hover:bg-spa-green-50"
        >
          Book
        </Link>
      </div>
    </article>
  );
}

export default CustomerDashboard;
