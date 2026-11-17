
import type { AscgAcademicResponse } from '../types/mis';
import { pct } from '../lib/format';
import { Card, Kpi, Notice } from '../components/ui/primitives';
import {
  Eyebrow,
  Grid4,
  Lede,
  Legend,
  PageTitle,
  SectionHeading,
} from '../components/ui/layout';
import { BarChart, LineChart, StackBar } from '../components/ui/charts';
import { Table, TableWrap, Td, TdNum, Th, Tr } from '../components/ui/table';

const parsePercent = (value: string | number | undefined | null) =>
  Number(String(value ?? '0').replace(/%/g, ''));

export function Ascg({
  data,
  year,
}: {
  data: AscgAcademicResponse;
  year: number;
}) {
  const { gpaTrend, performanceByTerm, records, summary } = data;

  const gpaByTerm = Object.fromEntries(
    records.gpa.map((g) => [g.term, g.gpa]),
  ) as Record<string, string>;

  const gpas = [...records.gpa].sort((a, b) => {
    const termA = Number(a.term.match(/\d+/)?.[0] ?? 0);
    const termB = Number(b.term.match(/\d+/)?.[0] ?? 0);
    return termA - termB;
  });

  const vals = gpas.map((g) => Number(g.gpa));

  const lo = vals.length
    ? Math.floor(Math.min(...vals) * 10) / 10 - 0.2
    : 0;

  const hi = vals.length
    ? Math.ceil(Math.max(...vals) * 10) / 10 + 0.2
    : 5;

  const cohort = summary.totalParticipation ?? 0;

  const term1Pct = parsePercent(gpaTrend[0]?.percentage);
  const term2Pct = parsePercent(gpaTrend[1]?.percentage);
  const term3Pct = parsePercent(gpaTrend[2]?.percentage);

  const hasAcademicData = summary.totalRecords > 0;

  return (
    <>
      {/* Page Introduction */}
      <Eyebrow>
        Indicator 2 · {year} cohort, n={cohort.toLocaleString()}
      </Eyebrow>

      <PageTitle>ASCG Program Overview</PageTitle>

      <Lede>
        This overview presents ASCG student participation and academic
        performance, including student retention, GPA trends, and
        performance across subjects and terms.
      </Lede>

      {/* ASCG Participation */}
      <SectionHeading>ASCG Participation</SectionHeading>

      <Grid4>
        <Kpi
          label="Total Participation"
          value={(summary.totalParticipation ?? 0).toLocaleString()}
          sub="All participation records"
          accent="blue"
        />

        <Kpi
          label="New Students"
          value={(summary.uniqueParticipation ?? 0).toLocaleString()}
          sub="First-time participants"
          accent="green"
        />

        <Kpi
          label="Returning Students"
          value={(summary.returningParticipation ?? 0).toLocaleString()}
          sub="Previously enrolled students"
          accent="purple"
        />
      </Grid4>

      {/* Academic Performance */}
      {!hasAcademicData ? (
        <Notice
          variant="warn"
          className="mt-3.5"
          title="Academic Data Unavailable"
        >
          <p>
            Academic performance records are not available for {year}.
            ASCG participation statistics are displayed above.
          </p>
        </Notice>
      ) : (
        <>
          <SectionHeading>Academic Performance</SectionHeading>

          <Lede>
            Grades are held as letters and converted on a 5.0 scale
            (A=5 to F=0). That scale was confirmed against the
            Foundation&rsquo;s own term averages before being applied,
            not assumed.
          </Lede>

          {/* Academic Performance Overview */}
          <Grid4>
            <Kpi
              label="Improved"
              value={pct(
                (summary.improved / summary.totalRecords) * 100,
              )}
              sub={`${summary.improved} of ${summary.totalRecords} with both term 1 and term 3`}
              accent="green"
            />

            <Kpi
              label="Stable"
              value={pct(
                (summary.stable / summary.totalRecords) * 100,
              )}
              sub={`${summary.stable} within ±0.10 GPA`}
              accent="purple"
            />

            <Kpi
              label="Declined"
              value={pct(
                (summary.declined / summary.totalRecords) * 100,
              )}
              sub={`${summary.declined} students`}
              accent="red"
            />

            <Kpi
              label="Net GPA Change, Term 1 to 3"
              value={summary.netGpaChange}
              sub={`${gpaByTerm['Term 1'] ?? '—'} → ${gpaByTerm['Term 3'] ?? '—'} out of 5.00`}
              accent="blue"
            />
          </Grid4>

          {/* Average GPA by Term */}
          <SectionHeading>Average GPA by Term</SectionHeading>

          {gpaTrend.length === 0 ? (
            <Card>
              <p className="mb-0 text-sm text-muted">
                No GPA trend data is available for this year.
              </p>
            </Card>
          ) : (
            <Card>
              <LineChart
                pts={vals}
                lo={lo}
                hi={hi}
                labels={['Term 1', 'Term 2', 'Term 3']}
              />

              <Legend>
                {gpaTrend.map((x) => (
                  <span key={x.term}>
                    <b className="font-mono tabular-nums">
                      {x.term}
                    </b>{' '}
                    · {x.numberOfRecords} records · {x.percentage}%
                    complete
                  </span>
                ))}
              </Legend>
            </Card>
          )}

          {/* Term 3 Notice */}
          {gpaTrend.length >= 3 && (
            <Notice
              variant="warn"
              className="mt-3.5"
              title="Term 3 is the thin one"
            >
              <p>
                Only {term3Pct}% of the cohort has a term 3 GPA,
                against {term1Pct}% and {term2Pct}% for terms 1 and 2.
                Because the gap falls at the end of the year rather
                than the middle, end-of-year reporting drop-off cannot
                be ruled out as the cause, and the term 3 average may
                not represent the whole cohort.
              </p>
            </Notice>
          )}

          {/* Progress Classification */}
          <SectionHeading>Progress Classification</SectionHeading>

          <Card>
            <StackBar
              total={summary.totalRecords}
              segments={[
                {
                  label: 'Improved (>+0.10)',
                  v: summary.improved,
                  c: '#9EC83E',
                },
                {
                  label: 'Stable (±0.10)',
                  v: summary.stable,
                  c: '#958EB8',
                },
                {
                  label: 'Declined (<−0.10)',
                  v: summary.declined,
                  c: '#D8232A',
                },
              ]}
            />
          </Card>

          {/* Movement by Subject */}
          <SectionHeading>Movement by Subject</SectionHeading>

          {records.grades.length === 0 ? (
            <Card>
              <p className="mb-0 text-sm text-muted">
                No subject movement data is available yet.
              </p>
            </Card>
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Subject</Th>
                    <Th align="right">Paired</Th>
                    <Th align="right">Term 1</Th>
                    <Th align="right">Term 2</Th>
                    <Th align="right">Term 3</Th>
                    <Th align="right">Improved</Th>
                    <Th align="right">Stable</Th>
                    <Th align="right">Declined</Th>
                    <Th align="right">% Improved</Th>
                  </tr>
                </thead>

                <tbody>
                  {records.grades.map((item) => (
                    <Tr key={item.subject}>
                      <Td>
                        <b>{item.subject}</b>
                      </Td>
                      <TdNum>{item.paired}</TdNum>
                      <TdNum>{item.term1}</TdNum>
                      <TdNum>{item.term2}</TdNum>
                      <TdNum>{item.term3}</TdNum>
                      <TdNum>{item.improved}</TdNum>
                      <TdNum>{item.stable}</TdNum>
                      <TdNum>{item.declined}</TdNum>
                      <TdNum>
                        {item.paired
                          ? pct((item.improved / item.paired) * 100)
                          : '0%'}
                      </TdNum>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}

          {/* Performance Bands */}
          <SectionHeading>Performance Bands by Term</SectionHeading>

          {performanceByTerm.length === 0 ? (
            <Card>
              <p className="mb-0 text-sm text-muted">
                No performance band data is available yet.
              </p>
            </Card>
          ) : (
            <Card>
              <BarChart
                rows={performanceByTerm}
                labelKey="term"
                series={[
                  {
                    k: 'excellent',
                    label: 'Excellent (4.0–5.0)',
                    c: '#9EC83E',
                  },
                  {
                    k: 'good',
                    label: 'Good (3.0–3.9)',
                    c: '#00A3DA',
                  },
                  {
                    k: 'fair',
                    label: 'Fair (2.0–2.9)',
                    c: '#958EB8',
                  },
                  {
                    k: 'poor',
                    label: 'Poor (below 2.0)',
                    c: '#D8232A',
                  },
                ]}
              />

              <p className="mb-0 mt-2 text-[12.5px] text-muted">
                Band counts are not comparable across terms while
                term 3 is only {term3Pct}% complete.
              </p>
            </Card>
          )}
        </>
      )}
    </>
  );
}
