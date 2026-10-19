/**
 * Canonical backend types — 1:1 with the VF MIS API OpenAPI (v1.0).
 *
 * Source: OpenAPI `components.schemas` + `paths` for
 *   /auth/*, /schools*, /students*, /ascg-profile*, /cbc-profile*,
 *   /programs*, /tracks*, /ascg|cbc|sc|program-participation*,
 *   /academics/*, /stats/*.
 *
 * Conventions:
 * - `Create*Dto` mirrors the spec exactly (required/optional preserved).
 * - `Update*Dto` in the spec is `{}` — typed here as `Partial<Create*Dto>`.
 * - Backend IDs are inconsistent in the spec (schools GET `string` vs
 *   PATCH/DELETE `number`; participation ids are `number`). `BackendId`
 *   covers both; normalise to `string` at the UI boundary when needed.
 * - List endpoints return bare arrays (`ApiList<T> = T[]`), NOT `Paged<T>`.
 *   `src/types/mis.ts` `Paged<T>` is a legacy UI-snapshot type — do not mix.
 * - `GET /auth/me`, `/stats/*`, login/register responses have no schema in
 *   the spec — marked with `TODO(spec-gap)` assumptions below.
 */

/* ── Common ─────────────────────────────────────────────────────────────── */

export type BackendId = string | number;

export interface Timestamped {
  id: BackendId;
  createdAt?: string;
  updatedAt?: string;
}

/** Backend list endpoints return bare arrays. */
export type ApiList<T> = T[];

/* ── Authentication ─────────────────────────────────────────────────────── */

export interface RegisterDto {
  /** Full name of the user. */
  name: string;
  /** Email address for the account. */
  email: string;
  /** Password for the account (min 8). */
  password: string;
}

export interface LoginDto {
  /** Email address used for login. */
  email: string;
  /** Account password (min 8). */
  password: string;
}

export interface RefreshTokenDto {
  /** Refresh token used to mint a new access token. */
  refreshToken: string;
}

export interface ResetPasswordDto {
  /** Password reset token from the email link. */
  token: string;
  /** New password to set for the account (min 8). */
  newPassword: string;
}

/**
 * TODO(spec-gap): `POST /auth/login`, `POST /auth/register`,
 * `POST /auth/refresh` and `GET /auth/me` have no response schema in the
 * spec. Assumed shape below — confirm against the backend source and adjust.
 */
export interface BackendUser {
  id: BackendId;
  name: string;
  email: string;
  /** Backend does not currently expose a role field; UI role lives in `src/lib/access.ts`. */
  role?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: BackendUser;
}

export interface RegisterResponse extends AuthTokens {
  user: BackendUser;
}

export interface RefreshResponse extends AuthTokens {
  user?: BackendUser;
}

export type AuthMeResponse = BackendUser;

/* ── Schools ────────────────────────────────────────────────────────────── */

export type SchoolCategory = 'junior' | 'senior';

export interface CreateSchoolDto {
  /** School identifier. */
  id: string;
  /** School name. */
  school: string;
  /** School category. */
  category: SchoolCategory;
}

export type UpdateSchoolDto = Partial<CreateSchoolDto>;

export interface School extends Timestamped {
  id: string;
  school: string;
  category: SchoolCategory;
}

export interface SchoolFilters {
  /** Filter schools by category. `GET /schools?category=` */
  category?: SchoolCategory;
}

/* ── Students ───────────────────────────────────────────────────────────── */

export interface CreateStudentDto {
  firstName: string;
  lastName: string;
  /** Date of birth in ISO format. */
  dateOfBirth: string;
  email?: string;
  phone?: string;
  address?: string;
  /** Country of origin. */
  country: string;
  /** Year the student joined the program. */
  yearJoined: number;
  /** Program identifier. */
  programId?: string;
}

export type UpdateStudentDto = Partial<CreateStudentDto>;

export interface Student extends Timestamped {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  country: string;
  yearJoined: number;
  programId?: string | null;
}

export interface StudentFilters {
  /** Filter by full name. `GET /students?name=` */
  name?: string;
  firstName?: string;
  lastName?: string;
}

/* ── ASCG Profile ───────────────────────────────────────────────────────── */

export interface CreateAscgProfileDto {
  studentId?: string;
  schoolId?: string;
  fatherLastName?: string;
  fatherFirstName?: string;
  fatherPhone?: string;
  fatherEducation?: string;
  motherLastName?: string;
  motherFirstName?: string;
  motherPhone?: string;
  motherEducation?: string;
  numberOfBrothers?: string;
  numberOfSisters?: string;
  positionInFamily?: string;
  specialization?: string;
  favouriteSubject?: string;
  mostDifficultSubject?: string;
  careerChoice1?: string;
  careerChoice2?: string;
  year?: number;
}

export type UpdateAscgProfileDto = Partial<CreateAscgProfileDto>;

export interface AscgProfile extends CreateAscgProfileDto, Timestamped {
  id: string;
}

/* ── CBC Profile ────────────────────────────────────────────────────────── */

export type CbcCohort = 'one' | 'two' | 'weekend';

export interface CreateCbcProfileDto {
  school?: string;
  priorTechEducation?: string;
  priorTechExperience?: string;
  track?: string;
  completedProgram?: boolean;
  outcomeAt6Months?: string;
  outcomeAt12Months?: string;
  roleTitle?: string;
  company?: string;
  industry?: string;
  techEngagementLevel?: string;
  cohort?: CbcCohort;
}

export type UpdateCbcProfileDto = Partial<CreateCbcProfileDto>;

export interface CbcProfile extends CreateCbcProfileDto, Timestamped {
  id: string;
}

