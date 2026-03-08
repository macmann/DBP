import { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

type Breadcrumb = {
  label: string;
  href?: string;
};

type TopbarAction = {
  label: string;
  href: string;
};

type DashboardLayoutProps = {
  title: string;
  breadcrumbs: Breadcrumb[];
  action?: TopbarAction;
  children: ReactNode;
};

export function DashboardLayout({ title, breadcrumbs, action, children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 md:flex-row">
      <Sidebar />
      <div className="flex min-h-full flex-1 flex-col">
        <Topbar title={title} breadcrumbs={breadcrumbs} action={action} />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
