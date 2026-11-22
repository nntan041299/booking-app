import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import AccountMenu from "@/components/AccountMenu";

interface CustomerLayoutProps {
  children: ReactNode;
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center min-h-11 px-3.5 rounded-[10px] text-[15px] no-underline transition-colors duration-150
   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green ${
     isActive
       ? "bg-spa-green-50 text-spa-green font-semibold"
       : "text-spa-text font-medium hover:bg-spa-hover"
   }`;

/** The customer app shell: a top bar with the main links and the account menu. */
export default function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <div
      className="min-h-screen bg-spa-canvas text-spa-ink"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <header className="bg-white border-b border-spa-line">
        <div className="max-w-300 mx-auto px-4 md:px-8 min-h-18 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Spa Booking
          </div>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navClass}>
              My appointments
            </NavLink>
            <NavLink to="/services" className={navClass}>
              Services
            </NavLink>
            <div className="ml-2">
              <AccountMenu />
            </div>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
