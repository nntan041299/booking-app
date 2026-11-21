import { useRef, useState } from "react";
import { useClickOutside } from "@/hook/useClickOutside";

export interface DropdownOption {
  value: string;
  label: string;
  /** Small muted text on the right of the option. */
  hint?: string;
}

interface DropdownProps {
  id: string;
  /** id of the element that labels this dropdown. */
  labelId: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  /** Show a search box above the options. */
  searchable?: boolean;
  /** Open the menu above the button instead of below. */
  openUp?: boolean;
  /** Extra classes for the trigger button, e.g. a min width or font size. */
  className?: string;
  /** Tailwind width class for the menu. Defaults to the trigger width so it never overflows the page. */
  menuWidth?: string;
  disabled?: boolean;
}

export default function Dropdown({
  id,
  labelId,
  value,
  options,
  onChange,
  searchable = false,
  openUp = false,
  className = "",
  menuWidth = "w-full",
  disabled,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  useClickOutside(rootRef, close);

  const selected = options.find((o) => o.value === value);
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? options.filter((o) => o.label.toLowerCase().includes(needle))
    : options;

  const pick = (next: string) => {
    onChange(next);
    close();
    buttonRef.current?.focus();
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          close();
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${id}`}
        onClick={() => (open ? close() : setOpen(true))}
        className={`group w-full h-11 box-border flex items-center justify-between gap-3 px-3.5 rounded-[10px]
                    border bg-white text-[15px] text-spa-ink text-left cursor-pointer
                    ${open ? "border-spa-green" : "border-spa-border-strong hover:border-spa-dashed"}
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
                    disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3C4A44"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute left-0 z-40 ${menuWidth} max-w-[calc(100vw-32px)] box-border bg-white border border-spa-line
                      rounded-xl shadow-[0_12px_32px_rgba(31,42,38,0.16)] p-1.5 flex flex-col
                      ${openUp ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"}`}
        >
          {searchable && (
            <div className="relative px-0.5 pt-0.5 pb-1.5">
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5E6B65"
                strokeWidth="2"
                strokeLinecap="round"
                className="absolute left-3.5 top-1/2 -mt-[9px] pointer-events-none"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4 4" />
              </svg>
              <input
                type="search"
                aria-label="Search options"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                autoFocus
                className="w-full box-border h-10 pl-[38px] pr-3 rounded-lg border border-spa-border-strong bg-white text-sm
                           focus:outline-2 focus:outline-offset-2 focus:outline-spa-green"
              />
            </div>
          )}
          <ul className="list-none m-0 p-0 max-h-66 overflow-y-auto flex flex-col gap-0.5">
            {visible.map((o) => {
              const isSelected = o.value === value;
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => pick(o.value)}
                    className={`w-full min-h-11 px-2.5 flex items-center gap-2.5 rounded-lg text-[15px] font-medium text-left cursor-pointer
                                text-spa-ink hover:bg-spa-hover
                                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
                                ${isSelected ? "bg-spa-green-50" : "bg-transparent"}`}
                  >
                    <span className="w-5 h-5 flex-shrink-0 inline-flex items-center justify-center">
                      {isSelected && (
                        <svg
                          aria-hidden="true"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#1F4238"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 min-w-0 truncate" title={o.label}>
                      {o.label}
                    </span>
                    {o.hint && (
                      <span className="flex-shrink-0 text-[13px] font-normal text-spa-muted">
                        {o.hint}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {visible.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-spa-muted">
              Nothing matches your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
