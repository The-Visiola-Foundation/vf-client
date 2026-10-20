import { Blank, Kpi } from '../ui/primitives';
import { Grid4 } from '../ui/layout';
import { fmt, fmtCurrency } from '../../lib/format';
import type { SscImpactPayload } from '../../types/ssc';

export function KpiCards({ impact }: { impact: SscImpactPayload }) {
  const expenseTotal = impact.expenses.reduce(
    (sum, e) => sum + (e.amount ?? 0),
    0,
  );

  return (
    <Grid4>
      <Kpi
        label="Participants"
        value={fmt(impact.participants)}
        sub="Girls enrolled in this camp"
      />
      <Kpi
        label="Girls reached"
        value={fmt(impact.girlsReached)}
        sub="Unique across camps this year"
        accent="blue"
      />
      <Kpi
        label="Self-efficacy statements"
        value={fmt(impact.selfEfficacy.length)}
        sub="Measured pre/post camp"
      />
      <Kpi
        label="Knowledge gain"
        value={
          impact.assessment.preAverage !== null &&
          impact.assessment.postAverage !== null
            ? `+${(impact.assessment.postAverage - impact.assessment.preAverage).toFixed(1)}`
            : <Blank />
        }
        sub="Post minus pre average score"
        accent="green"
      />
      <Kpi
        label="Projects delivered"
        value={fmt(impact.projects.length)}
        sub="Student-led camp projects"
      />
      <Kpi
        label="Awards"
        value={fmt(impact.awards.length)}
        sub="Recognitions given at camp"
      />
      <Kpi
        label="Partners"
        value={fmt(impact.partners.length)}
        sub="Organisations that supported the camp"
      />
      <Kpi
        label="Total spend"
        value={fmtCurrency(impact.expenses.length ? expenseTotal : null, impact.currency)}
        sub="Across all expense lines"
        accent="purple"
      />
    </Grid4>
  );
}