/**
 * Reach resource. Enrolment split by year joined (+ optional filters).
 *
 *   GET /stats/reach?year_from=&year_to=&programme= -> ReachPayload
 */
import type { MisData, ReachParams, ReachPayload, ReachRow, YearlyStat } from '../../types/mis';
import { getOrFallback, withParams } from './shared';

export async function fetchReach(
  params: ReachParams = {},
  signal?: AbortSignal,
): Promise<ReachPayload> {
  return getOrFallback(
    withParams('/stats/reach', params),
    { signal }
  );
}
