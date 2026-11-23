/**
 * Overview resource. Supplies the headline KPIs.
 *
 *   GET /stats/overview -> OverviewPayload
 */
import type { OverviewPayload } from '../../types/mis';
import { getOrFallback } from './shared';

export async function fetchOverview(signal?: AbortSignal): Promise<OverviewPayload> {
  return getOrFallback(
    '/stats/overview',
    { signal })
}
