
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
      <Eyebrow>STEM Camps (SC)</Eyebrow>
      <PageTitle>STEM Camps Participation</PageTitle>
      <Lede>
        Students enrolled in the STEM Summer Camp and the December STEM Camps in {yearLabel(year)}.
      </Lede>

      <SectionHeading>Enrolment overview</SectionHeading>
      <Grid4>
        <Kpi
          label="Total Students trained"
          value={fmt(total)}
          accent='purple'
          sub="Summer and December camps combined"
        />

        {
          data.sscCount ? <Kpi
            label="STEM Summer Camp"
            value={fmt(data.sscCount)}
            accent='blue'
            sub={`Enrolments in the summer camp${!!year? '' : 's'}`}
          /> : undefined
        }

        {data.dscCount ?
          <Kpi
            label="December STEM Camps"
            value={fmt(data.dscCount)}
            accent='red'
            sub={`Enrolments in the December camp${!!(year) ? '' : 's'}`}
          /> : undefined}
      </Grid4>

      {/* Metrics Breakdown */}
      {!hasMetrics ? (
        <Notice
          variant='info'
          title="Impact figures not available"
          className='my-5'
        >
          <p>
            No impact records for for {year}. Enrolment figures above are still shown.
          </p>
        </Notice>
      ) : (
        <Card
          className='my-5 pt-2'
        >
          <Heading>STEM Camp impact figures</Heading>

        </Card>
      )}

    </>
  );
}
