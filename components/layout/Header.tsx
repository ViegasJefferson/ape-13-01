"use client";

import {
  Bell,
  Home,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import {
  usePathname,
} from "next/navigation";

import {
  useState,
} from "react";

import {
  logout,
} from "@/app/login/actions";

import {
  SidebarContent,
} from "@/components/layout/sidebar-content";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  Button,
} from "@/components/ui/Button";

const sections = [
  {
    path: "/financiamento",
    eyebrow: "Financiamento",
    title: "Controle do financiamento",
  },
  {
    path: "/gastos",
    eyebrow: "Gastos",
    title: "Controle financeiro",
  },
  {
    path: "/obra",
    eyebrow: "Construção",
    title: "Evolução da obra",
  },
  {
    path: "/agenda",
    eyebrow: "Prazos e compromissos",
    title: "Agenda",
  },
  {
    path: "/documentos",
    eyebrow: "Arquivos privados",
    title: "Documentos",
  },
  {
    path: "/reforma",
    eyebrow: "Planejamento",
    title: "Reforma",
  },
  {
    path: "/arquitetura",
    eyebrow: "Projeto e decisões",
    title: "Arquitetura",
  },
  {
    path: "/enxoval",
    eyebrow: "Lista do apartamento",
    title: "Chá e enxoval",
  },
  {
    path: "/galeria",
    eyebrow: "Galeria",
    title: "Fotos e registros",
  },
  {
    path: "/relatorios",
    eyebrow: "Dados e exportações",
    title: "Relatórios",
  },
  {
    path: "/configuracoes",
    eyebrow: "Acesso compartilhado",
    title: "Configurações",
  },
];

export function Header() {
  const pathname =
    usePathname();

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const currentSection =
    sections.find(
      (section) =>
        pathname.startsWith(
          section.path,
        ),
    ) ?? {
      eyebrow:
        "Visão geral",

      title:
        "Nosso apartamento",
    };

  return (
    <>
      <header className="sticky top-0 z-30 flex min-h-20 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
        {/* ESQUERDA */}
        <div className="flex min-w-0 items-center gap-3">
          {/* MENU MOBILE */}
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label="Abrir menu"
            onClick={() =>
              setMobileMenuOpen(
                true,
              )
            }
          >
            <Menu className="size-5" />
          </Button>

          {/* IDENTIDADE MOBILE */}
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-950 text-white">
              <Home className="size-4" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950 sm:text-base">
                Apê 13-01
              </p>

              <p className="hidden truncate text-xs text-slate-500 sm:block">
                {currentSection.title}
              </p>
            </div>
          </div>

          {/* TÍTULO DESKTOP */}
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm text-slate-500">
              {
                currentSection.eyebrow
              }
            </p>

            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950">
              {
                currentSection.title
              }
            </h1>
          </div>
        </div>

        {/* DIREITA */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
          {/* NOTIFICAÇÕES */}
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-full sm:size-10"
            aria-label="Notificações"
            title="Notificações"
          >
            <Bell className="size-4" />
          </Button>

          {/* USUÁRIO */}
          <div className="hidden max-w-40 text-right md:block">
            <p className="truncate text-sm font-medium text-slate-900">
              Jefferson
            </p>

            <p className="truncate text-xs text-slate-500">
              Administrador
            </p>
          </div>

          {/* AVATAR */}
          <Avatar className="size-9 sm:size-10">
            <AvatarFallback className="bg-emerald-100 text-sm font-semibold text-emerald-950">
              JV
            </AvatarFallback>
          </Avatar>

          {/* LOGOUT */}
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="size-9 rounded-full sm:size-10"
              aria-label="Sair do sistema"
              title="Sair"
            >
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </header>

      {/* MENU MOBILE */}
      {mobileMenuOpen && (
        <>
          {/* FUNDO */}
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
            onClick={() =>
              setMobileMenuOpen(
                false,
              )
            }
          />

          {/* DRAWER */}
          <aside className="fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] border-r border-slate-200 bg-white shadow-2xl lg:hidden">
            <button
              type="button"
              aria-label="Fechar menu"
              title="Fechar menu"
              className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-950"
              onClick={() =>
                setMobileMenuOpen(
                  false,
                )
              }
            >
              <X className="size-4" />
            </button>

            <SidebarContent
              onNavigate={() =>
                setMobileMenuOpen(
                  false,
                )
              }
            />
          </aside>
        </>
      )}
    </>
  );
}