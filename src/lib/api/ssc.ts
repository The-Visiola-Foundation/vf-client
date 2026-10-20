/**
 * STEM Camps resource. Supplies the camp list, per-camp impact, year rollup,
 * and core-measure comparison.
 *
 *   GET /ssc/camps              -> SscCamp[]
 *   GET /ssc/camps/:campId/impact -> SscImpactPayload | null
 *   GET /ssc/years/:year/rollup   -> SscYearRollup | null
 *   GET /ssc/compare?core=<code>  -> SscCompareRow[]
 *
 * In UI-only mode (no `VITE_API_BASE_URL`) every function returns an empty
 * shape so the empty-state view renders with zero backend. With a backend
 * configured the same functions hit the real paths. Components and hooks never
 * branch on the mode — they just call these functions.
 */
import type {
  SscCampsResponse,
  SscCompareResponse,
  SscImpactPayload,
  SscYearRollup,
} from '../../types/ssc';
import { getOrFallback, withParams } from './shared';

const EMPTY_CAMPS: SscCampsResponse = [];
const EMPTY_IMPACT: SscImpactPayload | null = null;
const EMPTY_ROLLUP: SscYearRollup | null = null;
const EMPTY_COMPARE: SscCompareResponse = [];

/** All camps, with a `hasResults` flag the UI uses to pick its view. */
export async function fetchSscCamps(signal?: AbortSignal): Promise<SscCampsResponse> {
  return getOrFallback<SscCampsResponse>(
    '/ssc/camps',
    { signal },
    () => EMPTY_CAMPS,
  );
}

/** One camp's full impact payload, or `null` when no results exist. */
export async function fetchSscImpact(
  campId: string,
  signal?: AbortSignal,
): Promise<SscImpactPayload | null> {
  return getOrFallback<SscImpactPayload | null>(
    `/ssc/camps/${encodeURIComponent(campId)}/impact`,
    { signal },
    () => EMPTY_IMPACT,
  );
}

/** Year-level rollup across camps, or `null` when nothing is loaded. */
export async function fetchSscYearRollup(
  year: number,
  signal?: AbortSignal,
): Promise<SscYearRollup | null> {
  return getOrFallback<SscYearRollup | null>(
    withParams(`/ssc/years/${year}/rollup`, {}),
    { signal },
    () => EMPTY_ROLLUP,
  );
}

/** Core-measure comparison rows for a given core code. */
export async function fetchSscCompare(
  core: string,
  signal?: AbortSignal,
): Promise<SscCompareResponse> {
  return getOrFallback<SscCompareResponse>(
    withParams('/ssc/compare', { core }),
    { signal },
    () => EMPTY_COMPARE,
  );
}