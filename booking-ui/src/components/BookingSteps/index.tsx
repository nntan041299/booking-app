const STEPS = ["Service", "Choose a time", "Confirm"];

const Check = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

interface BookingStepsProps {
  /** 1-based step the customer is on. */
  current: 2 | 3;
}

/** The three booking steps; earlier steps show a check mark. */
export default function BookingSteps({ current }: BookingStepsProps) {
  return (
    <ol
      aria-label="Booking steps"
      className="list-none m-0 p-0 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold"
    >
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={`flex items-center gap-2.5 ${
              done
                ? "text-spa-green-800"
                : active
                  ? "text-spa-ink"
                  : "text-spa-muted font-medium"
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-[13px] ${
                done
                  ? "bg-spa-green-50"
                  : active
                    ? "bg-spa-green text-white"
                    : "border-[1.5px] border-spa-border-strong"
              }`}
            >
              {done ? <Check /> : step}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
