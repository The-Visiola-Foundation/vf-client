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
import type { CbcResponse } from '../types/mis';

const fmt = (value: number | null | undefined) =>
  Number.isFinite(value ?? Number.NaN) ? (value ?? 0).toLocaleString() : '0';

const pct = (count: number, total: number) => (total > 0 ? (count / total) * 100 : 0);

const yearLabel = (year: number) => (year === 0 ? 'All Years' : String(year));


const formatCohortLabel = (cohort: string | undefined | null) => {
  const value = String(cohort ?? '').trim().toLowerCase();
  if (!value) return 'Cohort';
  const label = value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return label ? `Cohort ${label}` : 'Cohort';
};

const cohortSortRank = (cohort: string | undefined | null) => {
  const value = String(cohort ?? '').trim().toLowerCase();
  if (!value) return 99;
  if (value.includes('cohort one') || value.includes('one')) return 0;
  if (value.includes('cohort two') || value.includes('two')) return 1;
  if (value.includes('weekend')) return 2;
  return 99;
};

export function Cbc({ data, year }: { data: CbcResponse; year: number }) {
  const tracks = Array.isArray(data?.tracks) ? data.tracks : [];
  const total = Number.isFinite(data?.total) ? Number(data.total) : 0;
  const uniqueCount = Number.isFinite(data?.uniqueCount) ? Number(data.uniqueCount) : 0;
  const cohortsBreakdown = Array.isArray(data?.cohortsBreakdown) ? data.cohortsBreakdown : [];

  const orderedTracks = [...tracks]
    .filter((track) => track && Number.isFinite(Number(track.studentCount)))
    .map((track) => ({
      ...track,
      studentCount: Number(track.studentCount) || 0,
    }))
    .sort((a, b) => b.studentCount - a.studentCount);


  const orderedCohorts = [...cohortsBreakdown]
    .filter((cohort) => cohort && Number.isFinite(Number(cohort.studentCount)))
    .map((cohort) => ({
      ...cohort,
      studentCount: Number(cohort.studentCount) || 0,
    }))
    .sort((a, b) => {
      const rankDiff = cohortSortRank(a.cohort) - cohortSortRank(b.cohort);
      if (rankDiff !== 0) return rankDiff;
      return b.studentCount - a.studentCount;
    });

  const cohortRows = orderedCohorts.map((cohort) => ({
    label: formatCohortLabel(cohort.cohort),
    value: cohort.studentCount,
  }));

  const showCohortSection = year !== 0;

  return (
    <>
      <Eyebrow>Coding Bootcamps (CBC)</Eyebrow>
      <PageTitle>CBC Participation</PageTitle>
      <Lede>
       How many students enrolled in each Coding Boot Camp track in {yearLabel(year)}. A cohort breakdown appears when a single year is selected.
      </Lede>

      <SectionHeading>Enrolment overview</SectionHeading>
      <Grid4>
        <Kpi
          label="Total Enrolments"
          value={fmt(total)}
          sub="A student in two tracks is counted twice"
          accent="blue"
        />
        <Kpi
          label="Unique Students"
          value={fmt(uniqueCount)}
          sub="Each student counted once, across all tracks"
          accent="green"
        />
        <Kpi
          label="Number of Learning Tracks"
          value={fmt(orderedTracks.length)}
          sub={`Tracks with enrolments in ${yearLabel(year)}`}
          accent="purple"
        />
      </Grid4>


      <SectionHeading>Enrolments by track</SectionHeading>

      {orderedTracks.length === 0 ? (
        <Card>
          <p className="mb-0 text-sm text-muted">
            No enrolments recorded for {year}.
          </p>
        </Card>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Track</Th>
                <Th align="left">Enrolments</Th>
                <Th align="right">Share of enrolments</Th>
              </tr>
            </thead>
            <tbody>
              {orderedTracks.map((track) => {
                const share = pct(track.studentCount, total);
                return (
                  <Tr key={track.trackId}>
                    <Td>{track.trackName}</Td>
                    <TdNum>{fmt(track.studentCount)}</TdNum>
                    <TdNum align='right'>{share.toFixed(1)}%</TdNum>
                  </Tr>
                );
              })}
              <Tr className="bg-[#F7F8F6] font-semibold">
                <Td>
                  <b>Total</b>
                </Td>
                <TdNum>{fmt(total)}</TdNum>
                <TdNum align='right'>100.0%</TdNum>
              </Tr>
            </tbody>
          </Table>
        </TableWrap>
      )}

      {showCohortSection && (
        <>
          <SectionHeading>Enrolments by Cohort</SectionHeading>

          {orderedCohorts.length === 0 || total === 0 ? (
            <Card>
              <p className="mb-0 text-sm text-muted">
                No cohort data is available for {yearLabel(year)} yet.
              </p>
            </Card>
          ) : (
            <Card>
              <BarChart
                rows={cohortRows}
                labelKey="label"
                series={[{ k: 'value', label: 'Enrolments', c: '#958EB8' }]}
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {orderedCohorts.map((cohort) => {
                  const share = pct(cohort.studentCount, total);
                  return (
                    <div
                      key={`${cohort.cohort ?? 'cohort'}-${cohort.studentCount}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2"
                    >
                      <span className="text-sm text-ink">{formatCohortLabel(cohort.cohort)}</span>
                      <span className="font-mono text-sm tabular-nums">
                        {fmt(cohort.studentCount)} · {share.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </>
  );
}
