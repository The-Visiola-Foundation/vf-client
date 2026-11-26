/**
 * Write operations for the student detail page. The API exposes separate
 * resources for the student, profiles, and programme enrolments.
 */
import { api } from './client';
import { isBackendConfigured } from './config';

type Nullable<T> = T | null;

export interface StudentDetailsPayload {
  firstName?: Nullable<string>;
  lastName?: Nullable<string>;
  dateOfBirth?: Nullable<string>;
  email?: Nullable<string>;
  phone?: Nullable<string>;
  address?: Nullable<string>;
  country?: Nullable<string>;
  yearJoined?: Nullable<number>;
  consent?: Nullable<boolean>;
}

export interface AscgProfilePayload {
  schoolId?: Nullable<string>;
  fatherLastName?: Nullable<string>;
  fatherFirstName?: Nullable<string>;
  fatherPhone?: Nullable<string>;
  fatherEducation?: Nullable<string>;
  motherLastName?: Nullable<string>;
  motherFirstName?: Nullable<string>;
  motherPhone?: Nullable<string>;
  motherEducation?: Nullable<string>;
  numberOfBrothers?: Nullable<number>;
  numberOfSisters?: Nullable<number>;
  positionInFamily?: Nullable<string>;
  specialization?: Nullable<string>;
  favouriteSubject?: Nullable<string>;
  mostDifficultSubject?: Nullable<string>;
  careerChoice1?: Nullable<string>;
  careerChoice2?: Nullable<string>;
  parentalConsent?: Nullable<boolean>;
  year?: Nullable<number>;
}

export interface CbcProfilePayload {
  school?: Nullable<string>;
  priorTechEducation?: Nullable<string>;
  priorTechExperience?: Nullable<string>;
  track?: Nullable<string>;
  completedProgram?: Nullable<boolean>;
  outcomeAt6Months?: Nullable<string>;
  outcomeAt12Months?: Nullable<string>;
  roleTitle?: Nullable<string>;
  company?: Nullable<string>;
  industry?: Nullable<string>;
  techEngagementLevel?: Nullable<string>;
  cohort?: Nullable<string>;
}

export interface AscgParticipationPayload {
  schoolId: string;
  type?: Nullable<string>;
  year: number;
}

export interface CbcParticipationPayload {
  track?: Nullable<string>;
  trackId?: Nullable<string>;
  cohort?: Nullable<string>;
  year: number;
}

export interface ScParticipationPayload {
  school?: Nullable<string>;
  type?: Nullable<string>;
  year: number;
}

export type StudentSectionSaveInput =
  | { type: 'ascg-profile'; studentId: string; recordId?: string | number; payload: AscgProfilePayload }
  | { type: 'cbc-profile'; studentId: string; recordId?: string | number; payload: CbcProfilePayload }
  | {
      type: 'ascg-participation';
      studentId: string;
      recordId?: string | number;
      payload: AscgParticipationPayload;
    }
  | {
      type: 'cbc-participation';
      studentId: string;
      recordId?: string | number;
      payload: CbcParticipationPayload;
    }
  | { type: 'sc-participation'; studentId: string; recordId?: string | number; payload: ScParticipationPayload };

function createOrUpdate<T>(
  collectionPath: string,
  studentId: string,
  recordId: string | number | undefined,
  payload: T,
): Promise<unknown> {
  if (!isBackendConfigured) return Promise.resolve(undefined);
  return recordId === undefined
    ? api.post(collectionPath, { studentId, ...payload })
    : api.patch(`${collectionPath}/${encodeURIComponent(String(recordId))}`, payload);
}

export function saveStudentSection(input: StudentSectionSaveInput): Promise<unknown> {
  switch (input.type) {
    case 'ascg-profile':
      return createOrUpdate('/ascg-profile', input.studentId, input.recordId, input.payload);
    case 'cbc-profile':
      return createOrUpdate('/cbc-profile', input.studentId, input.recordId, input.payload);
    case 'ascg-participation':
      return createOrUpdate('/ascg-participation', input.studentId, input.recordId, input.payload);
    case 'cbc-participation':
      return createOrUpdate('/cbc-participation', input.studentId, input.recordId, input.payload);
    case 'sc-participation':
      return createOrUpdate('/sc-participation', input.studentId, input.recordId, input.payload);
  }
}
