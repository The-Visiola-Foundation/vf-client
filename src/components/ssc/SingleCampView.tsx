import { EmptyState, Notice } from '../ui/primitives';
import { SscLegend } from './SscLegend';
import type { SscCamp } from '../../types/ssc';
import type { SscImpactPayload } from '../../types/ssc';
import { KpiCards } from './KpiCards';
import { SelfEfficacySection } from './SelfEfficacySection';
import { AssessmentSection } from './AssessmentSection';
import { ObservationSection } from './ObservationSection';
import { FeedbackThemesSection } from './FeedbackThemesSection';
import { ProjectsSection } from './ProjectsSection';
import { AwardsPartnersSection } from './AwardsPartnersSection';
import { ExpensesSection } from './ExpensesSection';
import { RecommendationsSection } from './RecommendationsSection';

interface SingleCampViewProps {
  camp: SscCamp;
  impact: SscImpactPayload | null;
  otherMissing: boolean;
}

export function SingleCampView({ camp, impact, otherMissing }: SingleCampViewProps) {
  if (!impact) {
    return (
      <EmptyState title={`No results for ${camp.name}`}>
        This camp exists in the programme but no impact data has been loaded
        yet. Select a different camp or check back once results are recorded.
      </EmptyState>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3 items-start">
        <div className="flex-1 min-w-[260px]">
          <SscLegend />
        </div>
        {otherMissing && (
          <Notice
            variant="warn"
            title="One camp has no results yet"
            className="max-w-[420px]"
          >
            <p>
              The other camp in this year has no impact data loaded, so
              year-level totals cover only <b>{camp.name}</b>. Figures below
              are for this camp alone.
            </p>
          </Notice>
        )}
      </div>

      <KpiCards impact={impact} />

      <SelfEfficacySection impact={impact} />
      <AssessmentSection impact={impact} />
      <ObservationSection impact={impact} />
      <FeedbackThemesSection impact={impact} />
      <ProjectsSection impact={impact} />
      <AwardsPartnersSection impact={impact} />
      <ExpensesSection impact={impact} />
      <RecommendationsSection recommendations={impact.recommendations} />
    </>
  );
}