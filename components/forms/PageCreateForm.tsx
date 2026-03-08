import Link from "next/link";

type PageCreateFormProps = {
  projectSlug: string;
  action: (formData: FormData) => Promise<void>;
};

export function PageCreateForm({ projectSlug, action }: PageCreateFormProps) {
  return (
    <form action={action} className="space-y-4 rounded-xl border border-neutral-200 p-6">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-neutral-900">
          Page title
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="Pricing"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-900/10 placeholder:text-neutral-400 focus:ring"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="block text-sm font-medium text-neutral-900">
          URL slug (optional)
        </label>
        <input
          id="slug"
          name="slug"
          placeholder="pricing"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-900/10 placeholder:text-neutral-400 focus:ring"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="prompt" className="block text-sm font-medium text-neutral-900">
          Prompt
        </label>
        <textarea
          id="prompt"
          name="prompt"
          rows={5}
          placeholder="Describe the page you want to generate..."
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-900/10 placeholder:text-neutral-400 focus:ring"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="referenceLinks" className="block text-sm font-medium text-neutral-900">
          Reference links (one per line)
        </label>
        <textarea
          id="referenceLinks"
          name="referenceLinks"
          rows={4}
          placeholder={"https://example.com\nhttps://another-link.com"}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-900/10 placeholder:text-neutral-400 focus:ring"
        />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
          Create page
        </button>
        <Link href={`/projects/${projectSlug}`} className="text-sm text-neutral-600 hover:text-neutral-900">
          Cancel
        </Link>
      </div>
    </form>
  );
}
