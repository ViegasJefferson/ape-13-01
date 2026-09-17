import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Header />

          <main className="min-w-0 w-full overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}