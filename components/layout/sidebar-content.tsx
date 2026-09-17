"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Building2,
  Gift,
  Hammer,
  Home,
  Images,
  Files,
  CalendarClock,
  Landmark,
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  ReceiptText,
  Ruler,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Visão geral",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Financiamento",
    href: "/financiamento",
    icon: Landmark,
  },
  {
    name: "Gastos",
    href: "/gastos",
    icon: ReceiptText,
  },
  {
    name: "Obra",
    href: "/obra",
    icon: Building2,
  },
  {
    name: "Agenda",
    href: "/agenda",
    icon: CalendarClock,
  },
  {
    name: "Documentos",
    href: "/documentos",
    icon: Files,
  },
  {
    name: "Reforma",
    href: "/reforma",
    icon: Hammer,
  },
  {
    name: "Arquitetura",
    href: "/arquitetura",
    icon: Ruler,
  },
  {
    name: "Galeria",
    href: "/galeria",
    icon: Images,
  },
  {
    name: "Chá e enxoval",
    href: "/enxoval",
    icon: Gift,
  },
  {
    name: "Relatórios",
    href: "/relatorios",
    icon: FileSpreadsheet,
  },
];

interface SidebarContentProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function SidebarContent({
  onNavigate,
  collapsed = false,
}: SidebarContentProps) {
  const pathname =
    usePathname();

  function isActive(
    href: string,
  ) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(
      href,
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-white py-6 transition-[padding] duration-300",
        collapsed
          ? "px-3"
          : "px-5",
      )}
    >
      {/* LOGO */}
      <div
        className={cn(
          "mb-10 flex items-center transition-all duration-300",
          collapsed
            ? "justify-center px-0"
            : "gap-3 px-2",
        )}
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-950 text-white shadow-sm">
          <Home className="size-5" />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight text-slate-950">
              Apê 13-01
            </p>

            <p className="truncate text-xs text-slate-500">
              Nosso novo lar
            </p>
          </div>
        )}
      </div>

      {/* NAVEGAÇÃO */}
      <nav className="flex flex-1 flex-col gap-1">
        {navigation.map(
          (item) => {
            const Icon =
              item.icon;

            const active =
              isActive(
                item.href,
              );

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={
                  onNavigate
                }
                title={
                  collapsed
                    ? item.name
                    : undefined
                }
                aria-label={
                  collapsed
                    ? item.name
                    : undefined
                }
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                className={cn(
                  "flex min-h-12 items-center rounded-xl text-sm font-medium transition-all duration-200",
                  collapsed
                    ? "justify-center px-0"
                    : "gap-3 px-3",
                  active
                    ? "bg-emerald-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                <Icon className="size-5 shrink-0" />

                {!collapsed && (
                  <span className="truncate">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          },
        )}
      </nav>

      {/* CONFIGURAÇÕES */}
      <div
        className={cn(
          "mt-8 border-t pt-5",
          collapsed &&
            "flex justify-center",
        )}
      >
        <Link
          href="/configuracoes"
          onClick={
            onNavigate
          }
          title={
            collapsed
              ? "Configurações"
              : undefined
          }
          aria-label={
            collapsed
              ? "Configurações"
              : undefined
          }
          aria-current={
            isActive(
              "/configuracoes",
            )
              ? "page"
              : undefined
          }
          className={cn(
            "flex min-h-12 items-center rounded-xl text-sm font-medium transition-all duration-200",
            collapsed
              ? "w-full justify-center px-0"
              : "gap-3 px-3",
            isActive(
              "/configuracoes",
            )
              ? "bg-emerald-950 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
          )}
        >
          <Settings className="size-5 shrink-0" />

          {!collapsed && (
            <span className="truncate">
              Configurações
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}