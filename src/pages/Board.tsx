import type { BoardData } from '../types/mis';
import { fmt } from '../lib/format';
import { Card, EmptyState, Kpi, Notice } from '../components/ui/primitives';
import { Eyebrow, Grid2, Grid4, Heading, Lede, PageTitle, SectionHeading } from '../components/ui/layout';
import { BarChart, StackBar } from '../components/ui/charts';

export function Board({ data }: { data: BoardData }) {

  const { ASCG, CBC, SC, consentRate, studentCountByYear } = data
  const { schools, academics, since } = ASCG

  const academic = [...academics].sort((a, b) => b.year - a.year)[0]
  const studentsAnalyzed = (academic.declined + academic.stable + academic.improved)
  const improvedMetric = ((academic.improved / studentsAnalyzed) * 100).toFixed(1)

  const p = { assessed: studentsAnalyzed, improved: academic.improved, stable: academic.stable, declined: academic.declined };

  return (
    <>
      <Eyebrow>Governance · aggregate figures only</Eyebrow>
      <PageTitle>Board summary</PageTitle>
      <div className='space-y-2'>
        {/* ASCG Stats */}

        <Card>
          <Heading>{ASCG.description}</Heading>
          <Grid4>
            <Kpi
              label="Girls Trained, ASCG"
              value={fmt(data.ASCG?.uniqueStudents ?? 0)}
              sub={"Unique, since " + since}
              accent="blue"
            />
            <Kpi
              label="Schools served"
              value={schools}
              sub="Federal Capital Territory"
              accent="green"
            />
            <Kpi
              label="ASCG students improving"
              value={`${improvedMetric}%`}
              sub={`${academic.year} cohort, n=${studentsAnalyzed}`}
              accent="purple"
            />
            <Kpi
              label="Parental consent on file"
              value={<span className="text-vf-red">{consentRate || '0%'}</span>}
              sub="Not recorded for any student"
              accent="red"
            />
          </Grid4>

          <SectionHeading>Academic outcome, {academic.year} cohort</SectionHeading>
          <Card>
            <StackBar
              total={p.assessed}
              segments={[
                { label: 'Improved', v: p.improved, c: '#9EC83E' },
                { label: 'Stable', v: p.stable, c: '#958EB8' },
                { label: 'Declined', v: p.declined, c: '#D8232A' },
              ]}
            />
          </Card>
        </Card>
        {/* CBC Stats */}

        <Card>
          <Heading>{CBC.description}</Heading>
          <Grid2>
            <Kpi
              label="CBC Graduates"
              value={fmt(CBC.uniqueStudents)}
              accent='green'
              sub={`Unique, since ${CBC.since}`}
            />
             <Kpi
              label="Tracks Taught"
              value={fmt(CBC.trackCount)}
              accent='red'
              sub={`Unique, since ${CBC.since}`}
            />
          </Grid2>
        </Card>

        {/* SC Stats */}
        <Card>
          <Heading>{SC.description}</Heading>
        </Card>

        {/* Bar chart */}
        <Card>
          <Heading>Unique Students trained per year</Heading>
          <BarChart
            rows={studentCountByYear}
            labelKey='year'
            series={[
              {
                k: 'count',
                label: 'Unique Students',
                c: '#00A3DA',
              }
            ]}

          />
        </Card>

        <SectionHeading>Cost per outcome</SectionHeading>
        <EmptyState title="No budget figures loaded">
          Programme cost is the one input needed to turn reach into efficiency. Load annual
          spend per programme and this becomes cost per student and cost per improved student.
        </EmptyState>
      </div>
    </>
  );
}
