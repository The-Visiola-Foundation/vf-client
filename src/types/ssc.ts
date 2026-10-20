/**
 * STEM Camps (SSC) backend types.
 *
 * TODO(spec-gap): `GET /ssc/camps`, `GET /ssc/camps/:campId/impact`,
 * `GET /ssc/years/:year/rollup` and `GET /ssc/compare` have no response
 * schema in the local API spec. Shapes below follow the two-phase spec and
 * must be confirmed against the NestJS backend source before the real
 * endpoints go live. Adjust only these types when the backend documents them.
 */

/* ── Camps list ─────────────────────────────────────────────────────────── */

/** One camp record as returned by `GET /ssc/camps`. */
export interface SscCamp {
  id: string;
  /** Human-readable camp name, e.g. "Summer STEM Camp 2026". */
  name: string;
  /** Camp type, e.g. "summer" | "december". */
  type: string;
  /** Calendar year the camp ran in. */
  year: number;
  /** How many participant records exist for this camp (backend-computed). */
  participants: number;
  /** `true` when impact/rollup data has been loaded for this camp. */
  hasResults: boolean;
}

/** `GET /ssc/camps` -> SscCamp[] (bare array, like other list endpoints). */
export type SscCampsResponse = SscCamp[];

/* ── Camp impact ────────────────────────────────────────────────────────── */

export interface SscSelfEfficacyRow {
  statement: string;
  /** Share of participants who agreed, 0-100. Blank when never collected. */
  agreePct: number | null;
  n: number;
}

export interface SscAssessment {
  /** Average pre-camp score on the camp's knowledge scale. */
  preAverage: number | null;
  /** Average post-camp score on the camp's knowledge scale. */
  postAverage: number | null;
  /** Participants with both pre and post scores. */
  matchedN: number;
}

export interface SscObservation {
  /** Facilitator-rated average, 0-5 scale. Blank when never collected. */
  engagementAverage: number | null;
  n: number;
}

export interface SscFeedbackTheme {
  theme: string;
  mentions: number;
}

export interface SscProject {
  title: string;
  /** Short description. Blank when not captured. */
  description: string | null;
}

export interface SscAward {
  award: string;
  recipient: string;
}

export interface SscPartner {
  name: string;
  contribution: string;
}

export interface SscExpenseLine {
  item: string;
  /** Amount in the camp's currency. Blank when not captured. */
  amount: number | null;
}

export interface SscRecommendation {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

/** `GET /ssc/camps/:campId/impact` -> SscImpactPayload | null. */
export interface SscImpactPayload {
  campId: string;
  campName: string;
  participants: number;
  /** Unique girls reached (counted once across camps in a year). */
  girlsReached: number | null;
  selfEfficacy: SscSelfEfficacyRow[];
  assessment: SscAssessment;
  observation: SscObservation;
  feedbackThemes: SscFeedbackTheme[];
  projects: SscProject[];
  awards: SscAward[];
  partners: SscPartner[];
  expenses: SscExpenseLine[];
  currency: string | null;
  recommendations: SscRecommendation[];
}

/* ── Year rollup ────────────────────────────────────────────────────────── */

/** `GET /ssc/years/:year/rollup` -> SscYearRollup | null. */
export interface SscYearRollup {
  year: number;
  camps: SscCamp[];
  totalCamps: number;
  campsWithResults: number;
  participants: number;
  girlsReached: number | null;
}

/* ── Core-measure comparison ───────────────────────────────────────────── */

/** One core measure row from `GET /ssc/compare?core=<core_code>`. */
export interface SscCompareRow {
  coreCode: string;
  coreLabel: string;
  /** Year-over-year average for this core measure. Blank when never collected. */
  average: number | null;
  n: number;
  trend: 'up' | 'down' | 'flat' | null;
}

/** `GET /ssc/compare?core=<core_code>` -> SscCompareRow[] (bare array). */
export type SscCompareResponse = SscCompareRow[];

/* ── Derived view helpers ───────────────────────────────────────────────── */

/** Which of the three views the page should render given two camps. */
export type SscView = 'single' | 'empty' | 'both';

/**
 * Classify the view from camp availability.
 * - 'empty': neither camp has results → show the empty state.
 * - 'single': exactly one camp has results → render that camp.
 * - 'both': both camps have results → render both, with a notice if one is missing.
 */
export function sscView(camps: SscCamp[]): SscView {
  const withResults = camps.filter((c) => c.hasResults);
  if (withResults.length === 0) return 'empty';
  if (withResults.length === 1) return 'single';
  return 'both';
}

/**
 * Camp used by the single-camp view. Falls back to the first camp when none
 * has results (caller should gate on view === 'single'/'both').
 */
export function primaryCamp(camps: SscCamp[]): SscCamp | null {
  return camps.find((c) => c.hasResults) ?? camps[0] ?? null;
}