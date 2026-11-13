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
    { signal },
    (s: MisData): ReachPayload => {
      const { year_from, year_to, programme } = params;
      // UI-only: the snapshot only holds ASCG enrolments, so a non-ASCG
      // programme filter yields an empty series rather than carried-over data.
      // Per-programme breakdowns (`programs`) come from the backend only.
      const rows =
        programme && programme !== 'ascg'
          ? []
          : s.reach.filter(
              (r: ReachRow) =>
                (year_from === undefined || r.year_joined >= year_from) &&
                (year_to === undefined || r.year_joined <= year_to),
            );
      const yearlyStats: YearlyStat[] = rows.map((r: ReachRow) => ({
        year: r.year_joined,
        newStudents: r.new_students,
        returningStudents: r.returning,
        unclassifiedStudents: 0,
      }));
      return {
        yearly: {
          yearlyStats,
          totals: {
            uniqueStudents: rows.reduce((sum, r) => sum + r.unique_students, 0),
            returningStudents: rows.reduce((sum, r) => sum + r.returning, 0),
            totalParticipations: rows.reduce((sum, r) => sum + r.participations, 0),
          },
        },
        programs: [],
      };
    },
  );
}
