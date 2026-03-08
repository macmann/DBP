import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

function formatDate(value: Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

function getStatusColor(status: string) {
  if (status === "published") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "generating") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "failed") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-neutral-100 text-neutral-700";
}

export default async function PageDetailPage({
  params
}: {
  params: Promise<{ projectSlug: string; pageId: string }>;
}) {
  const { projectSlug, pageId } = await params;

  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      projectId: projectSlug
    },
    include: {
      project: {
        select: {
          id: true,
          name: true
        }
      },
      versions: {
        orderBy: {
          version: "desc"
        },
        take: 1
      },
      assets: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!page) {
    notFound();
  }

  const latestVersion = page.versions[0];
  const promptText = latestVersion?.changelog ?? "No prompt has been saved for this page yet.";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href={`/projects/${page.project.id}`} className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Back to {page.project.name}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
        <p className="text-sm text-neutral-600">/{page.slug}</p>
      </div>

      <div className="grid gap-4 rounded-xl border border-neutral-200 p-6 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Status</p>
          <p className="mt-1">
            <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(page.status)}`}>
              {page.status}
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Page ID</p>
          <p className="mt-1 text-sm text-neutral-800">{page.id}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Created</p>
          <p className="mt-1 text-sm text-neutral-800">{formatDate(page.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Updated</p>
          <p className="mt-1 text-sm text-neutral-800">{formatDate(page.updatedAt)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Published</p>
          <p className="mt-1 text-sm text-neutral-800">{formatDate(page.publishedAt)}</p>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Prompt</h2>
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">{promptText}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Reference links</h2>
        {page.assets.length === 0 ? (
          <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            No reference links attached yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {page.assets.map((asset) => (
              <li key={asset.id}>
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-neutral-200 p-4 text-sm transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <p className="font-medium text-neutral-900">{asset.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{asset.type}</p>
                  <p className="mt-2 text-neutral-700">{asset.url}</p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
