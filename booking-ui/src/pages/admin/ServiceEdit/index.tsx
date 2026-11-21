import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/layouts/Layout";
import Button from "@/components/Button";
import Loading from "@/components/Loading";
import Modal from "@/components/Modal";
import { selectUser } from "@/redux/user/selectors";
import { removeService, type ServiceItem } from "@/service/catalog";
import { getErrorMessage } from "@/rest";
import DetailsSection from "./DetailsSection";
import EmployeesSection from "./EmployeesSection";

interface LocationState {
  service?: ServiceItem;
}

const LIST_PATH = "/admin/services";

/**
 * Add (route "/admin/services/new") or edit ("/admin/services/:id") a service.
 * The backend has no "get service" endpoint, so the list passes the service
 * through router state; opening the URL directly goes back to the list.
 */
const ServiceEdit = ({ mode }: { mode: "create" | "edit" }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { id, role } = useSelector(selectUser);

  const initial = (location.state as LocationState | null)?.service ?? null;
  const [service, setService] = useState<ServiceItem | null>(initial);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const refreshList = () => {
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
    mutationFn: () => removeService(service!.id),
    onSuccess: () => {
      refreshList();
      navigate(LIST_PATH);
    },
  });

  // The user is fetched by Layout; wait for it before deciding access.
  if (id && role !== "ADMIN") return <Navigate to="/" replace />;
  if (mode === "edit" && !service) return <Navigate to={LIST_PATH} replace />;

  const isEdit = mode === "edit" && service !== null;

  const closeRemove = () => {
    if (isRemoving) return;
    setConfirmRemove(false);
    resetRemove();
  };

  return (
    <Layout>
      <Loading isLoading={isRemoving} />
      <div
        className="px-4 md:px-12 py-8 md:py-10 flex flex-col gap-6 text-spa-ink"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <header>
          <Link
            to={LIST_PATH}
            className="inline-flex items-center gap-1.5 min-h-11 text-sm font-medium text-spa-green no-underline hover:text-spa-green-800
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green rounded-lg"
          >
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to services
          </Link>
          <h1
            className="m-0 text-4xl font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {isEdit ? "Edit service" : "Add service"}
          </h1>
          <p className="mt-1.5 text-[15px] text-spa-muted">
            Describe the treatment and set how long it takes and what it costs.
          </p>
        </header>

        <DetailsSection
          service={isEdit ? service : null}
          onSaved={(patch) => {
            setService((prev) => (prev ? { ...prev, ...patch } : prev));
            refreshList();
          }}
          onCreated={(created) => {
            refreshList();
            navigate(
              created?.id ? `${LIST_PATH}/${created.id}` : LIST_PATH,
              created ? { replace: true, state: { service: created } } : {},
            );
          }}
        />

        {isEdit && (
          <EmployeesSection
            key={`staff-${service.id}`}
            serviceId={service.id}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {isEdit ? (
            <button
              type="button"
              disabled={!service.active}
              onClick={() => setConfirmRemove(true)}
              className="min-h-11 px-4 rounded-[10px] border border-spa-danger-line bg-white text-spa-danger font-medium cursor-pointer hover:bg-red-50
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Remove service
            </button>
          ) : (
            <span />
          )}
          <Link
            to={LIST_PATH}
            className="inline-flex items-center min-h-11 px-5 rounded-[10px] border border-spa-border-strong bg-white text-spa-ink font-medium no-underline hover:bg-spa-canvas
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
          >
            Back to services
          </Link>
        </div>
      </div>

      {confirmRemove && isEdit && (
        <Modal title="Remove service" onClose={closeRemove}>
          <div className="space-y-4">
            <p className="text-sm text-surface-700">
              Remove <strong>{service.name}</strong>? It will no longer be
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
              <Button onClick={() => remove()} disabled={isRemoving}>
                {isRemoving ? "Removing…" : "Remove"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default ServiceEdit;
