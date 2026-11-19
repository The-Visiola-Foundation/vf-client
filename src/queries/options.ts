import { queryOptions } from '@tanstack/react-query';
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
  fetchRegisterPage,
  fetchSchools,
  fetchSscCamps,
  fetchSscCompare,
  fetchSscImpact,
  fetchSscYearRollup,
  fetchStudent,
} from '../lib/api';
import type {
  AscgAcademicParams,
  CbcGraduateParams,
  CbcOutcomeParams,
  ProgrammeSpendParams,
  QualityIssuesParams,
  ReachParams,
  RegisterFilters,
} from '../types/mis';
import { queryKeys } from './keys';

export const queryOptionFactories = {
  overview: () =>
    queryOptions({
      queryKey: queryKeys.overview,
      queryFn: ({ signal }) => fetchOverview(signal),
    }),

  reach: (params: ReachParams = {}) =>
    queryOptions({
      queryKey: queryKeys.reach(params as Record<string, string | number | undefined>),
      queryFn: ({ signal }) => fetchReach(params, signal),
    }),

  schools: () =>
    queryOptions({
      queryKey: queryKeys.schools,
      queryFn: ({ signal }) => fetchSchools(signal),
    }),

  registerPage: (filters: RegisterFilters = {}) =>
    queryOptions({
      queryKey: queryKeys.registerPage(
        filters as Record<string, string | number | boolean | undefined>,
      ),
      queryFn: ({ signal }) => fetchRegisterPage(filters, signal),
      placeholderData: (prev) => prev,
    }),

  student: (id: string) =>
    queryOptions({
      queryKey: queryKeys.student(id),
      queryFn: ({ signal }) => fetchStudent(id, signal),
      enabled: Boolean(id),
    }),

  boardSummary: () =>
    queryOptions({
      queryKey: queryKeys.boardSummary,
      queryFn: ({ signal }) => fetchBoardSummary(signal),
    }),

  ascgAcademic: (params: AscgAcademicParams = {}) =>
    queryOptions({
      queryKey: queryKeys.ascg(params),
      queryFn: ({ signal }) => fetchAscgAcademic(params, signal),
    }),

  cbcSummary: (params: AscgAcademicParams ={}) =>
    queryOptions({
      queryKey: queryKeys.cbcSummary(params),
      queryFn: ({ signal }) => fetchCbcSummary(params, signal),
    }),

  cbcGraduates: (params: CbcGraduateParams = {}) =>
    queryOptions({
      queryKey: queryKeys.cbcGraduates(params as Record<string, string | number | undefined>),
      queryFn: ({ signal }) => fetchCbcGraduates(params, signal),
    }),

  cbcOutcomes: (params: CbcOutcomeParams = {}) =>
    queryOptions({
      queryKey: queryKeys.cbcOutcomes(params as { months_after?: number }),
      queryFn: ({ signal }) => fetchCbcOutcomes(params, signal),
    }),

  qualitySummary: () => 
    queryOptions({
      queryKey: queryKeys.qualitySummary,
      queryFn: ({ signal }) => fetchQualitySummary(signal),
    }),

  qualityIssues: (params: QualityIssuesParams = {}) =>
    queryOptions({
      queryKey: queryKeys.qualityIssues(params as Record<string, string | number | undefined>),
      queryFn: ({ signal }) => fetchQualityIssues(params, signal),
    }),

  programmeSpend: (params: ProgrammeSpendParams = {}) =>
    queryOptions({
      queryKey: queryKeys.programmeSpend(params as Record<string, string | number | undefined>),
      queryFn: ({ signal }) => fetchProgrammeSpend(params, signal),
    }),

  metricProposals: () =>
    queryOptions({
      queryKey: queryKeys.metricProposals,
      queryFn: ({ signal }) => fetchMetricProposals(signal),
    }),

  sscCamps: (params={}) =>
    queryOptions({
      queryKey: queryKeys.sscCamps(params),
      queryFn: ({ signal }) => fetchSscCamps(params, signal),
    }),

  sscImpact: (campId: string) =>
    queryOptions({
      queryKey: queryKeys.sscImpact(campId),
      queryFn: ({ signal }) => fetchSscImpact(campId, signal),
      enabled: Boolean(campId),
    }),

  sscYearRollup: (year: number) =>
    queryOptions({
      queryKey: queryKeys.sscYearRollup(year),
      queryFn: ({ signal }) => fetchSscYearRollup(year, signal),
    }),

  sscCompare: (core: string) =>
    queryOptions({
      queryKey: queryKeys.sscCompare(core),
      queryFn: ({ signal }) => fetchSscCompare(core, signal),
    }),
};
