export type MatchStatus = 'confirmed' | 'ambiguous' | 'unmatched';
export type Band = 'Improved' | 'Stable' | 'Declined';
export type Severity = 'error' | 'warning';


export enum AcademicTerm {
  TERM_1 = 'Term 1',
  TERM_2 = 'Term 2',
  TERM_3 = 'Term 3',
}

/**
 * Legacy UI-snapshot types (snake_case, derived from `mis-dashboard.json`).
 *
 * @deprecated Prefer `src/types/backend.ts` (canonical OpenAPI DTOs) for any
 * new backend integration. This file stays for the UI-only fallback pages
 * until `src/lib/api/*` is migrated to the real paths.
 */

/** Editable cells may hold a string (what an operator types) or a number. */
export type CellValue = string | number | boolean | null;

export interface Totals {
  unique_students: number;
  source_rows: number;
  enrolments: number;
  schools: number;
  confirmed: number;
  ambiguous: number;
  unmatched: number;
  cohort: number;
  issues: number;
  errors: number;
}

export interface ReachRow {
  year_joined: number;
  participations: number;
  new_students: number;
  returning: number;
  unique_students: number;
}

export interface CompletenessRow {
  field: string;
  filled: number;
  total: number;
  pct: number;
}

export interface TermRow {
  term: number;
  mean: number;
  n: number;
  completeness: number;
}

export interface Progress {
  improved: number;
  stable: number;
  declined: number;
  assessed: number;
  cohort: number;
}

export interface BandCounts {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

export interface SubjectRow {
  subject: string;
  n: number;
  term1: number | null;
  term2: number | null;
  term3: number | null;
  improved: number;
  stable: number;
  declined: number;
  pct_improved: number | null;
}

export interface RosterRow {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  dob?: string | null;
  age?: number | null;
  email?: string | null;
  phone?: string | null;
  school?: string | null;
  country?: string | null;
  parentalConsent?: boolean | null;
  [key: string]: unknown;
}

export interface IssueSummaryRow {
  severity: Severity;
  field: string;
  n: number;
}

export interface IssueRow {
  entity: string;
  ref: string;
  field: string;
  issue: string;
  action: string;
  severity: Severity;
}

export interface BandByTerm {
  term1: BandCounts;
  term2: BandCounts;
  term3: BandCounts;
}

/* ── Per-page API contracts ────────────────────────────────────────────
   These mirror the endpoint table in before-coding.readme §10. Each payload
   is derivable from `MisData` in UI-only mode; the resource modules in
   `src/lib/api/` document the matching HTTP path. */

export interface Paged<T> {
  data: T[];
  totalCount: number;
  page: number;
  page_size: number;
  limit?: number;
  totalPages?: number;
}

export interface PageParams {
  page?: number;
  page_size?: number;
}

export interface ByField {
  field: string;
  emptyFields: number;
  filledFields: number
}

export interface ASCGFields {
  totalfields: number;
  emptyFields: number;
  filledFields: number;
  byField: ByField[]
}

/** Overview page: headline totals + field completeness gauges. */
export interface OverviewPayload {
  students: number;
  participation: number;
  schools: number;
  ascgProfileFieldCompletion: ASCGFields
}



export interface YearlyStat {
  year: number;
  newStudents: number;
  returningStudents: number;
  unclassifiedStudents: number;
};

export interface ProgramStat {
  uniqueStudents: number;
  totalParticipations: number;
  returningParticipations: number;
  since: number | null;
  id: string;
  program: string;
  description: string;
};

/** Reach page: enrolment split by year joined. */
export interface ReachPayload {
  yearly: {
    yearlyStats: YearlyStat[],
    totals: {
      uniqueStudents: number;
      returningStudents: number;
      totalParticipations: number;
    }
  };
  programs: ProgramStat[];
}

export interface ReachParams {
  year_from?: number;
  year_to?: number;
  programme?: string;
}

/** ASCG academic page: term means, progress split, bands, subjects. */
export interface AscgAcademicParams {
  year?: number;
}


/* ── Coding Boot Camp ───────────────────────────────────────────────── */

export type CbcTrack = 'full-stack' | 'data' | 'ui-ux' | 'other';

export interface CbcSummary {
  enrolled: number | null;
  completed: number | null;
  employed_6mo: number | null;
  employed_12mo: number | null;
  unemployed_12mo: number | null;
  further_education: number | null;
  engaged_full: number | null;
  engaged_partial: number | null;
  median_months_to_role: number | null;
  response_rate: number | null;
}

export interface CbcGraduate {
  id: string;
  name: string | null;
  track: CbcTrack | null;
  prior_tech_education: string | null;
  prior_tech_experience: string | null;
  completed_programme: boolean | null;
  graduated_at: string | null;
}

export interface CbcOutcome {
  id: string;
  graduate_id: string;
  months_after: 6 | 12;
  outcome: string | null;
  role_title: string | null;
  company: string | null;
  industry: string | null;
  tech_engagement: string | null;
}

export interface CbcGraduateParams extends PageParams {
  track?: CbcTrack;
  outcome?: string;
}

export interface CbcOutcomeParams {
  year?: number;
}

export type NewCbcGraduate = Partial<Omit<CbcGraduate, 'id'>>;
export type CbcGraduatePatch = Partial<Omit<CbcGraduate, 'id'>>;
export type NewCbcOutcome = Partial<Omit<CbcOutcome, 'id'>>;

/* ── Student register ──────────────────────────────────────────────── */

export interface RegisterFilters extends PageParams {

