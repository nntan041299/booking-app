import { useSelector } from "react-redux";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/layouts/Layout";
import InactiveBanner from "@/components/InactiveBanner";
import Loading from "@/components/Loading";
import { selectUser } from "@/redux/user/selectors";
import {
  getResource,
  updateResource,
  type ResourceItem,
} from "@/service/resource";
import { getErrorMessage } from "@/rest";
import DetailsSection from "./DetailsSection";
import ServicesSection from "./ServicesSection";

const LIST_PATH = "/admin/resources";

/** Add ("/admin/resources/new") or edit ("/admin/resources/:id") a resource. */
const ResourceEdit = ({ mode }: { mode: "create" | "edit" }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id, role } = useSelector(selectUser);
  const params = useParams();
  const resourceId = Number(params.id);
  const isEdit = mode === "edit";
  const detailKey = ["admin-resources", "detail", resourceId];

  const {
    data: resource,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: detailKey,
    queryFn: () => getResource(resourceId),
    enabled: isEdit && Number.isFinite(resourceId),
  });

  // After any save: show the saved record right away and refresh the list.
  const handleUpdated = (updated: ResourceItem) => {
    queryClient.setQueryData(detailKey, updated);
    queryClient.invalidateQueries({
      queryKey: ["admin-resources"],
      predicate: (q) => q.queryKey[1] !== "detail",
    });
  };

  // The inactive banner's button: make the resource available for bookings
  // again. The update replaces the whole record, so send the saved details.
  const {
    mutate: activate,
    isPending: isActivating,
    isError: isActivateError,
    error: activateError,
  } = useMutation({
    mutationFn: () =>
      updateResource(resource!.id, {
        name: resource!.name,
        type: resource!.type,
        description: resource!.description,
        imageUrl: resource!.imageUrl,
        active: true,
      }),
    onSuccess: handleUpdated,
  });

  // The user is fetched by Layout; wait for it before deciding access.
  if (id && role !== "ADMIN") return <Navigate to="/" replace />;
  if (isEdit && !Number.isFinite(resourceId))
    return <Navigate to={LIST_PATH} replace />;

  const ready = isEdit && resource;

  return (
    <Layout>
      <Loading isLoading={isEdit && isLoading} />
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
            Back to resources
          </Link>
          <h1
            className="m-0 text-4xl font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {isEdit ? "Edit resource" : "Add resource"}
          </h1>
          <p className="mt-1.5 text-[15px] text-spa-muted">
            A room or piece of equipment that can be shared by several services.
          </p>
        </header>

        {isEdit && isError && (
          <p role="alert" className="m-0 text-sm text-spa-danger">
            {getErrorMessage(error)}
          </p>
        )}

        {ready && !resource.active && (
          <InactiveBanner
            message="This resource is inactive. It cannot be used for new bookings. Activate to make it available again."
            buttonLabel="Activate resource"
            onActivate={() => activate()}
            pending={isActivating}
            error={isActivateError ? getErrorMessage(activateError) : undefined}
          />
        )}

        {!isEdit && (
          <DetailsSection
            resource={null}
            onSaved={handleUpdated}
            onCreated={(created) => {
              queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
              navigate(`${LIST_PATH}/${created.id}`, { replace: true });
            }}
          />
        )}

        {ready && (
          <>
            <DetailsSection
              key={`details-${resource.id}`}
              resource={resource}
              onSaved={handleUpdated}
              onCreated={handleUpdated}
            />
            <ServicesSection
              key={`svc-${resource.id}`}
              resource={resource}
              onSaved={handleUpdated}
            />
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to={LIST_PATH}
            className="inline-flex items-center min-h-11 px-5 rounded-[10px] border border-spa-border-strong bg-white text-spa-ink font-medium no-underline hover:bg-spa-canvas
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
          >
            Back to resources
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default ResourceEdit;
