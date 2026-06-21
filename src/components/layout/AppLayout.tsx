import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";

export function AppLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-route-grid route-texture opacity-[0.16]" />
      <div className="pointer-events-none fixed left-1/2 top-[-12rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-aqua-400/10 blur-3xl" />
      <Navbar />
      <main className={isHome ? "relative w-full py-10 md:py-[42px]" : "home-section relative py-8 md:py-10"}>
        <Outlet />
      </main>
    </div>
  );
}
