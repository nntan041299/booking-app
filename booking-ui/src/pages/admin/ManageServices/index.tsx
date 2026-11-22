import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Layout from "@/layouts/Layout";
import Dropdown from "@/components/Dropdown";
import Loading from "@/components/Loading";
import Pagination from "@/components/Pagination";
import StatusChip from "@/components/StatusChip";
import { selectUser } from "@/redux/user/selectors";
import {
  searchAdminServices,
  updateService,
  type ServiceItem,
} from "@/service/catalog";
import { getErrorMessage } from "@/rest";

type StatusFilter = "all" | "active" | "inactive";

const STATUS_TO_ACTIVE: Record<StatusFilter, boolean | undefined> = {
  all: undefined,
  active: true,
  inactive: false,
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const PAGE_SIZE_OPTIONS = [6, 12, 24].map((n) => ({
  value: String(n),
  label: String(n),
}));

const SEARCH_DEBOUNCE_MS = 300;

// Tile colors from the design, cycled per row.
const TILE_COLORS = [
  { bg: "#E3EEE9", fg: "#1F4238" },
  { bg: "#F3E3D6", fg: "#6B3A1E" },
  { bg: "#E1E8F3", fg: "#27415F" },
  { bg: "#F1E1E6", fg: "#6A2B3E" },
  { bg: "#ECE8D3", fg: "#4F4719" },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);

const ManageServices = () => {
  const queryClient = useQueryClient();
  const { id, role } = useSelector(selectUser);

  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(6);
  const searchTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-services", search, status, page, size],
    queryFn: () =>
      searchAdminServices({
        keyword: search,
        active: STATUS_TO_ACTIVE[status],
        page,
        size,
      }),
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };

  // Activate or deactivate straight from the list. Deactivating hides the
  // service from guests; its details and past bookings are kept.
  const {
    mutate: toggleActive,
    isPending: isToggling,
    variables: toggling,
    isError: isToggleError,
    error: toggleError,
  } = useMutation({
    mutationFn: (service: ServiceItem) =>
      updateService(service.id, {
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        active: !service.active,
      }),
    onSuccess: refresh,
  });

  // The user is fetched by Layout; wait for it before deciding access.
  if (id && role !== "ADMIN") return <Navigate to="/" replace />;

  const handleKeyword = (value: string) => {
    setKeyword(value);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setPage(0);
      setSearch(value.trim());
    }, SEARCH_DEBOUNCE_MS);
  };

  return (
    <Layout>
      <Loading isLoading={isLoading} />
      <div
        className="px-4 md:px-12 py-8 md:py-10 flex flex-col gap-7 text-spa-ink"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className="m-0 text-4xl font-semibold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Services
            </h1>
            <p className="mt-1.5 text-[15px] text-spa-muted">
              The treatments guests can book, with their length and price.
            </p>
          </div>
          <Link
            to="/admin/services/new"
            className="inline-flex items-center gap-2 min-h-11 px-5 rounded-[10px] bg-spa-green text-white text-[15px] font-semibold no-underline
                       hover:bg-spa-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add service
          </Link>
        </header>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 basis-70 flex flex-col gap-1.5">
            <label
              htmlFor="service-search"
              className="text-[13px] font-medium text-spa-text"
            >
              Search
            </label>
            <input
              id="service-search"
              type="search"
              value={keyword}
              onChange={(e) => handleKeyword(e.target.value)}
              placeholder="Search by service name"
              className="h-11 box-border px-3.5 rounded-[10px] border border-spa-border-strong bg-white text-[15px] placeholder:text-spa-muted
                         focus:outline-2 focus:outline-offset-2 focus:outline-spa-green"
            />
          </div>
          <div className="flex flex-col gap-1.5 basis-50 min-w-0">
            <span
              id="service-status-label"
              className="text-[13px] font-medium text-spa-text"
            >
              Status
            </span>
            <Dropdown
              id="service-status"
              labelId="service-status-label"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(v) => {
                setStatus(v as StatusFilter);
                setPage(0);
              }}
            />
          </div>
        </div>

        {isToggleError && (
          <p role="alert" className="m-0 text-sm text-spa-danger">
            {getErrorMessage(toggleError)}
          </p>
        )}

        {isLoading ? null : isError ? (
          <p className="text-sm text-spa-danger">Could not load services.</p>
        ) : !data?.content.length ? (
          <p className="text-sm text-spa-muted">No services found.</p>
        ) : (
          <>
            <div className="bg-white rounded-[14px] border border-spa-line overflow-x-auto">
              <table className="w-full min-w-215 border-collapse text-sm text-left">
                <thead className="text-[13px] text-spa-muted">
                  <tr>
                    <th
                      scope="col"
                      className="px-5 py-3.5 font-medium border-b border-spa-line"
                    >
                      Service
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 font-medium border-b border-spa-line"
                    >
                      Duration
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 font-medium border-b border-spa-line"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 font-medium border-b border-spa-line"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3.5 font-medium border-b border-spa-line text-right"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((service, index) => {
                    const color = TILE_COLORS[index % TILE_COLORS.length];
                    return (
                      <tr key={service.id}>
                        <td
                          className={`px-5 py-4 border-b border-spa-divider ${service.active ? "" : "opacity-55"}`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              aria-hidden="true"
                              className="w-[72px] h-[72px] rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                              style={{ background: color.bg, color: color.fg }}
                            >
                              {service.imageUrl ? (
                                <img
                                  src={service.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <svg
                                  width="28"
                                  height="28"
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
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[15px]">
                                  {service.name}
                                </span>
                              </div>
                              {service.description && (
                                <div className="mt-0.5 max-w-90 text-spa-muted truncate">
                                  {service.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td
                          className={`px-3 py-4 border-b border-spa-divider whitespace-nowrap ${service.active ? "" : "opacity-55"}`}
                        >
                          {service.durationMinutes} min
                        </td>
                        <td
                          className={`px-3 py-4 border-b border-spa-divider font-semibold whitespace-nowrap ${service.active ? "" : "opacity-55"}`}
                        >
                          {formatPrice(service.price)}
                        </td>
                        <td className="px-3 py-4 border-b border-spa-divider whitespace-nowrap">
                          <StatusChip active={service.active} />
                        </td>
                        <td className="px-5 py-4 border-b border-spa-divider text-right whitespace-nowrap">
                          <Link
                            to={`/admin/services/${service.id}`}
                            state={{ service }}
                            aria-label={`Edit ${service.name}`}
                            className="inline-flex items-center min-h-11 px-3.5 mr-2 rounded-[10px] border border-spa-border-strong bg-white text-spa-ink font-medium no-underline hover:bg-spa-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            aria-label={`${service.active ? "Deactivate" : "Activate"} ${service.name}`}
                            disabled={isToggling && toggling?.id === service.id}
                            onClick={() => toggleActive(service)}
                            className={`min-h-11 min-w-28 px-3.5 text-center rounded-[10px] border font-medium cursor-pointer
                                        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        ${
                                          service.active
                                            ? "border-spa-border-strong bg-white text-spa-ink hover:bg-spa-canvas"
                                            : "border-spa-green bg-spa-green text-white hover:bg-spa-green-800"
                                        }`}
                          >
                            {service.active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <p className="m-0 text-sm text-spa-muted">
                  Showing {data.number * size + 1} to{" "}
                  {data.number * size + data.content.length} of{" "}
                  {data.totalElements} services
                </p>
                <div className="flex items-center gap-2">
                  <span
                    id="service-page-size-label"
                    className="text-sm text-spa-muted"
                  >
                    Rows per page
                  </span>
                  <Dropdown
                    id="service-page-size"
                    labelId="service-page-size-label"
                    value={String(size)}
                    options={PAGE_SIZE_OPTIONS}
                    onChange={(v) => {
                      setSize(Number(v));
                      setPage(0);
                    }}
                    openUp
                    className="min-w-21 !px-3 text-sm"
                    menuWidth="w-35"
                  />
                </div>
              </div>
              <Pagination
                page={data.number}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ManageServices;
