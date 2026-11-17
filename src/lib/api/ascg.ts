/**
 * ASCG academic resource. Term means, progress split, bands, subjects.
 *
 *   GET /academics?year= -> AscgAcademicResponse
 */
import type { AscgAcademicParams, AscgAcademicResponse } from '../../types/mis';
import { getOrFallback, withParams } from './shared';

export async function fetchAscgAcademic(
  params: AscgAcademicParams = { year: 2025 },
  signal?: AbortSignal,
): Promise<AscgAcademicResponse> {
  return getOrFallback(withParams('/academics', params), { signal });
}
