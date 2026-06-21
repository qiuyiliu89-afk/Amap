import { NavLink } from "react-router-dom";
import { Navigation } from "lucide-react";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Brief", to: "/brief" },
  { label: "Pipeline", to: "/pipeline" },
  { label: "Assets", to: "/assets" },
  { label: "Preview", to: "/preview" },
  { label: "Batch", to: "/batch" },
  { label: "Bonus", to: "/bonus" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020b17]/82 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[90px] w-[min(1180px,calc(100vw-72px))] flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between md:py-0">
        <NavLink to="/" className="flex items-center gap-4">
          <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full border border-aqua-400/75 bg-aqua-400/10 text-aqua-400 shadow-[0_0_38px_rgba(77,231,216,0.26)]">
            <Navigation size={29} fill="currentColor" strokeWidth={1.5} />
          </span>
          <span>
            <span className="block text-[20px] font-semibold leading-tight text-white">Amap AI Campaign Studio</span>
            <span className="mt-2 block text-[13px] text-slate-400">高德 AI 内容生成自动化工作台</span>
          </span>
        </NavLink>

        <nav className="grid w-full grid-cols-4 gap-1 md:flex md:w-auto md:items-center md:gap-[24px]">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) =>
                `relative whitespace-nowrap px-1 py-2 text-center text-[13px] transition md:text-[14px] ${
                  isActive
                    ? "text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-aqua-400 after:shadow-[0_0_12px_rgba(77,231,216,0.7)]"
                    : "text-slate-300 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
