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

      <div className="flex flex-wrap gap-3">
        <Link href="/projects">
          <Button>See generated demos</Button>
        </Link>
        <Link href="/projects/new">
          <Button variant="outline">Create project</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">View templates</Button>
        </Link>
      </div>
    </div>
  );
}
