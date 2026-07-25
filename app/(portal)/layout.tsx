import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

interface PortalLayoutProps {
  children: ReactNode;
}

export default function PortalLayout({
  children,
}: PortalLayoutProps) {
  return <AppShell>{children}</AppShell>;
}