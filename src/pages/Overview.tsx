import type { OverviewPayload } from '../types/mis';
import { fmt } from '../lib/format';
import { Kpi } from '../components/ui/primitives';
import { Eyebrow, Grid4, Lede, PageTitle } from '../components/ui/layout';

export function Overview({ data }: { data: OverviewPayload }) {
  return (
    <>
      <Eyebrow>Programme monitoring</Eyebrow>
      <PageTitle>Overview</PageTitle>
      <Lede>
        Headline totals across every programme. Academic detail lives on the
        programme pages; data completeness lives on the data-quality page.
      </Lede>

      <Grid4>
        <Kpi label="Unique students" value={fmt(data.students)} accent="blue" />
        <Kpi
          label="Participations"
          value={fmt(data.participation)}
          sub={`${fmt(data.participation - data.students)} returning-year records`}
          accent="green"
        />
        <Kpi
          label="Schools"
          value={fmt(data.schools)}
          sub="Federal Capital Territory"
          accent="purple"
        />
      </Grid4>
    </>
  );
}
