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
  removeService,
  searchAdminServices,
  type ServiceItem,
} from "@/service/catalog";
import { getErrorMessage } from "@/rest";
import ServiceFormModal from "./ServiceFormModal";

type StatusFilter = "all" | "active" | "inactive";

const STATUS_TO_ACTIVE: Record<StatusFilter, boolean | undefined> = {
  all: undefined,
  active: true,
  inactive: false,
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(price);

const ManageServices = () => {
  const queryClient = useQueryClient();
  const { id, role } = useSelector(selectUser);

  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  // undefined = closed, null = creating, otherwise editing that service
  const [editing, setEditing] = useState<ServiceItem | null | undefined>(
    undefined,
  );
  const [removing, setRemoving] = useState<ServiceItem | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-services", search, status, page],
    queryFn: () =>
      searchAdminServices({
        keyword: search,
        active: STATUS_TO_ACTIVE[status],
        page,
      }),
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };

  const {
    mutate: remove,
    isPending: isRemoving,
    isError: isRemoveError,
    error: removeError,
    reset: resetRemove,
  } = useMutation({
    mutationFn: (service: ServiceItem) => removeService(service.id),
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
              Manage services
            </h1>
            <p className="text-sm text-surface-500 mt-1">
              Search, add, edit and remove the services customers can book.
            </p>
          </div>
          <Button onClick={() => setEditing(null)} className="flex-shrink-0">
            <i className="pi pi-plus text-xs mr-2" />
            Add service
          </Button>
        </div>

        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-48">
            <Input
              name="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by name or description"
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
          <p className="text-sm text-red-600">Could not load services.</p>
        ) : !data?.content.length ? (
          <p className="text-sm text-surface-500">No services found.</p>
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
                    <th className="px-4 py-3 font-semibold">Duration</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((service) => (
                    <tr
                      key={service.id}
                      className="border-b border-surface-100 last:border-0"
                    >
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-surface-900">
                          {service.name}
                        </p>
                        {service.description && (
                          <p className="text-xs text-surface-500 truncate">
                            {service.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-surface-700">
                        {service.durationMinutes} min
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-surface-700">
                        {formatPrice(service.price)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            service.active
                              ? "bg-sage-100 text-sage-600"
                              : "bg-surface-100 text-surface-500"
                          }`}
                        >
                          {service.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${service.name}`}
                            onClick={() => setEditing(service)}
                            className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 cursor-pointer"
                          >
                            <i className="pi pi-pencil text-sm" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${service.name}`}
                            disabled={!service.active}
                            onClick={() => setRemoving(service)}
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

      {editing !== undefined && (
        <ServiceFormModal
          service={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            refresh();
          }}
        />
      )}

      {removing && (
        <Modal title="Remove service" onClose={closeRemove}>
          <div className="space-y-4">
            <p
              className="text-sm text-surface-700"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Remove <strong>{removing.name}</strong>? It will no longer be
              offered to customers. Existing appointments are kept, and you can
              restore it later by editing it and marking it active.
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

export default ManageServices;
