/**
 * Board + governance resources. Aggregate-only by contract: this module never
 * returns names, contacts, or individual records. Serve from reporting views
 * / a separate schema + DB role server-side.
 *
 *   GET /stats/board                     -> BoardData
 *   GET /stats/finance/spend?programme=&year= -> ProgrammeSpend[]
 *   GET /stats/metrics-proposals              -> MetricProposal[]
 */
import type {
  BoardData,
  MetricProposal,
  ProgrammeSpend,
  ProgrammeSpendParams,
} from '../../types/mis';
import { isBackendConfigured } from './config';
import { api } from './client';
import { getOrFallback, withParams } from './shared';

export async function fetchBoardSummary(signal?: AbortSignal): Promise<BoardData> {
  return getOrFallback('/stats/board', { signal }, (s) => ({
    ASCG: {
      uniqueStudents: s.totals.unique_students,
      totalParticipations: s.totals.enrolments,
      returningParticipations: s.totals.enrolments - s.totals.unique_students,
      since: 2018,
      program: 'ASCG',
      description: 'After-School STEM Clubs for Girls',
    },
    OUTREACH: {
      uniqueStudents: 0,
      totalParticipations: 0,
      returningParticipations: 0,
      since: null,
      program: 'OUTREACH',
      description: 'Outreach program',
    },
    CBC: {
      uniqueStudents: 0,
      totalParticipations: 0,
      returningParticipations: 0,
      since: null,
      program: 'CBC',
      description: 'Coding Boot Camp',
    },
    SC: {
      uniqueStudents: 0,
      totalParticipations: 0,
      returningParticipations: 0,
      since: null,
      program: 'SC',
      description: 'STEM Clinic',
    },
    consentRate: '0%',
  }));
}

export async function fetchProgrammeSpend(
  params: ProgrammeSpendParams = {},
  signal?: AbortSignal,
): Promise<ProgrammeSpend[]> {
  if (!isBackendConfigured) return [];
  return api.get<ProgrammeSpend[]>(withParams('/stats/finance/spend', params), { signal });
}

export async function fetchMetricProposals(signal?: AbortSignal): Promise<MetricProposal[]> {
  return getOrFallback('/stats/metrics-proposals', { signal }, () => []);
}
