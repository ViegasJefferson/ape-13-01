import { SidebarContent } from "@/components/layout/sidebar-content";

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r bg-white lg:block">
      <SidebarContent />
    </aside>
  );
}