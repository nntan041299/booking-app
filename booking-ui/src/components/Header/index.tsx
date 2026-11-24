import AccountMenu from "@/components/AccountMenu";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="min-h-[72px] bg-white border-b border-spa-line flex items-center justify-between gap-4 px-4 md:px-12 flex-shrink-0">
      <div className="flex items-center gap-2">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-[10px] text-spa-text
                     hover:bg-spa-canvas transition-colors duration-150 cursor-pointer
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
          aria-label="Open menu"
        >
          <i className="pi pi-bars text-base" />
        </button>

        {/* Brand */}
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
      </div>

      <AccountMenu />
    </header>
  );
}
