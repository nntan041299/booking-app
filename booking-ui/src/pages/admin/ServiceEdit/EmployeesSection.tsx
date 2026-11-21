import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Section } from "@/components/Section";
import { searchEmployees } from "@/service/employee";

// Avatar colors from the design, cycled per employee.
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
  return (
    parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
};

/** Read-only list of the employees who perform a service. */
export default function EmployeesSection({ serviceId }: { serviceId: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-employees", "by-service", serviceId],
    queryFn: () => searchEmployees({ serviceId, active: true, size: 100 }),
  });
  const employees = data?.content ?? [];
  const count = data?.totalElements ?? employees.length;

  return (
    <Section
      id="h-staff"
      title="Employees who perform this"
      description="To change this list, assign the service on each employee page."
      badge={
        isLoading || isError
          ? undefined
          : `${count} ${count === 1 ? "employee" : "employees"}`
      }
      defaultOpen
    >
      {isLoading ? (
        <p className="m-0 text-sm text-spa-muted">Loading employees…</p>
      ) : isError ? (
        <p className="m-0 text-sm text-spa-danger">Could not load employees.</p>
      ) : employees.length === 0 ? (
        <p className="m-0 text-sm text-spa-muted">
          No employees perform this service yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {employees.map((employee, i) => {
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <Link
                key={employee.id}
                to={`/admin/employees/${employee.id}`}
                state={{ employee }}
                className="inline-flex items-center gap-2.5 min-h-11 py-1 pl-1.5 pr-4 rounded-full border border-spa-line text-spa-ink text-sm font-medium no-underline
                           hover:bg-spa-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
              >
                <span
                  aria-hidden="true"
                  className="w-8 h-8 rounded-full overflow-hidden inline-flex items-center justify-center text-xs font-semibold"
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
                </span>
                {employee.fullName}
              </Link>
            );
          })}
        </div>
      )}
    </Section>
  );
}
