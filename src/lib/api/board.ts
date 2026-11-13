/**
 * Board + governance resources. Aggregate-only by contract: this module never
 * returns names, contacts, or individual records. Serve from reporting views
 * / a separate schema + DB role server-side.
 *
 *   GET /stats/board                     -> BoardSummaryPayload
 *   GET /stats/finance/spend?programme=&year= -> ProgrammeSpend[]
 *   GET /stats/metrics-proposals              -> MetricProposal[]
 */
import type {
  BoardSummaryPayload,
  MetricProposal,
  ProgrammeSpend,
  ProgrammeSpendParams,
} from '../../types/mis';
import { isBackendConfigured } from './config';
import { apiRequest } from './client';
import { getOrFallback, withParams } from './shared';

export async function fetchBoardSummary(signal?: AbortSignal): Promise<BoardSummaryPayload> {
  return getOrFallback('/stats/board', { signal }, (s) => ({
    unique_students: s.totals.unique_students,
    schools: s.totals.schools,
    improved_pct:
      s.progress.assessed > 0 ? (s.progress.improved / s.progress.assessed) * 100 : null,
    assessed: s.progress.assessed,
    // Consent was never collected — surface the gap, not a zero.
    consent_pct: null,
    reach_by_year: s.reach,
    outcome_split: s.progress,
    terms: s.terms,
  }));
}

export async function fetchProgrammeSpend(
  params: ProgrammeSpendParams = {},
  signal?: AbortSignal,
): Promise<ProgrammeSpend[]> {
  if (!isBackendConfigured) return [];
  return apiRequest<ProgrammeSpend[]>(withParams('/stats/finance/spend', params), { signal });
}

export async function fetchMetricProposals(signal?: AbortSignal): Promise<MetricProposal[]> {
  return getOrFallback('/stats/metrics-proposals', { signal }, () => []);
}
