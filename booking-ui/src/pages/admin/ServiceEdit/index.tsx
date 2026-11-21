import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/layouts/Layout";
import InactiveBanner from "@/components/InactiveBanner";
import { selectUser } from "@/redux/user/selectors";
import { updateService, type ServiceItem } from "@/service/catalog";
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

  const refreshList = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };

  // The inactive banner's button: show the service to guests again. The
  // update replaces the whole record, so send the current details with it.
  const {
    mutate: activate,
    isPending: isActivating,
    isError: isActivateError,
    error: activateError,
  } = useMutation({
    mutationFn: () =>
      updateService(service!.id, {
        name: service!.name,
        description: service!.description,
        durationMinutes: service!.durationMinutes,
        price: service!.price,
        active: true,
      }),
    onSuccess: () => {
      setService((prev) => (prev ? { ...prev, active: true } : prev));
      refreshList();
    },
  });

  // The user is fetched by Layout; wait for it before deciding access.
  if (id && role !== "ADMIN") return <Navigate to="/" replace />;
  if (mode === "edit" && !service) return <Navigate to={LIST_PATH} replace />;

  const isEdit = mode === "edit" && service !== null;

  return (
    <Layout>
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

        {isEdit && !service.active && (
          <InactiveBanner
            message="This service is inactive. Guests cannot see or book it. Activate to show it again."
            buttonLabel="Activate service"
            onActivate={() => activate()}
            pending={isActivating}
            error={isActivateError ? getErrorMessage(activateError) : undefined}
          />
        )}

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
          <Link
            to={LIST_PATH}
            className="inline-flex items-center min-h-11 px-5 rounded-[10px] border border-spa-border-strong bg-white text-spa-ink font-medium no-underline hover:bg-spa-canvas
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
          >
            Back to services
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceEdit;
