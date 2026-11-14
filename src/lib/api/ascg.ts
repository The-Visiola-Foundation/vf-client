/**
 * ASCG academic resource. Term means, progress split, bands, subjects.
 *
 *   GET /mis/ascg/academic?cohort= -> AscgAcademicPayload
 */
import type { AscgAcademicParams, AscgAcademicResponse } from '../../types/mis';
import { getOrFallback, withParams } from './shared';

export async function fetchAscgAcademic(
  params: AscgAcademicParams = {},
  signal?: AbortSignal,
): Promise<AscgAcademicResponse> {
  return getOrFallback(withParams('/academics', params), { signal }, (s) => (s as unknown) as AscgAcademicResponse
);
}
