import { useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Layout from "@/layouts/Layout";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Loading from "@/components/Loading";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import { selectUser } from "@/redux/user/selectors";
import {
  removeEmployee,
  searchEmployees,
  type EmployeeItem,
} from "@/service/employee";
import { getErrorMessage } from "@/rest";
import CreateEmployeeModal from "./CreateEmployeeModal";
import EditEmployeeModal from "./EditEmployeeModal";
import { DAYS } from "./constants";

type StatusFilter = "all" | "active" | "inactive";

const STATUS_TO_ACTIVE: Record<StatusFilter, boolean | undefined> = {
  all: undefined,
  active: true,
  inactive: false,
};

const workingDaysSummary = (employee: EmployeeItem) => {
  const days = new Set(employee.workingHours.map((h) => h.dayOfWeek));
  if (days.size === 0) return "Not set";
  return DAYS.filter((d) => days.has(d.value))
    .map((d) => d.label.slice(0, 3))
    .join(", ");
};

const ManageEmployees = () => {
  const queryClient = useQueryClient();
  const { id, role } = useSelector(selectUser);

  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<EmployeeItem | null>(null);
  const [removing, setRemoving] = useState<EmployeeItem | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-employees", search, status, page],
    queryFn: () =>
      searchEmployees({
        keyword: search,
        active: STATUS_TO_ACTIVE[status],
        page,
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(keyword.trim());
  };

  const closeRemove = () => {
    if (isRemoving) return;
    setRemoving(null);
    resetRemove();
  };

  return (
    <Layout>
      <Loading isLoading={isLoading || isRemoving} />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold text-surface-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Manage employees
            </h1>
            <p className="text-sm text-surface-500 mt-1">
              Search, add, edit and remove employees, their services and working
              hours.
            </p>
          </div>
          <Button onClick={() => setCreating(true)} className="flex-shrink-0">
            <i className="pi pi-plus text-xs mr-2" />
            Add employee
          </Button>
        </div>

        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-48">
            <Input
              name="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by name"
            />
          </div>
          <select
            aria-label="Status filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              setPage(0);
            }}
            className="px-3 py-2.5 rounded-xl border border-surface-200 bg-white text-sm text-surface-700"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button type="submit">Search</Button>
        </form>

        {isLoading ? null : isError ? (
          <p className="text-sm text-red-600">Could not load employees.</p>
        ) : !data?.content.length ? (
          <p className="text-sm text-surface-500">No employees found.</p>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-surface-200 overflow-x-auto">
              <table
                className="w-full text-sm text-left"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                <thead className="text-xs uppercase tracking-widest text-surface-500 border-b border-surface-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Services</th>
                    <th className="px-4 py-3 font-semibold">Working days</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-surface-100 last:border-0"
                    >
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-surface-900">
                          {employee.fullName}
                        </p>
                        {employee.bio && (
                          <p className="text-xs text-surface-500 truncate">
                            {employee.bio}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-surface-700">
                        {employee.serviceIds.length}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-surface-700">
                        {workingDaysSummary(employee)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            employee.active
                              ? "bg-sage-100 text-sage-600"
                              : "bg-surface-100 text-surface-500"
                          }`}
                        >
                          {employee.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${employee.fullName}`}
                            onClick={() => setEditing(employee)}
                            className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 cursor-pointer"
                          >
                            <i className="pi pi-pencil text-sm" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${employee.fullName}`}
                            disabled={!employee.active}
                            onClick={() => setRemoving(employee)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            <i className="pi pi-trash text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={data.number}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {creating && (
        <CreateEmployeeModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            refresh();
          }}
        />
      )}

      {editing && (
        <EditEmployeeModal
          employee={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

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
