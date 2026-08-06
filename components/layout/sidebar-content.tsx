"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileText,
  Gift,
  Hammer,
  Home,
  Images,
  Files,
  Landmark,
  LayoutDashboard,
  Settings,
  ReceiptText,
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
    name: "Chá e enxoval",
    href: "/cha-e-enxoval",
    icon: Gift,
  },
  {
    name: "Galeria",
    href: "/galeria",
    icon: Images,
  },
  {
  name: "Configurações",
  href: "/configuracoes",
  icon: Settings,
  },
];

interface SidebarContentProps {
  onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  return (
    <div className="flex h-full flex-col bg-white px-5 py-6">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-950 text-white shadow-sm">
          <Home className="size-5" />
        </div>

        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-950">
            Apê 13-01
          </p>
          <p className="text-xs text-slate-500">Nosso novo lar</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              <Icon className="size-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t pt-5">
        <Link
          href="/configuracoes"
          onClick={onNavigate}
          aria-current={
            isActive("/configuracoes") ? "page" : undefined
          }
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
            isActive("/configuracoes")
              ? "bg-emerald-950 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
          )}
        >
          <Settings className="size-5" />
          Configurações
        </Link>
      </div>
    </div>
  );
}