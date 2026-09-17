"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  SidebarContent,
} from "@/components/layout/sidebar-content";

export function Sidebar() {
  const [
    collapsed,
    setCollapsed,
  ] = useState(false);

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        "ape-sidebar-collapsed",
      );

    if (saved === "true") {
      setCollapsed(true);
    }
  }, []);

  function toggleSidebar() {
    setCollapsed(
      (current) => {
        const next =
          !current;

        window.localStorage.setItem(
          "ape-sidebar-collapsed",
          String(next),
        );

        return next;
      },
    );
  }

  return (
    <aside
      className={[
        "sticky top-0 hidden h-screen shrink-0 border-r border-slate-200/80 bg-white shadow-[4px_0_18px_rgba(15,23,42,0.03)] transition-[width] duration-300 ease-in-out lg:block",
        collapsed
          ? "w-20"
          : "w-72",
      ].join(" ")}
    >
      <SidebarContent
        collapsed={collapsed}
      />

      <button
  type="button"
  onClick={toggleSidebar}
  title={collapsed ? "Expandir menu" : "Recolher menu"}
  aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
  className="absolute -right-5 top-20 z-30 inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-md transition-all duration-200 hover:scale-[1.02] hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-950"
>
  {collapsed ? (
    <>
      <ChevronRight className="size-4 shrink-0" />
      <span>Expandir</span>
    </>
  ) : (
    <>
      <ChevronLeft className="size-4 shrink-0" />
      <span>Recolher</span>
    </>
  )}
</button>
    </aside>
  );
}