  name?: string;
  firstName?: string;
  lastName?: string;
  limit?: number;
  page_size?: number;
  school?: string;
  match?: MatchStatus;
  missing_consent?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

export type RegisterPage = Paged<RosterRow>;

export interface RegisterCellPatch {
  uid: string;
  field: string;
  value: string | null;
}

export interface RegisterEditInput {
  uid: string;
  field: string;
  value: string | null;
}

/* ── Data quality ──────────────────────────────────────────────────── */

export interface QualitySummary {
  issues: number;
  errors: number;
  warnings: number;
  ambiguous: number;
  issueSummary: IssueSummaryRow[];
}

export interface QualityIssuesParams extends PageParams {
  severity?: Severity;
  field?: string;
}

/* ── Board summary (aggregate-only by contract) ────────────────────── */

export interface BoardSummaryPayload {
  unique_students: number;
  schools: number;
  improved_pct: number | null;
  assessed: number;
  consent_pct: number | null;
  reach_by_year: ReachRow[];
  outcome_split: Progress;
  terms: TermRow[];
}

export interface ProgrammeSpendParams {
  programme?: string;
  year?: number;
}

export interface ProgrammeSpend {
  programme: string;
  year: number;
  spend: number | null;
  currency: string;
}

/* ── Metrics to add (static today, editable later) ─────────────────── */

export interface MetricProposal {
  metric: string;
  type: string;
  rationale: string;
  status?: 'proposed' | 'planned' | 'live';
}


export interface MisData {
  generated: string;
  totals: Totals;
  reach: ReachRow[];
  completeness: CompletenessRow[];
  terms: TermRow[];
  progress: Progress;
  performance: Record<string, number>;
  bandByTerm: BandByTerm;
  subjects: SubjectRow[];
  roster: RosterRow[];
  issues: IssueRow[];
  issueSummary: IssueSummaryRow[];
  schools: string[];
}


export interface RegisterData {
  data: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    age: number | null;
    email: string | undefined;
    phone: string | undefined;
    country: string;
    school: string | null;
    parentalConsent: boolean | null;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BoardData {
  ASCG: {
    uniqueStudents: number;
    totalParticipations: number;
    returningParticipations: number;
    since: number | null;
    program: string;
    description: string;
    schools: number;
    academics: Academic[]
  };

  CBC: {
    uniqueStudents: number;
    totalParticipations: number;
    returningParticipations: number;
    since: number | null;
    trackCount: number;
    program: string;
    description: string;
  };

  SC: {
    uniqueStudents: number;
    totalEnrolments: number;
    studentsWithRepeatEnrolments: number;
    since: number | null;
    program: string;
    description: string;
    sscEnrolments: number;
    dscEnrolments: number;
  };
  studentCountByYear: { year: number, count: string }[];
  students: number;
  countries: { country: string; studentCount: number }[],
  consent: {
    totalStudents: number,
    studentsWithConsent: number,
    consentRate: number
  }

}

export interface Academic {
  "id": number,
  "year": number,
  "improved": number,
  "stable": number,
  "declined": number
}

export interface GPA {
  "id": number,
  "year": number,
  "term": string,
  "gpa": string,
  "numberOfRecords": number,
  "percentage": string
}

export interface Performance {
  "id": number,
  "year": number,
  "term": AcademicTerm,
  "excellent": number,
  "good": number,
  "fair": number,
  "poor": number
}

export interface Grade {
  id: number,
  year: number,
  subject: string,
  paired: number,
  term1: number,
  term2: number,
  term3: number,
  improved: number,
  stable: number,
  declined: number
}

export interface SchoolStat {
  schoolId: string;
  school: string;
  category: "senior" | "junior",
  studentCount: number
}

export interface AscgAcademicResponse {
  "year": number,
  "summary": {
    "year": number,
    "improved": number,
    "stable": number,
    "declined": number,
    "netGpaChange": string,
    "totalRecords": number,
    "averageGpa": number,
    "totalParticipation": number,
    "uniqueParticipation": number,
    "returningParticipation": number
  },
  "records": {
    "academics": Academic[],
    "gpa": GPA[],
    "grades": Grade[],
    "performance": Performance[]

  },
  "gpaTrend": Omit<GPA, "id" | "year">[],
  "movementBySubject": [],
  "performanceByTerm": Omit<Performance, "id" | "year">[],
  schoolStats: SchoolStat[]
}

export enum Cohort {
  ONE = 'one',
  TWO = 'two',
  WEEKEND = 'weekend'
}


export interface CbcResponse {
  year: number;
  total: number,
  uniqueCount: number,
  tracks: { trackId: string; trackName: string; studentCount: number }[];
  cohortsBreakdown?: { cohort: Cohort; studentCount: number }[];
}

type campType = 'ssc' | 'dsc'

export interface Metric {
  id: number;
  year: number;
  type: campType;
  metricName: string;
  category: "Core" | "Camp-specific";
  baselineScore: string;
  endlineScore: string;
  change: string;
  pValue: string;
  count: number;
  improved: number;
  stable: number;
  declined: number;
}

export interface SCResponse {
  year: number;
  total: number;
  sscCount: number;
  dscCount: number;
  metrics: Metric[]
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  country: string | null;
  yearJoined: number | null;
  consent: boolean;
  combo: string | null;

