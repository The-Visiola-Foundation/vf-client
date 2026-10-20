import { useQuery } from '@tanstack/react-query';
import type {
  AscgAcademicParams,
  AscgAcademicPayload,
  BoardSummaryPayload,
  CbcGraduate,
  CbcGraduateParams,
  CbcOutcome,
  CbcOutcomeParams,
  CbcSummary,
  MetricProposal,
  OverviewPayload,
  Paged,
  ProgrammeSpend,
  ProgrammeSpendParams,
  QualityIssuesParams,
  QualitySummary,
  ReachParams,
  ReachPayload,
  IssueRow,
} from '../types/mis';
import type { SscCompareResponse, SscCampsResponse, SscImpactPayload, SscYearRollup } from '../types/ssc';
import { isBackendConfigured } from '../lib/api';
import {
  fetchAscgAcademic,
  fetchBoardSummary,
  fetchCbcGraduates,
  fetchCbcOutcomes,
  fetchCbcSummary,
  fetchMetricProposals,
  fetchOverview,
  fetchProgrammeSpend,
  fetchQualityIssues,
  fetchQualitySummary,
  fetchReach,
  fetchSscCamps,
  fetchSscCompare,
  fetchSscImpact,
  fetchSscYearRollup,
} from '../lib/api';
import { queryKeys } from './keys';

function liveOptions() {
  return {
    staleTime: isBackendConfigured ? 60_000 : Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: isBackendConfigured,
    retry: isBackendConfigured ? 2 : 1,
  } as const;
}

/**
 * Per-page queries. Each wraps one resource function in `src/lib/api/`; in
 * UI-only mode the payload is derived from the bundled snapshot, with a
 * backend it is the matching HTTP path. Overview and Reach are migrated;
 * the remaining pages still use `useMisData()` until they move over one by one.
 */
export function useOverview() {
  return useQuery<OverviewPayload>({
    queryKey: queryKeys.overview,
    queryFn: ({ signal }) => fetchOverview(signal),
    ...liveOptions(),
  });
}

export function useReach(params: ReachParams = {}) {
  return useQuery<ReachPayload>({
    queryKey: queryKeys.reach(params as Record<string, string | number | undefined>),
    queryFn: ({ signal }) => fetchReach(params, signal),
    ...liveOptions(),
  });
}

export function useAscgAcademic(params: AscgAcademicParams = {}) {
  return useQuery<AscgAcademicPayload>({
    queryKey: queryKeys.ascg(params),
    queryFn: ({ signal }) => fetchAscgAcademic(params, signal),
    ...liveOptions(),
  });
}

export function useCbcSummary() {
  return useQuery<CbcSummary>({
    queryKey: queryKeys.cbcSummary,
    queryFn: ({ signal }) => fetchCbcSummary(signal),
    ...liveOptions(),
  });
}

export function useCbcGraduates(params: CbcGraduateParams = {}) {
  return useQuery<Paged<CbcGraduate>>({
    queryKey: queryKeys.cbcGraduates(params as Record<string, string | number | undefined>),
    queryFn: ({ signal }) => fetchCbcGraduates(params, signal),
    ...liveOptions(),
  });
}

export function useCbcOutcomes(params: CbcOutcomeParams = {}) {
  return useQuery<CbcOutcome[]>({
    queryKey: queryKeys.cbcOutcomes(params),
    queryFn: ({ signal }) => fetchCbcOutcomes(params, signal),
    ...liveOptions(),
  });
}

export function useQualitySummary() {
  return useQuery<QualitySummary>({
    queryKey: queryKeys.qualitySummary,
    queryFn: ({ signal }) => fetchQualitySummary(signal),
    ...liveOptions(),
  });
}

export function useQualityIssues(params: QualityIssuesParams = {}) {
  return useQuery<Paged<IssueRow>>({
    queryKey: queryKeys.qualityIssues(params as Record<string, string | number | undefined>),
    queryFn: ({ signal }) => fetchQualityIssues(params, signal),
    ...liveOptions(),
  });
}

export function useBoardSummary() {
  return useQuery<BoardSummaryPayload>({
    queryKey: queryKeys.boardSummary,
    queryFn: ({ signal }) => fetchBoardSummary(signal),
    ...liveOptions(),
  });
}

export function useProgrammeSpend(params: ProgrammeSpendParams = {}) {
  return useQuery<ProgrammeSpend[]>({
    queryKey: queryKeys.programmeSpend(
      params as Record<string, string | number | undefined>,
    ),
    queryFn: ({ signal }) => fetchProgrammeSpend(params, signal),
    ...liveOptions(),
  });
}

export function useMetricProposals() {
  return useQuery<MetricProposal[]>({
    queryKey: queryKeys.metricProposals,
    queryFn: ({ signal }) => fetchMetricProposals(signal),
    ...liveOptions(),
  });
}

/** All SSC camps, each carrying a `hasResults` flag. */
export function useSscCamps() {
  return useQuery<SscCampsResponse>({
    queryKey: queryKeys.sscCamps,
    queryFn: ({ signal }) => fetchSscCamps(signal),
    ...liveOptions(),
  });
}

/** One camp's full impact payload (`null` when no results). */
export function useSscImpact(campId: string) {
  return useQuery<SscImpactPayload | null>({
    queryKey: queryKeys.sscImpact(campId),
    queryFn: ({ signal }) => fetchSscImpact(campId, signal),
    enabled: !!campId,
    ...liveOptions(),
  });
}

/** Year-level rollup across camps (`null` when nothing loaded). */
export function useSscYearRollup(year: number) {
  return useQuery<SscYearRollup | null>({
    queryKey: queryKeys.sscYearRollup(year),
    queryFn: ({ signal }) => fetchSscYearRollup(year, signal),
    enabled: year > 0,
    ...liveOptions(),
  });
}

/** Core-measure comparison rows for a given core code. */
export function useSscCompare(core: string) {
  return useQuery<SscCompareResponse>({
    queryKey: queryKeys.sscCompare(core),
    queryFn: ({ signal }) => fetchSscCompare(core, signal),
    enabled: !!core,
    ...liveOptions(),
  });
}
