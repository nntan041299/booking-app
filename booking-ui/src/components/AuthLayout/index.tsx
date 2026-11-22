import { Link } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import spaMassage from "@/asset/image/spa-massage.jpg";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  /** Headline and text on the brand panel. */
  tagline: string;
  taglineText: string;
  /** Form column width: the register form is a little wider. */
  wide?: boolean;
  onGoogle: () => void;
  disabled?: boolean;
  /** "New here?" / "Already have an account?" and the link that follows it. */
  switchPrompt: string;
  switchLabel: string;
  switchTo: string;
  /** The form itself. */
  children: React.ReactNode;
}

const CHIPS = ["Massage", "Facials", "Body care", "Nails"];

// A spa massage photo under a green wash, so the text on top stays readable.
const PANEL_BACKGROUND = `linear-gradient(145deg, rgba(47, 93, 80, 0.5) 0%, rgba(31, 66, 56, 0.82) 100%), url(${spaMassage})`;

/** The sign in / register screen: a brand panel next to the form, plus Google sign-in. */
export default function AuthLayout({
  title,
  subtitle,
  tagline,
  taglineText,
  wide = false,
  onGoogle,
  disabled = false,
  switchPrompt,
  switchLabel,
  switchTo,
  children,
}: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex flex-wrap bg-spa-canvas text-spa-ink"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <aside
        className="flex-[1_1_440px] min-h-80 box-border px-8 py-10 md:px-16 md:py-14 flex flex-col justify-between gap-12 text-white bg-cover bg-[position:60%_center]"
        style={{ backgroundImage: PANEL_BACKGROUND }}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="w-11 h-11 rounded-full bg-white/15 inline-flex items-center justify-center"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21c-4.5-2-7-5.5-7-9.5C5 8 7.5 5 12 3c4.5 2 7 5 7 8.5 0 4-2.5 7.5-7 9.5z" />
              <path d="M12 8v13" />
            </svg>
          </span>
          <span
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Spa Booking
          </span>
        </div>

        <div className="max-w-105">
          <h2
            className="m-0 text-[40px] leading-[1.15] font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {tagline}
          </h2>
          <p className="mt-4 mb-0 text-base leading-relaxed text-[#d6e6df]">
            {taglineText}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {CHIPS.map((chip) => (
            <span
              key={chip}
              className="text-[13px] font-medium px-3.5 py-2 rounded-full bg-white/15"
            >
              {chip}
            </span>
          ))}
        </div>
      </aside>

      <main className="flex-[1_1_480px] box-border px-8 py-12 flex items-center justify-center">
        <div
          className={`w-full ${wide ? "max-w-120" : "max-w-105"} flex flex-col gap-6`}
        >
          <div>
            <h1
              className="m-0 text-[34px] font-semibold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {title}
            </h1>
            <p className="mt-2 mb-0 text-[15px] text-spa-muted">{subtitle}</p>
          </div>

          {children}

          <div className="flex items-center gap-3.5 text-[13px] text-spa-muted">
            <span className="flex-1 h-px bg-spa-line" />
            or
            <span className="flex-1 h-px bg-spa-line" />
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={disabled}
            className="w-full min-h-12 px-4 inline-flex items-center justify-center gap-2.5 rounded-[10px] border border-spa-border-strong bg-white text-spa-ink text-[15px] font-semibold cursor-pointer
                       hover:bg-spa-hover hover:border-spa-dashed
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaGoogle size={16} aria-hidden="true" />
            Continue with Google
          </button>

          <p className="m-0 text-center text-[15px] text-spa-muted">
            {switchPrompt}{" "}
            <Link
              to={switchTo}
              className="font-semibold text-spa-green no-underline hover:text-spa-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green rounded"
            >
              {switchLabel}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
