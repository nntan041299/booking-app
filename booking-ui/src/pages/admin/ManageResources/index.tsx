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
  searchResources,
  updateResource,
  type ResourceItem,
  type ResourceType,
} from "@/service/resource";
import { getErrorMessage } from "@/rest";

type StatusFilter = "all" | "active" | "inactive";
type TypeFilter = "all" | ResourceType;

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

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "ROOM", label: "Room" },
  { value: "EQUIPMENT", label: "Equipment" },
];

const TYPE_LABEL: Record<ResourceType, string> = {
  ROOM: "Room",
  EQUIPMENT: "Equipment",
};

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

const fieldLabel = "text-[13px] font-medium text-spa-text";

const ManageResources = () => {
  const queryClient = useQueryClient();
  const { id, role } = useSelector(selectUser);

  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(6);
  const searchTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-resources", search, type, status, page, size],
    queryFn: () =>
      searchResources({
        keyword: search,
        type: type === "all" ? undefined : type,
        active: STATUS_TO_ACTIVE[status],
        page,
        size,
      }),
    placeholderData: keepPreviousData,
  });

  // Activate or deactivate straight from the list. Deactivating makes the
  // resource unavailable for new bookings; its details are kept.
  const {
    mutate: toggleActive,
    isPending: isToggling,
    variables: toggling,
    isError: isToggleError,
    error: toggleError,
  } = useMutation({
    mutationFn: (resource: ResourceItem) =>
      updateResource(resource.id, {
        name: resource.name,
        type: resource.type,
        description: resource.description,
        active: !resource.active,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] }),
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
              Resources
            </h1>
            <p className="mt-1.5 text-[15px] text-spa-muted">
              Rooms and equipment that services need. One resource can serve
              many services.
            </p>
          </div>
          <Link
            to="/admin/resources/new"
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
            Add resource
          </Link>
        </header>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 basis-70 flex flex-col gap-1.5">
            <label htmlFor="resource-search" className={fieldLabel}>
              Search
            </label>
            <input
              id="resource-search"
              type="search"
              value={keyword}
              onChange={(e) => handleKeyword(e.target.value)}
              placeholder="Search by resource name"
              className="h-11 box-border px-3.5 rounded-[10px] border border-spa-border-strong bg-white text-[15px] placeholder:text-spa-muted
                         focus:outline-2 focus:outline-offset-2 focus:outline-spa-green"
            />
          </div>
          <div className="flex flex-col gap-1.5 basis-55 min-w-0">
            <span id="resource-type-label" className={fieldLabel}>
              Type
            </span>
            <Dropdown
              id="resource-type"
              labelId="resource-type-label"
              value={type}
              options={TYPE_OPTIONS}
              onChange={(v) => {
                setType(v as TypeFilter);
                setPage(0);
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5 basis-50 min-w-0">
            <span id="resource-status-label" className={fieldLabel}>
              Status
            </span>
            <Dropdown
              id="resource-status"
              labelId="resource-status-label"
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
          <p className="text-sm text-spa-danger">Could not load resources.</p>
        ) : !data?.content.length ? (
          <p className="text-sm text-spa-muted">No resources found.</p>
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
                      Resource
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 font-medium border-b border-spa-line"
                    >
                      Type
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
                  {data.content.map((resource, index) => {
                    const color = TILE_COLORS[index % TILE_COLORS.length];
                    const dim = resource.active ? "" : "opacity-55";
                    return (
                      <tr key={resource.id}>
                        <td
                          className={`px-5 py-4 border-b border-spa-divider ${dim}`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              aria-hidden="true"
                              className="w-[72px] h-[72px] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                              style={{ background: color.bg, color: color.fg }}
                            >
                              {resource.imageUrl ? (
                                <img
                                  src={resource.imageUrl}
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
                                  <path d="M3 9l9-5 9 5-9 5-9-5z" />
                                  <path d="M3 14l9 5 9-5" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-[15px]">
                                {resource.name}
                              </div>
                              {resource.description && (
                                <div className="mt-0.5 max-w-80 text-spa-muted truncate">
                                  {resource.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td
                          className={`px-3 py-4 border-b border-spa-divider ${dim}`}
                        >
                          <span className="px-2.5 py-1 rounded-full bg-[#F1ECE1] text-[#4A4234] text-[12.5px] font-medium">
                            {TYPE_LABEL[resource.type]}
                          </span>
                        </td>
                        <td className="px-3 py-4 border-b border-spa-divider whitespace-nowrap">
                          <StatusChip active={resource.active} />
                        </td>
                        <td className="px-5 py-4 border-b border-spa-divider text-right whitespace-nowrap">
                          <Link
                            to={`/admin/resources/${resource.id}`}
                            aria-label={`Edit ${resource.name}`}
                            className="inline-flex items-center min-h-11 px-3.5 mr-2 rounded-[10px] border border-spa-border-strong bg-white text-spa-ink font-medium no-underline hover:bg-spa-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            aria-label={`${resource.active ? "Deactivate" : "Activate"} ${resource.name}`}
                            disabled={
                              isToggling && toggling?.id === resource.id
                            }
                            onClick={() => toggleActive(resource)}
                            className={`min-h-11 min-w-28 px-3.5 text-center rounded-[10px] border font-medium cursor-pointer
                                        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        ${
                                          resource.active
                                            ? "border-spa-border-strong bg-white text-spa-ink hover:bg-spa-canvas"
                                            : "border-spa-green bg-spa-green text-white hover:bg-spa-green-800"
                                        }`}
                          >
                            {resource.active ? "Deactivate" : "Activate"}
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
                  {data.totalElements} resources
                </p>
                <div className="flex items-center gap-2">
                  <span
                    id="resource-page-size-label"
                    className="text-sm text-spa-muted"
                  >
                    Rows per page
                  </span>
                  <Dropdown
                    id="resource-page-size"
                    labelId="resource-page-size-label"
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

export default ManageResources;
