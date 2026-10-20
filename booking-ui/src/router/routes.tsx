/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("@/pages/Home"));
const Account = lazy(() => import("@/pages/Account"));
const CreateService = lazy(() => import("@/pages/admin/CreateService"));
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
      path: "/admin/services/new",
      element: <CreateService />,
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