/* ── Programs ───────────────────────────────────────────────────────────── */

export type ProgramType = 'ASCG' | 'CBC' | 'SC' | 'OUTREACH';

export interface CreateProgramDto {
  program: ProgramType;
  description: string;
}

export type UpdateProgramDto = Partial<CreateProgramDto>;

export interface Program extends Timestamped {
  id: string;
  program: ProgramType;
  description: string;
}

/* ── Tracks ─────────────────────────────────────────────────────────────── */

export interface CreateTrackDto {
  /** Track name. */
  track: string;
}

export type UpdateTrackDto = Partial<CreateTrackDto>;

export interface Track extends Timestamped {
  id: BackendId;
  track: string;
}

/* ── Participation ──────────────────────────────────────────────────────── */

export interface CreateAscgParticipationDto {
  studentId?: string;
  schoolId: string;
  year: number;
}

export type UpdateAscgParticipationDto = Partial<CreateAscgParticipationDto>;

export interface AscgParticipation extends Timestamped {
  id: number;
  studentId?: string | null;
  schoolId: string;
  year: number;
}

export interface CreateCbcParticipationDto {
  studentId?: string;
  track?: string;
  trackId?: string;
  cohort?: CbcCohort;
  year: number;
}

export type UpdateCbcParticipationDto = Partial<CreateCbcParticipationDto>;

export interface CbcParticipation extends Timestamped {
  id: number;
  studentId?: string | null;
  track?: string | null;
  trackId?: string | null;
  cohort?: CbcCohort | null;
  year: number;
}

export type ScCampType = 'ssc' | 'dsc';

export interface CreateScParticipationDto {
  studentId?: string;
  school?: string;
  type?: ScCampType;
  year: number;
}

export type UpdateScParticipationDto = Partial<CreateScParticipationDto>;

export interface ScParticipation extends Timestamped {
  id: number;
  studentId?: string | null;
  school?: string | null;
  type?: ScCampType | null;
  year: number;
}

export interface CreateProgramParticipationDto {
  studentId?: string;
  programId: string;
  year: number;
}

export type UpdateProgramParticipationDto = Partial<CreateProgramParticipationDto>;

export interface ProgramParticipation extends Timestamped {
  id: number;
  studentId?: string | null;
  programId: string;
  year: number;
}

export interface ProgramParticipationFilters {
  /** Filter by year. `GET /program-participation?year=` */
  year?: string;
  /** Filter by program id. */
  programId?: string;
}

/* ── Academics ──────────────────────────────────────────────────────────── */

export type AcademicTerm = 'Term 1' | 'Term 2' | 'Term 3';

export interface CreateAcademicsDto {
  year: number;
  improved: number;
  stable: number;
  declined: number;
}

export type UpdateAcademicsDto = Partial<CreateAcademicsDto>;

export interface AcademicsRecord extends CreateAcademicsDto, Timestamped {
  id: number;
}

export interface CreateGpaDto {
  year: number;
  term: AcademicTerm;
  gpa: number;
  numberOfRecords: number;
  percentage: number;
}

export type UpdateGpaDto = Partial<CreateGpaDto>;

export interface GpaRecord extends CreateGpaDto, Timestamped {
  id: number;
}

export interface CreateGradeDto {
  year: number;
  subject: string;
  paired: string;
  term1: number;
  term2: number;
  term3: number;
  improved: number;
  stable: number;
  declined: number;
}

export type UpdateGradeDto = Partial<CreateGradeDto>;

export interface GradeRecord extends CreateGradeDto, Timestamped {
  id: number;
}

export interface CreatePerformanceDto {
  year: number;
  term: AcademicTerm;
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

export type UpdatePerformanceDto = Partial<CreatePerformanceDto>;

export interface PerformanceRecord extends CreatePerformanceDto, Timestamped {
  id: number;
}

export interface CreateAcademicsBatchDto {
  academics: CreateAcademicsDto[];
  gpa: CreateGpaDto[];
  grades: CreateGradeDto[];
  performance: CreatePerformanceDto[];
}

export interface AcademicsYearFilters {
  /**
   * NOTE(spec-bug): spec declares `year` as `in: path` for
   * `GET /academics/by-year` and `GET /academics/summary`, but the route has
   * no `{year}` segment — send as `?year=`. Confirm with backend.
   */
  year: number;
}

/**
 * TODO(spec-gap): `GET /academics/by-year` and `/academics/summary` have no
 * response schema. Loose placeholders until the backend documents them.
 */
export type AcademicsByYearResponse = Record<string, unknown>;
export type AcademicsSummaryResponse = Record<string, unknown>;

/**
 * `GET /stats/overview` returns headline KPIs. Mirrors `OverviewPayload`
 * in `src/types/mis.ts`; verified against the live backend.
 */
export interface StatsOverviewResponse {
  students: number;
  participation: number;
  schools: number;
}

/** One row of the `GET /stats/reach` yearly series. */
export interface StatsReachYearly {
  year: number;
  uniqueStudents: number;
  returningStudents: number;
}

/** One row of the `GET /stats/reach` per-programme breakdown. */
export interface StatsReachProgram {
  id: string;
  program: string;
  description: string;
  uniqueStudents: number;
  totalParticipations: number;
  returningParticipations: number;
  since: number | null;
}

/**
 * `GET /stats/reach` returns `{ yearly, programs }`. Mirrors `ReachPayload`
 * in `src/types/mis.ts`; verified against the live backend.
 */
export interface StatsReachResponse {
  yearly: StatsReachYearly[];
  programs: StatsReachProgram[];
}

/* ── Health ─────────────────────────────────────────────────────────────── */

export type HealthResponse = string | Record<string, unknown> | void;
