import { EmptyState, Pill } from '../ui/primitives';
import { SectionHeading } from '../ui/layout';

const PRIORITY_STYLE: Record<string, { variant: 'ok' | 'amb' | 'no'; label: string }> = {
  high: { variant: 'no', label: 'High' },
  medium: { variant: 'amb', label: 'Medium' },
  low: { variant: 'ok', label: 'Low' },
};

export function RecommendationsSection({
  recommendations,
}: {
  recommendations: { text: string; priority: 'high' | 'medium' | 'low' }[];
}) {
  if (recommendations.length === 0) {
    return (
      <EmptyState title="No recommendations recorded">
        No follow-up recommendations were captured for this camp.
      </EmptyState>
    );
  }

  return (
    <>
      <SectionHeading>Lessons learned &amp; recommendations</SectionHeading>
      <div className="mb-3 text-[12px] text-muted">
        Actions to carry into the next camp, by priority.
      </div>
      <div className="space-y-2">
        {recommendations.map((r, i) => {
          const style = PRIORITY_STYLE[r.priority];
          return (
            <div
              key={i}
              className="rounded-card border border-line bg-card p-3.5"
            >
              <div className="flex items-start gap-2">
                <Pill variant={style.variant}>{style.label}</Pill>
                <p className="flex-1 text-[13px] text-ink leading-[1.5]">{r.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}