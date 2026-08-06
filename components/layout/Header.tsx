"use client";

import { logout } from "@/app/login/actions";
import { Bell, Home, LogOut, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SidebarContent } from "@/components/layout/sidebar-content";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/Button";

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
    eyebrow: "Obra",
    title: "Acompanhamento da obra",
  },
  {
  path: "/obra",
  eyebrow: "Construção",
  title: "Evolução da obra",
  },
  {
  path: "/documentos",
  eyebrow: "Arquivos privados",
  title: "Documentos",
  },
  {
    path: "/reforma",
    eyebrow: "Reforma",
    title: "Planejamento da reforma",
  },
  {
    path: "/cha-e-enxoval",
    eyebrow: "Chá e enxoval",
    title: "Lista do novo lar",
  },
  {
    path: "/documentos",
    eyebrow: "Documentos",
    title: "Arquivos do apartamento",
  },
  {
    path: "/galeria",
    eyebrow: "Galeria",
    title: "Fotos e registros",
  },
  {
  path: "/configuracoes",
  eyebrow: "Acesso compartilhado",
  title: "Configurações",
  },
  {
    path: "/configuracoes",
    eyebrow: "Configurações",
    title: "Preferências do sistema",
  },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentSection = sections.find((section) =>
    pathname.startsWith(section.path),
  ) ?? {
    eyebrow: "Visão geral",
    title: "Nosso apartamento",
  };

  return (
    <>
      <header className="flex h-20 items-center justify-between border-b bg-white px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label="Abrir menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="size-5" />
          </Button>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-950 text-white">
              <Home className="size-4" />
            </div>

            <span className="font-semibold">Apê 13-01</span>
          </div>

          <div className="hidden lg:block">
            <p className="text-sm text-slate-500">
              {currentSection.eyebrow}
            </p>

            <h1 className="text-xl font-semibold tracking-tight text-slate-950">
              {currentSection.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Notificações"
          >
            <Bell className="size-4" />
          </Button>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">
              Jefferson
            </p>
            <p className="text-xs text-slate-500">Administrador</p>
          </div>

          <Avatar>
            <AvatarFallback className="bg-emerald-100 font-semibold text-emerald-950">
              JV
            </AvatarFallback>
          </Avatar>
          <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Sair do sistema"
            title="Sair"
          >
            <LogOut className="size-4" />
          </Button>
        </form>
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r bg-white shadow-xl lg:hidden">
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full border bg-white text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="size-4" />
            </button>

            <SidebarContent
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </aside>
        </>
      )}
    </>
  );
}