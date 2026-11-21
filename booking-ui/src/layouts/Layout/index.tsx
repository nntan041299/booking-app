import { ReactNode, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SideBar from "@/components/SideBar";
import Header from "@/components/Header";
import { getUserInfo } from "@/service/user";
import { setUserInfo } from "@/redux/user";
import { selectUser } from "@/redux/user/selectors";
import { AppDispatch } from "@/redux/store";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useSelector(selectUser);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      getUserInfo().then((res) => {
        const data = res.data.data;
        const parts = (data.fullName ?? "").trim().split(/\s+/);
        dispatch(
          setUserInfo({
            id: String(data.id),
            username: data.username,
            email: data.email,
            firstName: parts[0] ?? "",
            lastName: parts.slice(1).join(" ") || undefined,
            avatarUrl: data.avatarUrl,
            role: data.role,
          }),
        );
      });
    }
  }, [dispatch, id]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <div className="flex flex-1 min-h-0">
        <SideBar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 overflow-y-auto bg-spa-canvas">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
