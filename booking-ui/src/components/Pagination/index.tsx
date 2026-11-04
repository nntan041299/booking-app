interface PaginationProps {
  /** Zero-based current page index */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const pageButton =
  "min-w-9 h-9 px-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed";
const arrowButton = `${pageButton} text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:hover:bg-transparent`;

// Zero-based page indexes with "..." gaps, e.g. 0 ... 4 5 6 ... 19
const getPageItems = (current: number, total: number) => {
  const pages = new Set([0, total - 1, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((n) => n >= 0 && n < total)
    .sort((a, b) => a - b);
  const items: (number | "...")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) items.push("...");
    items.push(n);
  });
  return items;
};

const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1"
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        className={arrowButton}
      >
        <i className="pi pi-chevron-left text-xs" />
      </button>
      {getPageItems(page, totalPages).map((item, i) =>
        item === "..." ? (
          <span key={`gap-${i}`} className="px-1 text-surface-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={`${pageButton} ${
              item === page
                ? "bg-surface-900 text-white"
                : "text-surface-600 hover:bg-surface-100"
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
        className={arrowButton}
      >
        <i className="pi pi-chevron-right text-xs" />
      </button>
    </nav>
  );
};

export default Pagination;
