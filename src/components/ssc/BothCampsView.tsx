import { Blank, Notice } from '../ui/primitives';
import { Grid2, SectionHeading } from '../ui/layout';
import { CoreMeasuresTable } from './CoreMeasuresTable';
import { KpiCards } from './KpiCards';
import type { SscCamp } from '../../types/ssc';
import type { SscImpactPayload } from '../../types/ssc';
import type { SscCompareRow } from '../../types/ssc';
import { fmt } from '../../lib/format';

interface BothCampsViewProps {
  camps: SscCamp[];
  impacts: Record<string, SscImpactPayload | null>;
  compareRows: SscCompareRow[];
  oneMissing: boolean;
}

export function BothCampsView({
  camps,
  impacts,
  compareRows,
  oneMissing,
}: BothCampsViewProps) {
  const [first, second] = camps;
  const firstImpact = impacts[first.id];
  const secondImpact = impacts[second.id];

  const totalParticipants =
    (firstImpact?.participants ?? 0) + (secondImpact?.participants ?? 0);
  const totalGirls =
    (firstImpact?.girlsReached ?? 0) + (secondImpact?.girlsReached ?? 0);

  return (
    <>
      {oneMissing && (
        <Notice variant="warn" title="One camp has no results yet">
          <p>
            Only <b>{(firstImpact ?? secondImpact)?.campName}</b> has impact
            data loaded this year. Year-level totals below cover that camp
            alone; the other camp's cells appear hatched, not zero.
          </p>
        </Notice>
      )}

      <SectionHeading>Year overview</SectionHeading>
      <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(215px,1fr))]">
        <div className="rounded-card border border-line bg-card p-4">
          <div className="text-[12px] font-semibold tracking-[0.01em] text-muted">
            Total participants
          </div>
          <div className="mt-1 font-mono text-[33px] font-semibold leading-[1.15] tracking-[-0.03em]">
            {fmt(totalParticipants)}
          </div>
        </div>
        <div className="rounded-card border border-line bg-card p-4">
          <div className="text-[12px] font-semibold tracking-[0.01em] text-muted">
            Girls reached (unique)
          </div>
          <div className="mt-1 font-mono text-[33px] font-semibold leading-[1.15] tracking-[-0.03em]">
            {fmt(totalGirls)}
          </div>
        </div>
        <div className="rounded-card border border-line bg-card p-4">
          <div className="text-[12px] font-semibold tracking-[0.01em] text-muted">
            Camps with results
          </div>
          <div className="mt-1 font-mono text-[33px] font-semibold leading-[1.15] tracking-[-0.03em]">
            {camps.filter((c) => impacts[c.id]).length} of {camps.length}
          </div>
        </div>
      </div>

      <SectionHeading>Camp-by-camp results</SectionHeading>
      <Grid2>
        <div className="rounded-card border border-line bg-card p-4">
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted mb-3">
            {first.name}
          </div>
          {firstImpact ? <KpiCards impact={firstImpact} /> : <Blank />}
        </div>
        <div className="rounded-card border border-line bg-card p-4">
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted mb-3">
            {second.name}
          </div>
          {secondImpact ? <KpiCards impact={secondImpact} /> : <Blank />}
        </div>
      </Grid2>

      <CoreMeasuresTable rows={compareRows} coreLabel="Core measures across camps" />
    </>
  );
}