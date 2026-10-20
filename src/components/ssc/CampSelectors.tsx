import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SscCamp } from '../../types/ssc';

/**
 * Year + camp selectors, synced to the URL so a refresh or a shared link
 * lands on the same camp. Options are derived from `/ssc/camps` so the list
 * never drifts from what the backend actually knows.
 */
export function CampSelectors({
  camps,
  year,
  campId,
  onChange,
}: {
  camps: SscCamp[];
  year: number;
  campId: string;
  onChange: (next: { year: number; campId: string }) => void;
}) {
  const [params, setParams] = useSearchParams();
  const urlYear = Number(params.get('year') || '');
  const urlCamp = params.get('camp') || '';

  // Initialise local state from the URL on mount.
  const [localYear, setLocalYear] = useState(() => (urlYear > 0 ? urlYear : year));
  const [localCamp, setLocalCamp] = useState(() => (urlCamp ? urlCamp : campId));

  const years = useMemo(
    () => [...new Set(camps.map((c) => c.year))].sort((a, b) => a - b),
    [camps],
  );
  const campsForYear = useMemo(
    () => camps.filter((c) => c.year === localYear),
    [camps, localYear],
  );

  const handleYear = useCallback(
    (next: number) => {
      setLocalYear(next);
      setParams((p) => {
        p.set('year', String(next));
        // Drop the camp when the year changes; the camp select re-picks.
        p.delete('camp');
        return p;
      });
      onChange({ year: next, campId: '' });
    },
    [setParams, onChange],
  );

  const handleCamp = useCallback(
    (next: string) => {
      setLocalCamp(next);
      setParams((p) => {
        p.set('camp', next);
        return p;
      });
      onChange({ year: localYear, campId: next });
    },
    [localYear, setParams, onChange],
  );

  // When the camps list changes (e.g. refetch), re-sync a stale selection.
  useEffect(() => {
    if (!campsForYear.some((c) => c.id === localCamp) && campsForYear.length > 0) {
      setLocalCamp(campsForYear[0].id);
      setParams((p) => {
        p.set('camp', campsForYear[0].id);
        return p;
      });
      onChange({ year: localYear, campId: campsForYear[0].id });
    }
  }, [campsForYear, localYear, localCamp, setParams, onChange]);

  return (
    <div className="flex flex-wrap gap-3 items-end mb-[18px]">
      <div>
        <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted block mb-1.5">
          Year
        </label>
        <select
          value={localYear}
          onChange={(e) => handleYear(Number(e.target.value))}
          aria-label="Year"
          className="rounded-[7px] border border-line bg-card px-[11px] py-[7px] text-[13px] text-ink font-mono focus-visible:outline-none focus-visible:ring-1 ring-vf-blue"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted block mb-1.5">
          Camp
        </label>
        <select
          value={localCamp}
          onChange={(e) => handleCamp(e.target.value)}
          aria-label="Camp"
          className="rounded-[7px] border border-line bg-card px-[11px] py-[7px] text-[13px] text-ink font-mono focus-visible:outline-none focus-visible:ring-1 ring-vf-blue"
        >
          {campsForYear.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}