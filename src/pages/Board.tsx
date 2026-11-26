import type { BoardData } from '../types/mis';
import { fmt } from '../lib/format';
import { Card, EmptyState, Kpi } from '../components/ui/primitives';
import {
  Eyebrow,
  Grid2,
  Grid4,
  Heading,
  Lede,
  PageTitle,
  SectionHeading,
} from '../components/ui/layout';
import { BarChart, StackBar } from '../components/ui/charts';

const DASH = '–';

/**
 * KPI accent colours.
 * Each programme has one colour, used for every KPI in its card, so a colour
 * means "this programme". Outcome and status KPIs are the exception:
 * green = good result / consent on file, red = data gap.
 */
const ACCENT = {
  overall: 'blue',
  ascg: 'blue',
  cbc: 'purple',
  sc: 'green',
  good: 'green',
  gap: 'red',
} as const;

// "south africa" -> "South Africa"
const titleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export function Board({ data }: { data: BoardData }) {
  const { ASCG, CBC, SC, consent, studentCountByYear } = data;
  const schools = ASCG?.schools;
  const since = ASCG?.since;

  // ---- ASCG academic outcome (latest cohort) -------------------------------
  const academic = [...(ASCG?.academics ?? [])].sort((a, b) => b.year - a.year)[0];
  const studentsAnalysed = academic
    ? academic.improved + academic.stable + academic.declined
    : 0;
  const hasAcademic = !!academic && studentsAnalysed > 0;
  const improvedPct = hasAcademic
    ? ((academic.improved / studentsAnalysed) * 100).toFixed(1)
    : null;

  // ---- Countries ------------------------------------------------------------
  const countries = [
    ...new Set(
      (data?.countries ?? [])
        .map((x) => x.country?.trim().toLowerCase())
        .filter((x): x is string => Boolean(x)),
    ),
  ].map(titleCase);

  // ---- Parental consent: "not recorded" is different from 0% ----------------
  // consentRate is a number. null/undefined means no data yet; 0 is a real 0%.
  const consentRate = consent?.consentRate;
  const consentRecorded = consentRate !== null && consentRate !== undefined;
  const consentText = consentRecorded ? `${consentRate}%` : 'Not recorded';

  // ---- STEM Camps -----------------------------------------------------------
  const hasSsc = Number(SC?.sscEnrolments) > 0;
  const hasDsc = Number(SC?.dscEnrolments) > 0;

  return (
    <>
      <Eyebrow>Governance · aggregate figures only</Eyebrow>
      <PageTitle>Board summary</PageTitle>
      <Lede>
        Reach, academic outcomes and data gaps across all programmes. Aggregate figures
        only; no individual records are shown.
      </Lede>

      {/* Headline figures */}
      <Grid2>
        <Kpi
          label="Unique students"
          value={fmt(data.students)}
          accent={ACCENT.overall}
          sub="Each girl counted once, across all years and programmes"
        />
        <Kpi
          label="Countries"
          value={fmt(countries.length)}
          accent={ACCENT.overall}
          sub={countries.length ? countries.join(', ') : DASH}
        />
      </Grid2>

      {/* Headline trend */}
      <div className="mt-3.5">
        <Card>
          <Heading>First-time students by year</Heading>
          <BarChart
            rows={studentCountByYear ?? []}
            labelKey="year"
            series={[{ k: 'count', label: 'First-time students', c: '#00A3DA' }]}
          />
          <p className="mb-0 mt-2 text-[12.5px] text-muted">
            Each girl is counted once, in the year she first enrolled.
          </p>
        </Card>
      </div>

      <SectionHeading>Breakdown by programme</SectionHeading>

      <div className="space-y-3.5">
        {/* ASCG */}
        <Card>
          <Heading>Afterschool STEM Clubs for Girls (ASCG)</Heading>
          <Grid4>
            <Kpi
              label="ASCG · unique students"
              value={fmt(ASCG?.uniqueStudents ?? 0)}
              sub={since != null ? `Since ${since}` : 'Start year not recorded'}
              accent={ACCENT.ascg}
            />
            <Kpi
              label="Schools"
              value={schools != null ? fmt(schools) : DASH}
              sub="Schools reached in the FCT"
              accent={ACCENT.ascg}
            />
            <Kpi
              label="Improved GPA, term 1 to 3"
              value={improvedPct !== null ? `${improvedPct}%` : DASH}
              sub={
                hasAcademic
                  ? `${academic.year} cohort · n = ${fmt(studentsAnalysed)} students with both terms`
                  : 'No academic results yet'
              }
              accent={hasAcademic ? ACCENT.good : ACCENT.ascg}
            />
            <Kpi
              label="Parental consent on file"
              value={consentText}
              sub={
                consentRecorded
                  ? 'Of ASCG students, parental consent on file'
                  : 'Consent is not yet captured in the register'
              }
              accent={consentRecorded ? ACCENT.good : ACCENT.gap}
            />
          </Grid4>

          {hasAcademic && (
            <div className="mt-4">
              <Heading>Change in GPA, term 1 to term 3 · {academic.year} cohort</Heading>
              <StackBar
                total={studentsAnalysed}
                segments={[
                  { label: 'Improved', v: academic.improved, c: '#9EC83E' },
                  { label: 'Stable', v: academic.stable, c: '#958EB8' },
                  { label: 'Declined', v: academic.declined, c: '#D8232A' },
                ]}
              />
            </div>
          )}
        </Card>

        {/* Coding Boot Camp */}
        <Card>
          <Heading>Coding Boot Camp (CBC)</Heading>
          <Grid2>
            <Kpi
              label="Coding Boot Camp · unique students"
              value={fmt(CBC?.uniqueStudents)}
              accent={ACCENT.cbc}
              sub={CBC?.since != null ? `Since ${CBC.since}` : 'Start year not recorded'}
            />
            <Kpi
              label="Learning tracks"
              value={fmt(CBC?.trackCount)}
              accent={ACCENT.cbc}
              sub={CBC?.since != null ? `Offered since ${CBC.since}` : DASH}
            />
          </Grid2>
        </Card>

        {/* STEM Camps */}
        <Card>
          <Heading>STEM Camps</Heading>
          <Grid4>
            <Kpi
              label="Unique students"
              value={fmt(SC?.uniqueStudents)}
              accent={ACCENT.sc}
              sub="Each girl counted once, across summer and December camps"
            />
            <Kpi
              label="Total enrolments"
              value={fmt(SC?.totalEnrolments)}
              accent={ACCENT.sc}
              sub="A girl attending more than one camp is counted each time"
            />
            <Kpi
              label="Students with repeat enrolments"
              value={fmt(SC?.studentsWithRepeatEnrolments)}
              accent={ACCENT.sc}
              sub="Girls who attended more than one camp"
            />
          </Grid4>

          {(hasSsc || hasDsc) && (
            <div className="mt-3.5">
              <Grid2>
                {hasSsc && (
                  <Kpi
                    label="STEM Summer Camp"
                    value={fmt(SC?.sscEnrolments)}
                    accent={ACCENT.sc}
                    sub="Enrolments in the summer camp"
                  />
                )}
                {hasDsc && (
                  <Kpi
                    label="December STEM Camps"
                    value={fmt(SC?.dscEnrolments)}
                    accent={ACCENT.sc}
                    sub="Enrolments in the December camps"
                  />
                )}
              </Grid2>
            </div>
          )}
        </Card>
      </div>

      <SectionHeading>Cost per outcome</SectionHeading>
      <EmptyState title="Cost per outcome not available yet">
        Annual spend per programme is needed to calculate cost per student and cost per
        improved student.
      </EmptyState>
    </>
  );
}