import type { ReachPayload } from '../types/mis';
import { fmt } from '../lib/format';
import { Card, Kpi } from '../components/ui/primitives';
import {
  Eyebrow,
  Grid4,
  Lede,
  PageTitle,
  SectionHeading,
} from '../components/ui/layout';
import { BarChart } from '../components/ui/charts';
import { Table, TableWrap, Td, TdNum, Th, Tr } from '../components/ui/table';

export function Reach({ data }: { data: ReachPayload }) {
  const T = data;

  const programs = T.programs ?? [];
  const programById = (id: string) => programs.find((p) => p.id === id);

  const rows = (data.yearly.yearlyStats ?? []).map((r) => ({
    year: r.year,
    n: r.newStudents,
    r: r.returningStudents,
    c: r.unclassifiedStudents,
    p: r.newStudents + r.returningStudents + r.unclassifiedStudents,
  }));
  const totalNew = rows.reduce((a, b) => a + b.n, 0);
  const totalRet = rows.reduce((a, b) => a + b.r, 0);
  const totalEnrolled = rows.reduce((a, b) => a + b.p, 0);
  return (
    <>
      <Eyebrow>Indicator 1</Eyebrow>
      <PageTitle>Reach and enrolment</PageTitle>
      <Lede>
        Each girl is counted once, however many years or programmes she appears in. Within a single year she can be enrolled only once, so the useful split is first-time against returning.
      </Lede>

      <Grid4>
        <Kpi
          label="After-School STEM Clubs for Girls · unique students"
          value={fmt(programById('ascg')?.uniqueStudents)}
          sub={programById('ascg')?.since != null ? `Since ${programById('ascg')?.since}` : 'Backend only'}
          accent="blue"
        />

        {/* <Kpi
          label="Outreach · unique students"
          value={fmt(programById('outreach')?.uniqueStudents)}
          sub={programById('outreach')?.since != null ? `Since ${programById('outreach')?.since}` : 'Backend only'}
          accent="blue"
        /> */}

        <Kpi
          label="Coding Bootcamps · unique students"
          value={fmt(programById('cbc')?.uniqueStudents)}
          sub={programById('cbc')?.since != null ? `Since ${programById('cbc')?.since}` : 'Backend only'}
          accent="purple"
        />
        <Kpi
          label="STEM Camps · unique students"
          value={fmt(programById('sc')?.uniqueStudents)}
          sub={programById('sc')?.since != null ? `Since ${programById('sc')?.since}` : 'Backend only'}
          accent="green"
        />
      </Grid4>

      <SectionHeading>First-time and returning students by year</SectionHeading>
      <Card>
        <BarChart
          rows={rows}
          labelKey="year"
          series={[
            { k: 'n', label: 'First-time', c: '#00A3DA' },
            { k: 'r', label: 'Returning', c: '#958EB8' },
            { k: 'c', label: 'Unclassified', c: '#F5A623' },
          ]}
        />
      </Card>

      <TableWrap className="mt-3.5">
        <Table>
          <thead>
            <tr>
              <Th>Year</Th>
              <Th align="right">First-time</Th>
              <Th align="right">Returning</Th>
              <Th align="right">Unclassified</Th>
              <Th align="right">Total enrolled</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Tr key={r.year}>
                <Td className="font-mono tabular-nums">{r.year}</Td>
                <TdNum align='right'>{fmt(r.n)}</TdNum>
                <TdNum align='right'>{fmt(r.r)}</TdNum>
                <TdNum align='right'>{fmt(r.c)}</TdNum>
                <TdNum align='right'>{fmt(r.p)}</TdNum>
              </Tr>
            ))}
            <tr className="bg-paper font-bold">
              <Td>All years</Td>
              <TdNum align='right'>{fmt(totalNew)}</TdNum>
              <TdNum align='right'>{fmt(totalRet)}</TdNum>
              <TdNum align='right'>{fmt(rows.reduce((a, b) => a + b.c, 0))}</TdNum>
              <TdNum align='right'>{fmt(totalEnrolled)}</TdNum>
            </tr>
          </tbody>
        </Table>
      </TableWrap>

      {/* <Notice variant="warn" className="mt-4" title="Returning students are almost certainly undercounted">
        <p>
          A returning girl can only be detected when her last name, date of birth and school
          all match a previous year. Anyone who changed school appears as a new student. The
          2025 Impact Report counts 823 returning students; this register detects{' '}
          {fmt(totalRet)} across all eight years, which points at the missing student ID
          rather than at the report.
        </p>
      </Notice>

      <Notice variant="warn" title="Reconcile before publishing a cumulative figure">
        <p>
          The 2025 Impact Report states 3,004 girls trained in 2025. This register holds{' '}
          {fmt(rows2025?.p)} records with a joining year of 2025. The two may be measuring
          different things — year of joining against year of training — and the definition
          needs settling before either is used externally.
        </p>
      </Notice> */}
    </>
  );
}
