import { EmptyState, Gauge } from '../ui/primitives';
import { SectionHeading } from '../ui/layout';
import { fmt } from '../../lib/format';
import type { SscImpactPayload } from '../../types/ssc';

export function ObservationSection({ impact }: { impact: SscImpactPayload }) {
  const { engagementAverage, n } = impact.observation;

  if (engagementAverage === null) {
    return (
      <EmptyState title="No facilitator observation data recorded">
        Facilitator engagement ratings were not captured for this camp.
      </EmptyState>
    );
  }

  return (
    <>
      <SectionHeading>Facilitator observation</SectionHeading>
      <div className="mb-3 text-[12px] text-muted">
        Facilitator-rated average engagement on a 0–5 scale.
      </div>
      <div className="rounded-card border border-line bg-card p-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-mono text-[33px] font-semibold text-ink">
            {engagementAverage.toFixed(1)}
          </span>
          <span className="text-muted">/ 5.0</span>
        </div>
        <Gauge filled={engagementAverage} total={5} variant="blue" />
        <p className="mt-2.5 text-[12.5px] text-ink-2">
          {fmt(n)} participants observed.{' '}
          {engagementAverage >= 4
            ? 'Strong engagement across the camp.'
            : engagementAverage >= 3
            ? 'Moderate engagement overall.'
            : 'Engagement below target — worth a closer look.'}
        </p>
      </div>
    </>
  );
}