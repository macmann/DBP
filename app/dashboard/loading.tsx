import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function DashboardLoading() {
  return (
    <DashboardLayout title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="space-y-3" aria-hidden>
        <div className="h-5 w-1/3 animate-pulse rounded bg-neutral-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-neutral-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-neutral-200" />
      </div>
    </DashboardLayout>
  );
}
