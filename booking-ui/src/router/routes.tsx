/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("@/pages/Home"));
const Account = lazy(() => import("@/pages/Account"));
const ManageServices = lazy(() => import("@/pages/admin/ManageServices"));
const CreateService = lazy(() => import("@/pages/admin/CreateService"));
const ManageEmployees = lazy(() => import("@/pages/admin/ManageEmployees"));
const CreateEmployee = lazy(() => import("@/pages/admin/CreateEmployee"));

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
      element: <CreateService />,
    },
    {
      path: "/admin/employees",
      element: <ManageEmployees />,
    },
    {
      path: "/admin/employees/new",
      element: <CreateEmployee />,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ],
};

export default routes;
