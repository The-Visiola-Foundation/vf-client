import { EmptyState } from '../ui/primitives';

interface SscEmptyStateProps {
  year: number | null;
  campName: string | null;
}

export function SscEmptyState({ year, campName }: SscEmptyStateProps) {
  const yearText = year ? ` for ${year}` : '';
  const campText = campName ? ` for <b>${campName}</b>` : '';

  return (
    <EmptyState title="No results recorded yet">
      <p>
        No impact data has been loaded{campText}{yearText}. This can mean the
        camp ran but no results were captured, or the camp has not taken place
        yet. Figures are left empty rather than shown as zero — blank means
        "no data recorded", never "zero".
      </p>
      <p className="mt-3 text-[13px] text-muted">
        Load impact data for this camp and this page will populate with
        participants, self-efficacy, assessment, observation, feedback,
        projects, partners, expenses and recommendations.
      </p>
    </EmptyState>
  );
}