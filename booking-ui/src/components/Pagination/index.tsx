interface PaginationProps {
  /** Zero-based current page index */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const base =
  "inline-flex items-center justify-center gap-1 min-w-11 min-h-11 px-3.5 box-border rounded-[10px] text-sm font-medium " +
  "transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green " +
  "disabled:cursor-not-allowed";
const edgeButton = `${base} border border-spa-border-strong bg-white text-spa-ink hover:bg-spa-canvas disabled:border-spa-line disabled:bg-spa-canvas disabled:text-spa-muted disabled:hover:bg-spa-canvas`;

// Zero-based page indexes with "..." gaps, e.g. 0 1 2 ... 8 or 0 ... 4 5 6 ... 19.
// Always shows the first and last page and the current page with its neighbours;
// near either end it shows three pages so it reads "1 2 3 … 9" like the design.
const getPageItems = (current: number, total: number) => {
  const pages = new Set([0, total - 1, current - 1, current, current + 1]);
  if (current <= 1) [0, 1, 2].forEach((n) => pages.add(n));
  if (current >= total - 2)
    [total - 3, total - 2, total - 1].forEach((n) => pages.add(n));

  const sorted = [...pages]
    .filter((n) => n >= 0 && n < total)
    .sort((a, b) => a - b);
  const items: (number | "...")[] = [];
  sorted.forEach((n, i) => {
    const prev = sorted[i - 1];
    // A gap of exactly one page is shown as that page instead of "…".
    if (i > 0 && n - prev === 2) items.push(prev + 1);
    else if (i > 0 && n - prev > 2) items.push("...");
    items.push(n);
  });
  return items;
};

const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center gap-1.5"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        className={edgeButton}
      >
        <i className="pi pi-chevron-left text-xs" />
        Prev
      </button>
      {getPageItems(page, totalPages).map((item, i) =>
        item === "..." ? (
          <span key={`gap-${i}`} className="px-1.5 text-spa-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={
              item === page
                ? `Page ${item + 1}, current page`
                : `Page ${item + 1}`
            }
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={`${base} ${
              item === page
                ? "bg-spa-green text-white font-semibold"
                : "border border-spa-border-strong bg-white text-spa-ink hover:bg-spa-canvas"
            }`}
          >
            {item + 1}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="Next page"
        disabled={page + 1 >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={edgeButton}
      >
        Next
        <i className="pi pi-chevron-right text-xs" />
      </button>
    </nav>
  );
};

export default Pagination;
