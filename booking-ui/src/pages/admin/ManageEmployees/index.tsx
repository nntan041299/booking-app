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
import Button from "@/components/Button";
import Dropdown from "@/components/Dropdown";
import Loading from "@/components/Loading";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import { selectUser } from "@/redux/user/selectors";
import { searchAdminServices } from "@/service/catalog";
import {
  removeEmployee,
  searchEmployees,
  type EmployeeItem,
} from "@/service/employee";
import { getErrorMessage } from "@/rest";
import { DAYS, toTimeInput } from "./constants";

const ALL_SERVICES = "all";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50].map((n) => ({
  value: String(n),
  label: String(n),
}));

const SEARCH_DEBOUNCE_MS = 300;

// Avatar colors from the design, cycled per row.
const AVATAR_COLORS = [
  { bg: "#E3EEE9", fg: "#1F4238" },
  { bg: "#F3E3D6", fg: "#6B3A1E" },
  { bg: "#E1E8F3", fg: "#27415F" },
  { bg: "#F1E1E6", fg: "#6A2B3E" },
  { bg: "#ECE8D3", fg: "#4F4719" },
];

const initialsOf = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

/** "Mon to Fri" for a run of 3+ consecutive days, otherwise "Mon, Wed, Fri". */
const workingDaysSummary = (employee: EmployeeItem) => {
  const days = new Set(employee.workingHours.map((h) => h.dayOfWeek));
  if (days.size === 0) return "Not set";
  const selected = DAYS.filter((d) => days.has(d.value));
  const short = selected.map((d) => d.label.slice(0, 3));
  const first = selected[0].value;
  const last = selected[selected.length - 1].value;
  const contiguous = last - first + 1 === selected.length;
  return contiguous && selected.length >= 3
    ? `${short[0]} to ${short[short.length - 1]}`
    : short.join(", ");
};

const workingHoursSummary = (employee: EmployeeItem) => {
  const { workingHours } = employee;
  if (workingHours.length === 0) return null;
  const ranges = new Set(
    workingHours.map(
      (h) => `${toTimeInput(h.startTime)} to ${toTimeInput(h.endTime)}`,
    ),
  );
  return ranges.size === 1 ? [...ranges][0] : "Hours vary by day";
};

const fieldLabel = "text-[13px] font-medium text-spa-text";

