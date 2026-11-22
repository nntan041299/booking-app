import { ReactNode, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { signOut } from "@/service/auth";
import { useAuth } from "@/context/AuthProvider";
import { selectUser } from "@/redux/user/selectors";
import { useClickOutside } from "@/hook/useClickOutside";

const MenuIcon = ({ children }: { children: ReactNode }) => (
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

const itemClass =
  "w-full flex items-center gap-3 min-h-11 px-3 rounded-lg text-[15px] font-medium text-left no-underline " +
  "transition-colors duration-150 cursor-pointer hover:bg-spa-hover " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green";

/** The avatar button with the account dropdown (edit profile, my appointments, sign out). */
export default function AccountMenu() {
  const { firstName, lastName, email, avatarUrl, role } =
    useSelector(selectUser);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { removeToken } = useAuth();

  const { mutate: handleSignOut, isPending } = useMutation({
    mutationFn: signOut,
    onSuccess: () => removeToken(),
    onError: () => removeToken(),
  });

  useClickOutside(dropdownRef, () => setOpen(false));

  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : firstName
        ? firstName[0].toUpperCase()
        : "?";

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "User";
  const isAdmin = role === "ADMIN";

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group flex items-center justify-center w-12 h-12 rounded-full cursor-pointer
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
        aria-label={`Account menu for ${fullName}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          className={`flex items-center justify-center w-10 h-10 rounded-full overflow-hidden text-sm font-semibold
                      ${isAdmin ? "bg-spa-green-50 text-spa-green-800" : "bg-spa-sand text-spa-sand-ink"}
                      ${open ? "shadow-[0_0_0_3px_#CFE3DA]" : ""}`}
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-[264px] box-border bg-white border border-spa-line
                     rounded-xl shadow-[0_12px_32px_rgba(31,42,38,0.16)] p-1.5 flex flex-col gap-0.5 text-spa-ink"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <div className="px-2.5 pt-2.5 pb-3 mb-1 border-b border-spa-divider">
            <p className="text-[15px] font-semibold truncate">{fullName}</p>
            {email && (
              <p className="text-[13px] text-spa-muted mt-0.5 truncate">
                {email}
              </p>
            )}
          </div>

          <Link
            to="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <MenuIcon>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
            </MenuIcon>
            Edit profile
          </Link>

          {!isAdmin && (
            <Link
              to="/"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <MenuIcon>
                <rect x="4" y="5" width="16" height="15" rx="2.5" />
                <path d="M8 3v4M16 3v4M4 10h16" />
              </MenuIcon>
              My appointments
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => handleSignOut()}
            disabled={isPending}
            className={`${itemClass} text-spa-danger disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <MenuIcon>
              <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" />
            </MenuIcon>
            {isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
