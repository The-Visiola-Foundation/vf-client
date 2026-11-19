
import {
  Eyebrow,
  Grid4,
  Heading,
  Lede,
  PageTitle,
  SectionHeading,
} from '../components/ui/layout';

import { fmt } from '../lib/format';
import { SCResponse } from '../types/mis';
import { Card, Kpi, Notice } from '../components/ui/primitives';


export function SC({ data, year }: { data: SCResponse, year: number }) {

  const total = Number.isFinite(data?.total) ? data.total : 0
  const yearLabel = (year: number) => (year === 0 ? 'All Years' : String(year));
  const hasMetrics = data.metrics.length > 0



  return (
    <>
      <Eyebrow>STEM Camps</Eyebrow>
      <PageTitle>STEM Camps Overview</PageTitle>
      <Lede>
        This dashboard presents participation across STEM Camps learning tracks and shows the
        distribution of students across each pathway for {yearLabel(year)}.
      </Lede>

      <SectionHeading>Program Participation</SectionHeading>
      <Grid4>
        <Kpi
          label="Total Students trained"
          value={fmt(total)}
          accent='purple'
        />

        <Kpi
          label="STEM Summer Camp"
          value={fmt(data.sscCount)}
          accent='blue'
          sub="Students trained during the SSC"
        />

        <Kpi
          label="Total Students trained"
          value={fmt(data.dscCount)}
          accent='red'
        />
      </Grid4>

      {/* Metrics Breakdown */}
      {!hasMetrics ? (
        <Notice
          variant='info'
          title="Impact Data Unavailable"
        >
          <p>
            Impact records are not available for {year}. STEM Camp participation statistics are displayed above.
          </p>
        </Notice>
      ) : (
        <Card>
          <Heading>STEM Camp Impact Figures</Heading>
        </Card>
      )}

    </>
  );
}
