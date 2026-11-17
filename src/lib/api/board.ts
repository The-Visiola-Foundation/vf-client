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
  return getOrFallback('/stats/board', { signal });
}

export async function fetchProgrammeSpend(
  params: ProgrammeSpendParams = {},
  signal?: AbortSignal,
): Promise<ProgrammeSpend[]> {
  if (!isBackendConfigured) return [];
  return api.get<ProgrammeSpend[]>(withParams('/stats/finance/spend', params), { signal });
}

export async function fetchMetricProposals(signal?: AbortSignal): Promise<MetricProposal[]> {
  return getOrFallback('/stats/metrics-proposals', { signal });
}
