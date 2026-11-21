import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUser } from "@/redux/user/selectors";
import Layout from "@/layouts/Layout";
import Button from "@/components/Button";
import CustomerDashboard from "@/pages/customer/Dashboard";

const Home = () => {
  const navigate = useNavigate();
  const { username, email, firstName, lastName, role } =
    useSelector(selectUser);
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || username;

  if (role === "CUSTOMER") return <CustomerDashboard />;

  return (
    <Layout>
      <div className="min-h-full flex flex-col items-center justify-center gap-2 px-6 py-16">
        <h1
          className="text-2xl font-bold text-surface-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Welcome{fullName ? `, ${fullName}` : ""}
        </h1>
        {email && <p className="text-sm text-surface-500">{email}</p>}
        {role === "ADMIN" && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={() => navigate("/admin/services")}>
              <i className="pi pi-list text-xs mr-2" />
              Manage services
            </Button>
            <Button onClick={() => navigate("/admin/employees/new")}>
              <i className="pi pi-plus text-xs mr-2" />
              Create employee
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;
