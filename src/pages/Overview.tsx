import type { OverviewPayload } from '../types/mis';
import { fmt } from '../lib/format';
import { Card, Gauge, Kpi } from '../components/ui/primitives';
import { Eyebrow, Grid2, Grid4, Lede, PageTitle, SectionHeading } from '../components/ui/layout';

export function Overview({ data }: { data: OverviewPayload }) {

  const fields = data.ascgProfileFieldCompletion.byField.map(f => {
    const percentage = (f.filledFields / (f.emptyFields + f.filledFields)) * 100
    return {
      field: f.field,
      percentage,
      filled: f.filledFields,
      empty: f.emptyFields,
      recorded: fmt(f.filledFields),
      blank: fmt(f.emptyFields),
      total: f.filledFields + f.emptyFields
    }
  })

  return (
    <>
      <Eyebrow>Programme monitoring</Eyebrow>
      <PageTitle>Overview</PageTitle>
      <Lede>
    Programme reach at a glance, plus how completely the Afterschool STEM Clubs for Girls (ASCG) register has been filled in. Enrolment by year is on Reach and enrolment. Each programme's page covers its tracks or camps, and ASCG academic results.
      </Lede>

      <Grid4>
        <Kpi label="Unique students" value={fmt(data.students)} accent="blue" sub="Each girl counted once, across all years and programmes" />
        <Kpi
          label="Total Enrolments"
          value={fmt(data.participation)}
          sub={`${fmt(data.participation - data.students)} repeat enrolments after a girl's first year`}
          accent="green"
        />
      </Grid4>

      <SectionHeading>
        Field completeness across the student register
      </SectionHeading>

      <Grid2>
        {fields.map(x => (
          <Card>
            <div>
              <div className='flex justify-between items-center text-lg'>
                <p className='font-semibold'>{x.field}</p>
                <p>{x.percentage.toFixed(1)}%</p>
              </div>
              <Gauge
                key={x.field}
                filled={x.filled}
                total={x.total}
                variant='green'
              />
              <div className='flex justify-between items-center text-muted mt-2'>
                <p>{x.recorded} recorded</p>
                <p>{x.blank} missing</p>
              </div>
            </div>

          </Card>
        ))}

      </Grid2>



    </>
  );
}