  ascgProfile: ASCGProfile | null;
  cbcProfile: CBCProfile | null;

  ascgParticipation: ASCGParticipation[];
  cbcParticipation: CBCParticipation[];
  scParticipation: SCParticipation[];
}

export interface ASCGProfile {
  id: number;
  studentId: string;
  examCode: string | null;
  schoolId: string | null;
  fatherLastName: string | null;
  fatherFirstName: string | null;
  fatherPhone: string | null;
  fatherEducation: string | null;
  motherLastName: string | null;
  motherFirstName: string | null;
  motherPhone: string | null;
  motherEducation: string | null;
  numberOfBrothers: number | null;
  numberOfSisters: number | null;
  positionInFamily: string | null;
  specialization: string | null;
  favouriteSubject: string | null;
  mostDifficultSubject: string | null;
  careerChoice1: string | null;
  careerChoice2: string | null;
  parentalConsent: boolean | null;
  year: number | null;
}

export interface CBCProfile {
  id: number;
  studentId: string;
  school: string | null;
  priorTechEducation: string | null;
  priorTechExperience: string | null;
  completedProgram: boolean | null;
  outcomeAt6Months: string | null;
  outcomeAt12Months: string | null;
  roleTitle: string | null;
  company: string | null;
  industry: string | null;
  techEngagementLevel: string | null;
  track: string | null;
  cohort: string | null;
}

export interface ASCGParticipation {
  id: number;
  studentId: string;
  schoolId: string;
  type: string;
  class: string;
  year: number;
  schoolName: string | null;
}

export interface CBCParticipation {
  id: number;
  studentId: string;
  cohort: string | number;
  trackId: string;
  track: string | null;
  year: number;
}

export interface SCParticipation {
  id: number;
  studentId: string;
  theme: string;
  type: string;
  year: number;
}

export interface School {
  id: string;
  school: string;
  schoolCode: string;
  category: 'junior' | 'senior';
}