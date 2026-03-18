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
    <div className="min-h-[calc(100vh-6rem)] rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 shadow-sm md:grid md:grid-cols-[17rem_minmax(0,1fr)]">
      <Sidebar />
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <Topbar title={title} breadcrumbs={breadcrumbs} action={action} />
        <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
