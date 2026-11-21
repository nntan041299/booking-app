import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/layouts/Layout";
import Button from "@/components/Button";
import Loading from "@/components/Loading";
import Modal from "@/components/Modal";
import { selectUser } from "@/redux/user/selectors";
import { removeEmployee, type EmployeeItem } from "@/service/employee";
import { getErrorMessage } from "@/rest";
import ProfileSection from "./ProfileSection";
import ServicesSection from "./ServicesSection";
import WorkingHoursSection from "./WorkingHoursSection";

interface LocationState {
  employee?: EmployeeItem;
}

const LIST_PATH = "/admin/employees";

/**
 * Add (route "/admin/employees/new") or edit ("/admin/employees/:id") an
 * employee. The backend has no "get employee" endpoint, so the list passes the
 * employee through router state; opening the URL directly goes back to the list.
 */
const EmployeeEdit = ({ mode }: { mode: "create" | "edit" }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { id, role } = useSelector(selectUser);

  const initial = (location.state as LocationState | null)?.employee ?? null;
  const [employee, setEmployee] = useState<EmployeeItem | null>(initial);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const refreshList = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-employees"] });

  const update = (patch: Partial<EmployeeItem>) => {
    setEmployee((prev) => (prev ? { ...prev, ...patch } : prev));
    refreshList();
  };

  const {
    mutate: remove,
    isPending: isRemoving,
    isError: isRemoveError,
    error: removeError,
    reset: resetRemove,
  } = useMutation({
    mutationFn: () => removeEmployee(employee!.id),
    onSuccess: () => {
      refreshList();
      navigate(LIST_PATH);
    },
  });

  // The user is fetched by Layout; wait for it before deciding access.
  if (id && role !== "ADMIN") return <Navigate to="/" replace />;
  if (mode === "edit" && !employee) return <Navigate to={LIST_PATH} replace />;

  const isEdit = mode === "edit" && employee !== null;

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
            Back to employees
          </Link>
          <h1
            className="m-0 text-4xl font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {isEdit ? "Edit employee" : "Add employee"}
          </h1>
          <p className="mt-1.5 text-[15px] text-spa-muted">
            {isEdit
              ? "Profile, services and weekly hours for one team member."
              : "Create the employee and the account they sign in with. You can set services and weekly hours right after."}
          </p>
        </header>

        <ProfileSection
          employee={isEdit ? employee : null}
          onSaved={update}
          onCreated={(created) => {
            refreshList();
            navigate(
              created?.id ? `${LIST_PATH}/${created.id}` : LIST_PATH,
              created ? { replace: true, state: { employee: created } } : {},
            );
          }}
        />

        {isEdit && (
          <>
            <ServicesSection
              key={`svc-${employee.id}`}
              employee={employee}
              onSaved={(serviceIds) => update({ serviceIds })}
            />
            <WorkingHoursSection
              key={`hours-${employee.id}`}
              employee={employee}
              onSaved={(workingHours) => update({ workingHours })}
            />
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {isEdit ? (
            <button
              type="button"
              disabled={!employee.active}
              onClick={() => setConfirmRemove(true)}
              className="min-h-11 px-4 rounded-[10px] border border-spa-danger-line bg-white text-spa-danger font-medium cursor-pointer hover:bg-red-50
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Remove employee
            </button>
          ) : (
            <span />
          )}
          <Link
            to={LIST_PATH}
            className="inline-flex items-center min-h-11 px-5 rounded-[10px] border border-spa-border-strong bg-white text-spa-ink font-medium no-underline hover:bg-spa-canvas
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
          >
            Back to employees
          </Link>
        </div>
      </div>

      {confirmRemove && isEdit && (
        <Modal title="Remove employee" onClose={closeRemove}>
          <div className="space-y-4">
            <p className="text-sm text-surface-700">
              Remove <strong>{employee.fullName}</strong>? They will no longer
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

export default EmployeeEdit;
