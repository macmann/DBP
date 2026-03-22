import type { SchemaInspectionResult } from "@/lib/ai/schemaInspection";
import { Badge } from "@/components/ui/badge";

type BlockInspectorPanelProps = {
  inspection: SchemaInspectionResult | null;
};

export function BlockInspectorPanel({ inspection }: BlockInspectorPanelProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm md:p-6">
      <h3 className="text-base font-semibold text-fg">Current version block inspector</h3>

      {!inspection ? (
        <p className="text-sm text-muted">No current version available yet. Build the page to inspect blocks.</p>
      ) : !inspection.isValid ? (
        <div className="space-y-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
          <p className="text-sm font-medium text-warning">Schema validation failed for current version.</p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-warning">
            {inspection.validationErrors.slice(0, 3).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="neutral">{inspection.blockCount} blocks</Badge>
            {inspection.unknownBlockTypes.length > 0 ? (
              <Badge variant="warning">Unknown: {inspection.unknownBlockTypes.join(", ")}</Badge>
            ) : (
              <Badge variant="success">All block types recognized</Badge>
            )}
          </div>
          <ul className="space-y-2">
            {inspection.blocks.map((block) => (
              <li key={block.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="neutral">{block.type}</Badge>
                  <span className="font-mono text-muted">{block.id}</span>
                  <span className="text-muted">Variant: {block.variant ?? "default"}</span>
                </div>
                <p className="mt-1 text-sm text-fg">Key props: {block.keyProps.join(", ")}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
