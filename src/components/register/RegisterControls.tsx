import { useEffect, useState } from 'react';

const FIELD =
  'rounded-[7px] border border-line-2 bg-card px-2.5 py-[7px] text-[13px] text-ink';
const BTN =
  "rounded-[7px] border border-ink bg-ink px-3.25 py-1.75 text-[13px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60";

export interface RegisterFilters {
  text: string;
}

export function RegisterControls({
  filters,
  busy = false,
  onChange,
  onAdd,

}: {
  filters: RegisterFilters;
  busy?: boolean;
  onChange: (patch: Partial<RegisterFilters>) => void;
  onAdd: () => void;

}) {
  const [local, setLocal] = useState(filters.text);


  useEffect(() => {
    setLocal(filters.text);
  }, [filters.text]);

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onChange({ text: local.trim() });
  }

  return (
    <div className="mb-3.25 flex flex-wrap items-center gap-2.5">
      <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2.5">
        <input
          type="search"
          value={local}
          placeholder="Search by student name"
          style={{ minWidth: 260 }}
          onChange={(e) => setLocal(e.target.value)}
          className={FIELD}
        />
        <button type="submit" className={BTN} disabled={busy}>
          Search
        </button>
      </form>
      <span className="flex-1" />
      {/* <button type="button" onClick={onAdd} className={BTN} disabled={busy}>
        {busy ? 'Adding…' : 'Add student'}
      </button> */}

    </div>
  );
}