const ManageEmployees = () => {
  const queryClient = useQueryClient();
  const { id, role } = useSelector(selectUser);

  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [service, setService] = useState(ALL_SERVICES);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [removing, setRemoving] = useState<EmployeeItem | null>(null);
  const searchTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  // TODO: paginate the service dropdown. For now this loads a single page of
  // up to 100 services (the backend's maximum page size), so any services
  // beyond the first 100 cannot be picked as a filter. Switch to loading more
  // on scroll or on search once the catalog grows past that.
  const { data: servicePage } = useQuery({
    queryKey: ["admin-services", "filter"],
    queryFn: () => searchAdminServices({ active: true, size: 100 }),
  });
  const serviceOptions = [
    { value: ALL_SERVICES, label: "All services" },
    ...(servicePage?.content ?? []).map((s) => ({
      value: String(s.id),
      label: s.name,
    })),
  ];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-employees", search, service, page, size],
    queryFn: () =>
      searchEmployees({
        keyword: search,
        serviceId: service === ALL_SERVICES ? undefined : Number(service),
        page,
        size,
      }),
    placeholderData: keepPreviousData,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-employees"] });

  const {
    mutate: remove,
    isPending: isRemoving,
    isError: isRemoveError,
    error: removeError,
    reset: resetRemove,
  } = useMutation({
    mutationFn: (employee: EmployeeItem) => removeEmployee(employee.id),
    onSuccess: () => {
      setRemoving(null);
      refresh();
    },
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

  const closeRemove = () => {
    if (isRemoving) return;
    setRemoving(null);
    resetRemove();
  };

  return (
    <Layout>
      <Loading isLoading={isLoading || isRemoving} />
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
              Employees
            </h1>
            <p className="mt-1.5 text-[15px] text-spa-muted">
              Manage your team, the services they perform and when they work.
            </p>
          </div>
          <Link
            to="/admin/employees/new"
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
            Add employee
          </Link>
        </header>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 basis-70 flex flex-col gap-1.5">
            <label htmlFor="employee-search" className={fieldLabel}>
              Search
            </label>
            <input
              id="employee-search"
              type="search"
              value={keyword}
              onChange={(e) => handleKeyword(e.target.value)}
              placeholder="Search by name"
              className="h-11 box-border px-3.5 rounded-[10px] border border-spa-border-strong bg-white text-[15px] placeholder:text-spa-muted
                         focus:outline-2 focus:outline-offset-2 focus:outline-spa-green"
            />
          </div>
          <div className="flex flex-col gap-1.5 basis-55 min-w-0">
            <span id="employee-service-label" className={fieldLabel}>
              Service
            </span>
            <Dropdown
              id="employee-service"
              labelId="employee-service-label"
              value={service}
              options={serviceOptions}
              onChange={(v) => {
                setService(v);
                setPage(0);
              }}
              searchable
              menuWidth="w-75"
            />
          </div>
        </div>

        {isLoading ? null : isError ? (
          <p className="text-sm text-spa-danger">Could not load employees.</p>
        ) : !data?.content.length ? (
          <p className="text-sm text-spa-muted">No employees found.</p>
        ) : (
          <>
            <div className="bg-white rounded-[14px] border border-spa-line overflow-x-auto">
              <table className="w-full min-w-180 border-collapse text-sm text-left">
                <thead className="text-[13px] text-spa-muted">
                  <tr>
                    <th
                      scope="col"
                      className="px-5 py-3.5 font-medium border-b border-spa-line"
                    >
                      Employee
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 font-medium border-b border-spa-line"
                    >
                      Working hours
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
                  {data.content.map((employee, index) => {
                    const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
                    const hours = workingHoursSummary(employee);
                    return (
                      <tr key={employee.id}>
                        <td className="px-5 py-4 border-b border-spa-divider">
                          <div className="flex items-center gap-3.5">
                            <div
                              aria-hidden="true"
                              className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-[15px] font-semibold"
                              style={{ background: color.bg, color: color.fg }}
                            >
                              {employee.avatarUrl ? (
                                <img
                                  src={employee.avatarUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                initialsOf(employee.fullName)
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[15px]">
                                  {employee.fullName}
                                </span>
                                {!employee.active && (
                                  <span className="px-2 py-0.5 rounded-full bg-spa-divider text-spa-text text-xs font-semibold">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              {employee.bio && (
                                <div className="mt-0.5 max-w-70 text-spa-muted truncate">
                                  {employee.bio}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 border-b border-spa-divider text-spa-text">
                          <div className="font-medium">
                            {workingDaysSummary(employee)}
                          </div>
                          {hours && (
                            <div className="mt-0.5 text-spa-muted">{hours}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 border-b border-spa-divider text-right whitespace-nowrap">
                          <Link
                            to={`/admin/employees/${employee.id}`}
                            state={{ employee }}
                            aria-label={`Edit ${employee.fullName}`}
                            className="inline-flex items-center min-h-11 px-3.5 mr-2 rounded-[10px] border border-spa-border-strong bg-white text-spa-ink font-medium no-underline hover:bg-spa-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            aria-label={`Remove ${employee.fullName}`}
                            disabled={!employee.active}
                            onClick={() => setRemoving(employee)}
                            className="min-h-11 px-3.5 rounded-[10px] border border-spa-danger-line bg-white text-spa-danger font-medium cursor-pointer hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                          >
                            Remove
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
                  {data.totalElements} employees
                </p>
                <div className="flex items-center gap-2">
                  <span
                    id="employee-page-size-label"
                    className="text-sm text-spa-muted"
                  >
                    Rows per page
                  </span>
                  <Dropdown
                    id="employee-page-size"
                    labelId="employee-page-size-label"
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

      {removing && (
        <Modal title="Remove employee" onClose={closeRemove}>
          <div className="space-y-4">
            <p
              className="text-sm text-surface-700"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Remove <strong>{removing.fullName}</strong>? They will no longer
              be bookable and their account will be disabled. Existing
              appointments are kept, and you can restore them later by editing
              them and marking them active.
            </p>
            {isRemoveError && (
              <p className="text-sm text-red-500">
                {getErrorMessage(removeError)}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={closeRemove}
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button onClick={() => remove(removing)} disabled={isRemoving}>
                {isRemoving ? "Removing…" : "Remove"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default ManageEmployees;
