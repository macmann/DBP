import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/config/brand";
import { PrimaryGenerateForm } from "@/components/forms/PrimaryGenerateForm";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">{PRODUCT_NAME} Landing Page Builder</h1>
      <p className="text-neutral-700">
        {PRODUCT_NAME} helps you generate, preview, and publish high-converting pages with an AI-assisted workflow.
      </p>
      <PrimaryGenerateForm />

      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Open Dashboard
        </Link>
        <Link
          href="/insights"
          className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          View Insights
        </Link>
        <a
          href="https://nextjs.org/docs"
          className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          target="_blank"
          rel="noreferrer"
        >
          Next.js Docs
        </a>
      </div>
    </div>
  );
}
