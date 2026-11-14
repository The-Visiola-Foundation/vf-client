import type { BoardData } from '../types/mis';
import { fmt } from '../lib/format';
import { Card, EmptyState, Kpi, Notice } from '../components/ui/primitives';
import { Eyebrow, Grid4, Lede, PageTitle, SectionHeading } from '../components/ui/layout';
import { StackBar } from '../components/ui/charts';

export function Board({ data }: { data: BoardData }) {
  const p = { assessed: 0, improved: 0, stable: 0, declined: 0 };

  return (
    <>
      <Eyebrow>Governance · aggregate figures only</Eyebrow>
      <PageTitle>Board summary</PageTitle>
      <Lede>
        This view carries no names, contact details or individual records. In the database
        it is a separate schema with its own role, so a Board login cannot reach the
        register even by writing its own query.
      </Lede>

      <Grid4>
        <Kpi
          label="Girls reached, ASCG"
          value={fmt(data.ASCG?.uniqueStudents ?? 0)}
          sub="Unique, since 2018"
          accent="blue"
        />
        <Kpi
          label="Schools served"
          value={45}
          sub="Federal Capital Territory"
          accent="green"
        />
        <Kpi
          label="ASCG students improving"
          value={100}
          sub={`2025 cohort, n=${400}`}
          accent="purple"
        />
        <Kpi
          label="Parental consent on file"
          value={<span className="text-vf-red">{data.consentRate || '0%'}</span>}
          sub="Not recorded for any student"
          accent="red"
        />
      </Grid4>

      <Notice
        variant="err"
        className="mt-[18px]"
        title="Two items the Board should be aware of"
      >
        <p>
          <b>Consent is not recorded anywhere.</b> The Foundation holds dates of birth and
          parents&rsquo; names for {fmt(data.ASCG?.totalParticipations ?? 0)} children with no consent field
          in any source system. This is a compliance exposure under the Nigeria Data
          Protection Act, and it is the single most urgent gap in this MIS.
        </p>
      </Notice>

      <SectionHeading>Academic outcome, 2025 cohort</SectionHeading>
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

      <SectionHeading>Cost per outcome</SectionHeading>
      <EmptyState title="No budget figures loaded">
        Programme cost is the one input needed to turn reach into efficiency. Load annual
        spend per programme and this becomes cost per student and cost per improved student.
      </EmptyState>
    </>
  );
}
