import { useQuery } from '@tanstack/react-query';
import type {
  AscgAcademicParams,
  CbcGraduateParams,
  CbcOutcomeParams,
  ProgrammeSpendParams,
  QualityIssuesParams,
  ReachParams,
} from '../types/mis';
import { queryOptionFactories } from './options';

export function useOverview() {
  return useQuery(queryOptionFactories.overview());
}

export function useReach(params: ReachParams = {}) {
  return useQuery(queryOptionFactories.reach(params));
}

export function useAscgAcademic(params: AscgAcademicParams = {}) {
  return useQuery(queryOptionFactories.ascgAcademic(params));
}

export function useCbcSummary(params: AscgAcademicParams = {}) {
  return useQuery(queryOptionFactories.cbcSummary(params));
}

export function useCbcGraduates(params: CbcGraduateParams = {}) {
  return useQuery(queryOptionFactories.cbcGraduates(params));
}

export function useCbcOutcomes(params: CbcOutcomeParams = {}) {
  return useQuery(queryOptionFactories.cbcOutcomes(params));
}

export function useQualitySummary() {
  return useQuery(queryOptionFactories.qualitySummary());
}

export function useQualityIssues(params: QualityIssuesParams = {}) {
  return useQuery(queryOptionFactories.qualityIssues(params));
}

export function useBoardSummary() {
  return useQuery(queryOptionFactories.boardSummary());
}

export function useProgrammeSpend(params: ProgrammeSpendParams = {}) {
  return useQuery(queryOptionFactories.programmeSpend(params));
}

export function useMetricProposals() {
  return useQuery(queryOptionFactories.metricProposals());
}

/** All SSC camps, each carrying a `hasResults` flag. */
export function useSscCamps() {
  return useQuery(queryOptionFactories.sscCamps());
}

/** One camp's full impact payload (`null` when no results). */
export function useSscImpact(campId: string) {
  return useQuery(queryOptionFactories.sscImpact(campId));
}

/** Year-level rollup across camps (`null` when nothing loaded). */
export function useSscYearRollup(year: number) {
  return useQuery(queryOptionFactories.sscYearRollup(year));
}

/** Core-measure comparison rows for a given core code. */
export function useSscCompare(core: string) {
  return useQuery(queryOptionFactories.sscCompare(core));
}
