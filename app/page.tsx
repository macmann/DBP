import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/config/brand";
import { PrimaryGenerateForm } from "@/components/forms/PrimaryGenerateForm";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">{PRODUCT_NAME} Landing Page Builder</h1>
      <p className="text-muted">
        {PRODUCT_NAME} helps you generate, preview, and publish high-converting pages with an AI-assisted workflow.
      </p>
      <PrimaryGenerateForm />

      <div className="flex gap-3">
        <Link href="/dashboard">
          <Button>Open Dashboard</Button>
        </Link>
        <Link href="/insights">
          <Button variant="outline">View Insights</Button>
        </Link>
        <a href="https://nextjs.org/docs" target="_blank" rel="noreferrer">
          <Button variant="outline">Next.js Docs</Button>
        </a>
      </div>
    </div>
  );
}
