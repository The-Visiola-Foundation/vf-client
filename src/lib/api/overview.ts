/**
 * Overview resource. Supplies the headline KPIs.
 *
 *   GET /stats/overview -> OverviewPayload
 */
import type { MisData, OverviewPayload } from '../../types/mis';
import { getOrFallback } from './shared';

export async function fetchOverview(signal?: AbortSignal): Promise<OverviewPayload> {
  return getOrFallback(
    '/stats/overview',
    { signal })
}
