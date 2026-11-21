interface InactiveBannerProps {
  message: string;
  buttonLabel: string;
  onActivate: () => void;
  pending?: boolean;
  error?: string;
}

/** Shown at the top of an edit page when the record is inactive. */
export default function InactiveBanner({
  message,
  buttonLabel,
  onActivate,
  pending,
  error,
}: InactiveBannerProps) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 px-5 py-4 border border-spa-inactive-line bg-spa-divider rounded-xl"
    >
      <div className="flex items-center gap-3 flex-1 basis-80">
        <span
          aria-hidden="true"
          className="w-2.5 h-2.5 rounded-full bg-spa-inactive-dot flex-shrink-0"
        />
        <span className="text-[15px] text-spa-text">
          {message}
          {error && (
            <span role="alert" className="block mt-1 text-sm text-spa-danger">
              {error}
            </span>
          )}
        </span>
      </div>
      <button
        type="button"
        onClick={onActivate}
        disabled={pending}
        className="min-h-11 px-[22px] rounded-[10px] bg-spa-green text-white font-semibold cursor-pointer hover:bg-spa-green-800
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Activating…" : buttonLabel}
      </button>
    </div>
  );
}
