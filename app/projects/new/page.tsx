import { ProjectCreateForm } from "@/components/forms/ProjectCreateForm";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Create a project</h1>
        <p className="text-neutral-700">Start a new project to organize your generated pages.</p>
      </div>

      <ProjectCreateForm />
    </div>
  );
}
