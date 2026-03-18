import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function ProjectsLoading() {
  return (
    <DashboardLayout title="All pages" breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pages" }]}>
      <div className="space-y-3" aria-hidden>
        <div className="h-5 w-1/3 animate-pulse rounded bg-secondary" />
        <div className="h-20 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-20 animate-pulse rounded-2xl bg-secondary" />
      </div>
    </DashboardLayout>
  );
}
