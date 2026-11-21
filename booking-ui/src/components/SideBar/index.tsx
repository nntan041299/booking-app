import { ReactNode } from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { selectUser } from "@/redux/user/selectors";

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  /** Only show the item to users with this role; shown to everyone when omitted. */
  role?: string;
}

const NavIcon = ({ children }: { children: ReactNode }) => (
  <svg
    aria-hidden="true"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="flex-shrink-0"
  >
    {children}
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    path: "/",
    label: "Dashboard",
    icon: (
      <NavIcon>
        <rect x="3.5" y="3.5" width="7" height="8" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
        <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
        <rect x="3.5" y="14.5" width="7" height="6" rx="1.5" />
      </NavIcon>
    ),
  },
  {
    path: "/admin/employees",
    label: "Employees",
    role: "ADMIN",
    icon: (
      <NavIcon>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
        <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.4c2 .7 3.5 2.6 3.5 5.6" />
      </NavIcon>
    ),
  },
  {
    path: "/admin/services",
    label: "Services",
    role: "ADMIN",
    icon: (
      <NavIcon>
        <path d="M12 21c-4.5-2-7-5.5-7-9.5C5 8 7.5 5 12 3c4.5 2 7 5 7 8.5 0 4-2.5 7.5-7 9.5z" />
        <path d="M12 8v13" />
      </NavIcon>
    ),
  },
];

interface SideBarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function SideBar({ open, onClose }: SideBarProps) {
  const { role } = useSelector(selectUser);
  const navItems = NAV_ITEMS.filter((item) => !item.role || item.role === role);

  const sidebarContent = (
    <aside
      aria-label="Admin"
      className="w-[260px] h-full flex flex-col flex-shrink-0 gap-7 bg-white border-r border-spa-line px-4 py-7 select-none"
    >
      {/* Brand */}
      <div className="flex items-start justify-between px-3">
        <div>
          <div
            className="text-[22px] font-semibold leading-tight text-spa-ink"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Spa Admin
          </div>
          <div className="text-[13px] text-spa-muted mt-0.5">
            Booking console
          </div>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden text-spa-muted hover:text-spa-ink transition-colors p-1 cursor-pointer"
            aria-label="Close menu"
          >
            <i className="pi pi-times text-base" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main"
        className="flex flex-col gap-1 overflow-y-auto"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {navItems.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            end
            onClick={() => onClose?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-[10px] text-[15px] no-underline
               transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
               ${
                 isActive
                   ? "bg-spa-green-50 text-spa-green font-semibold"
                   : "text-spa-text font-medium hover:bg-spa-canvas"
               }`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">{sidebarContent}</div>

      {/* Mobile drawer */}
      {open !== undefined && (
        <>
          {/* Backdrop */}
          <div
            className={`
              fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden
              ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
            `}
            onClick={onClose}
          />
          {/* Drawer */}
          <div
            className={`
              fixed inset-y-0 left-0 z-50 flex h-full transition-transform duration-300 md:hidden
              ${open ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
