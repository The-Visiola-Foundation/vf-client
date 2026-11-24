
import type { AscgAcademicResponse } from '../types/mis';
import { pct } from '../lib/format';
import { Card, Kpi, Notice } from '../components/ui/primitives';
import {
  Eyebrow,
  Grid2,
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
  const { gpaTrend, performanceByTerm, records, summary, schoolStats } = data;

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

  const seniors = schoolStats.filter(x=>x.category === 'senior').length ?? 0
  const junior = schoolStats.filter(x=>x.category === 'junior').length ?? 0

  return (
    <>
      {/* Page Introduction */}
      <Eyebrow>
        Indicator 2 · {year} cohort, n={cohort.toLocaleString()}
      </Eyebrow>

      <PageTitle>ASCG participation and academic results</PageTitle>

      <Lede>
     Enrolment and academic results for ASCG students: first-time and returning students, GPA by term, and movement across subjects.
      </Lede>

      {/* ASCG Participation */}
      <SectionHeading>Enrolment</SectionHeading>

      <Grid2>
        <Kpi
          label="Total Enrolments"
          value={(summary.totalParticipation ?? 0).toLocaleString()}
          sub={`All ASCG enrolments in ${year}`}
          accent="blue"
        />

        <Kpi
          label="First-time students"
          value={(summary.uniqueParticipation ?? 0).toLocaleString()}
          sub="Enrolled for the first time"
          accent="green"
        />

        <Kpi
          label="Returning Students"
          value={(summary.returningParticipation ?? 0).toLocaleString()}
          sub="Enrolled in an earlier year"
          accent="purple"
        />

          <Kpi
          label="Schools"
          value={( schoolStats.length ?? 0).toLocaleString()}
          sub={`Across ${junior} junior secondary and ${seniors} senior secondary schools in the FCT`}
          accent="red"
        />
      </Grid2>

      {/* Academic Performance */}
      {!hasAcademicData ? (
        <Notice
          variant="warn"
          className="mt-3.5"
          title="Academic results not available"
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
           Letter grades are converted to a 5.0 scale (A = 5 to F = 0), checked against the Foundation's term averages.
          </Lede>

          {/* Academic Performance Overview */}
          <Grid4>
            <Kpi
              label="Improved"
              value={pct(
                (summary.improved / summary.totalRecords) * 100,
              )}
              sub={`${summary.improved} of ${summary.totalRecords} with grades in term 1 and term 3`}
              accent="green"
            />

            <Kpi
              label="Stable"
              value={pct(
                (summary.stable / summary.totalRecords) * 100,
              )}
              sub={`${summary.stable} whose GPA changed by 0.10 or less`}
              accent="purple"
            />

            <Kpi
              label="Declined"
              value={pct(
                (summary.declined / summary.totalRecords) * 100,
              )}
              sub={`${summary.declined} whose GPA fell by more than 0.10`}
              accent="red"
            />

            <Kpi
              label="Average GPA change, term 1 to 3"
              value={summary.netGpaChange}
              sub={`Term 1 average ${gpaByTerm['Term 1'] ?? '—'} → ${gpaByTerm['Term 3'] ?? '—'} (out of 5.00)`}
              accent="blue"
            />
          </Grid4>

          {/* Average GPA by Term */}
          <SectionHeading>Average GPA by term</SectionHeading>

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
                    · {x.numberOfRecords} students with a GPA ({x.percentage}% of
                    cohort)
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
          <SectionHeading>Change in GPA, term 1 to term 3</SectionHeading>

          <Card>
            <StackBar
              total={summary.totalRecords}
              segments={[
                {
                  label: 'Improved (rose by more than 0.10)',
                  v: summary.improved,
                  c: '#9EC83E',
                },
                {
                  label: ' Stable (within 0.10)',
                  v: summary.stable,
                  c: '#958EB8',
                },
                {
                  label: 'Declined (fell by more than 0.10)',
                  v: summary.declined,
                  c: '#D8232A',
                },
              ]}
            />
          </Card>

          {/* Movement by Subject */}
          <SectionHeading>Change by subject</SectionHeading>

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
                    <Th align="right">Avg. term 1</Th>
                    <Th align="right">Avg term 2</Th>
                    <Th align="right">Avg term 3</Th>
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
          <SectionHeading>Performance bands by term</SectionHeading>

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
                Band counts are not comparable across terms.
              </p>
            </Card>
          )}
        </>
      )}
    </>
  );
}
