import { ReactNode } from "react";
import Button from "@/components/Button";

interface SectionProps {
  id: string;
  title: string;
  description: string;
  /** Small pill shown in the header, e.g. "3 selected". */
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** A collapsible card, as in the design (native <details>). */
export function Section({
  id,
  title,
  description,
  badge,
  defaultOpen = false,
  children,
}: SectionProps) {
  return (
    <details
      open={defaultOpen}
      aria-labelledby={id}
      className="group bg-white border border-spa-line rounded-[14px]"
    >
      <summary
        className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-4 px-7 py-5 min-h-11
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green rounded-[14px]"
      >
        <div className="flex-1 min-w-0">
          <h2 id={id} className="m-0 text-lg font-semibold">
            {title}
          </h2>
          <p className="mt-1 text-sm text-spa-muted">{description}</p>
        </div>
        {badge && (
          <span className="text-[13px] font-semibold text-spa-green-800 bg-spa-green-50 px-3 py-1.5 rounded-full whitespace-nowrap">
            {badge}
          </span>
        )}
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3C4A44"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0 transition-transform duration-150 group-open:rotate-180"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="px-7 pt-6 pb-7 border-t border-spa-divider flex flex-col gap-5">
        {children}
      </div>
    </details>
  );
}

interface SectionFooterProps {
  /** True when the section differs from what is saved. */
  dirty: boolean;
  error?: string;
  /** Extra condition on saving, e.g. the form is valid. */
  valid?: boolean;
  saving: boolean;
  saveLabel: string;
  onDiscard: () => void;
  onSave: () => void;
}

export function SectionFooter({
  dirty,
  error,
  valid = true,
  saving,
  saveLabel,
  onDiscard,
  onSave,
}: SectionFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 pt-5 border-t border-spa-divider">
      {error ? (
        <span role="alert" className="text-sm font-medium text-spa-danger">
          {error}
        </span>
      ) : (
        <span className="text-sm text-spa-muted">
          {dirty
            ? "Unsaved changes. Save to apply them."
            : "All changes saved."}
        </span>
      )}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={onDiscard}
          disabled={!dirty || saving}
        >
          Discard
        </Button>
        <Button onClick={onSave} disabled={!dirty || !valid || saving}>
          {saving ? "Saving…" : saveLabel}
        </Button>
      </div>
    </div>
  );
}
