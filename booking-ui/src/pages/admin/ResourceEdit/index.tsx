import { useSelector } from "react-redux";
import { Link, Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/layouts/Layout";
import InactiveBanner from "@/components/InactiveBanner";
import Loading from "@/components/Loading";
import { selectUser } from "@/redux/user/selectors";
import { getResource, updateResource } from "@/service/resource";
import { getErrorMessage } from "@/rest";
import ResourceForm from "./ResourceForm";

const LIST_PATH = "/admin/resources";

/** Add ("/admin/resources/new") or edit ("/admin/resources/:id") a resource. */
const ResourceEdit = ({ mode }: { mode: "create" | "edit" }) => {
  const queryClient = useQueryClient();
  const { id, role } = useSelector(selectUser);
  const params = useParams();
  const resourceId = Number(params.id);
  const isEdit = mode === "edit";

  const {
    data: resource,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-resources", "detail", resourceId],
    queryFn: () => getResource(resourceId),
    enabled: isEdit && Number.isFinite(resourceId),
  });

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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] }),
  });

  // The user is fetched by Layout; wait for it before deciding access.
  if (id && role !== "ADMIN") return <Navigate to="/" replace />;
  if (isEdit && !Number.isFinite(resourceId))
    return <Navigate to={LIST_PATH} replace />;

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

        {isEdit && isError ? (
          <p role="alert" className="m-0 text-sm text-spa-danger">
            {getErrorMessage(error)}
          </p>
        ) : isEdit && !resource ? null : (
          <>
            {isEdit && resource && !resource.active && (
              <InactiveBanner
                message="This resource is inactive. It cannot be used for new bookings. Activate to make it available again."
                buttonLabel="Activate resource"
                onActivate={() => activate()}
                pending={isActivating}
                error={
                  isActivateError ? getErrorMessage(activateError) : undefined
                }
              />
            )}
            <ResourceForm
              key={resource?.id ?? "new"}
              resource={isEdit ? (resource ?? null) : null}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default ResourceEdit;
