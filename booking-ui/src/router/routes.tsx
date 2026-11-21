/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("@/pages/Home"));
const Account = lazy(() => import("@/pages/Account"));
const ManageServices = lazy(() => import("@/pages/admin/ManageServices"));
const ServiceEdit = lazy(() => import("@/pages/admin/ServiceEdit"));
const ManageEmployees = lazy(() => import("@/pages/admin/ManageEmployees"));
const EmployeeEdit = lazy(() => import("@/pages/admin/EmployeeEdit"));

const routes: Record<string, RouteObject[]> = {
  default: [
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/account",
      element: <Account />,
    },
    {
      path: "/admin/services",
      element: <ManageServices />,
    },
    {
      path: "/admin/services/new",
      element: <ServiceEdit key="create" mode="create" />,
    },
    {
      path: "/admin/services/:id",
      element: <ServiceEdit key="edit" mode="edit" />,
    },
    {
      path: "/admin/employees",
      element: <ManageEmployees />,
    },
    {
      path: "/admin/employees/new",
      element: <EmployeeEdit key="create" mode="create" />,
    },
    {
      path: "/admin/employees/:id",
      element: <EmployeeEdit key="edit" mode="edit" />,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ],
};

export default routes;
