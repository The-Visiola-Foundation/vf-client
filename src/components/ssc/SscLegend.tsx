import { Pill } from '../ui/primitives';

/** Core vs camp-specific measure legend, matching the prototype's pills. */
export function SscLegend() {
  return (
    <div className="mt-2.5 flex items-center gap-4 text-[12px] text-ink-2">
      <Pill variant="ok">Core</Pill>
      <span className="text-muted">· shared, comparable across camps</span>
      <Pill variant="amb">Camp-specific</Pill>
      <span className="text-muted">· unique to this camp</span>
    </div>
  );
}