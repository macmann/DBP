import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/config/brand";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">{PRODUCT_NAME} Landing Page Builder</h1>
      <p className="text-neutral-700">
        {PRODUCT_NAME} helps you generate, preview, and publish high-converting pages with an AI-assisted workflow.
      </p>
      <div className="flex gap-3">
        <Link
          href="/insights"
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
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
