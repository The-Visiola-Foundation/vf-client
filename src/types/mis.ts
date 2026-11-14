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
  uid: string;
  first?: string | null;
  last?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  dob?: string | null;
  age?: number | null;
  email?: string | null;
  phone?: string | null;
  school?: string | null;
  match?: MatchStatus | string;
  legacy?: string | null;
  dobFlag?: boolean | null;
  father?: string | null;
  mother?: string | null;
  fatherEdu?: string | null;
  fatherEmp?: string | null;
  motherEdu?: string | null;
  motherEmp?: string | null;
  sis?: string | null;
  bro?: string | null;
  consent?: boolean | null;
  fav?: string | null;
  diff?: string | null;
  car1?: string | null;
  car2?: string | null;
  t1?: string | null;
  t2?: string | null;
  t3?: string | null;
  band?: string | null;
  country?: string | null;
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
  items: T[];
  total: number;
  page: number;
  page_size: number;
  limit?: number;
  totalPages?: number;
}

export interface PageParams {
  page?: number;
  page_size?: number;
}

/** Overview page: headline totals + field completeness gauges. */
export interface OverviewPayload {
  students: number;
  participation: number;
  schools: number;
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
  months_after?: 6 | 12;
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
  };
  OUTREACH: {
    uniqueStudents: number;
    totalParticipations: number;
    returningParticipations: number;
    since: number | null;
    program: string;
    description: string;
  };
  CBC: {
    uniqueStudents: number;
    totalParticipations: number;
    returningParticipations: number;
    since: number | null;
    program: string;
    description: string;
  };
  SC: {
    uniqueStudents: number;
    totalParticipations: number;
    returningParticipations: number;
    since: number | null;
    program: string;
    description: string;
  };
  consentRate: string;
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
    "ascgParticipationCount": number
  },
  "records": {
    "academics": Academic[],
    "gpa": GPA[],
    "grades": [],
    "performance": Performance[]

  },
  "gpaTrend": Omit<GPA, "id" | "year">[],
  "movementBySubject": [],
  "performanceByTerm": Omit<Performance, "id" | "year">[],
}