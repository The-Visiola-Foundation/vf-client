import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MisData, RegisterData, RosterRow } from '../types/mis';
import { fmt } from '../lib/format';
import { Notice } from '../components/ui/primitives';
import { Eyebrow, Lede, PageTitle } from '../components/ui/layout';
import {
  RegisterControls,
  type RegisterFilters,
} from '../components/register/RegisterControls';
import { RegisterTable } from '../components/register/RegisterTable';
import {
  useAddStudent,
  useRegisterEdits,
  useRegisterPage,
  useSaveCell,
} from '../queries/useRegister';

function normalizeApiPageRows(rows: Array<Record<string, unknown>>): RosterRow[] {
  return rows.map((row) => {
    const firstName = typeof row.firstName === 'string' ? row.firstName : null;
    const lastName = typeof row.lastName === 'string' ? row.lastName : null;
    const dateOfBirth = typeof row.dateOfBirth === 'string' ? row.dateOfBirth : null;
    const email = typeof row.email === 'string' ? row.email : null;
    const phone = typeof row.phone === 'string' ? row.phone : null;
    const school = typeof row.school === 'string' ? row.school : null;

    return {
      uid: String(row.id ?? ''),
      legacy: null,
      match: 'unmatched',
      dobFlag: false,
      first: firstName,
      last: lastName,
      dob: dateOfBirth,
      email,
      phone,
      school,
      father: null,
      mother: null,
      fatherEdu: null,
      fatherEmp: null,
      motherEdu: null,
      motherEmp: null,
      sis: null,
      bro: null,
      consent: email || phone ? true : null,
      fav: null,
      diff: null,
      car1: null,
      car2: null,
      t1: null,
      t2: null,
      t3: null,
      band: null,
    };
  });
}

export function Register({ data }: { data?: RegisterData | MisData }) {
  const [params, setParams] = useSearchParams();

  const text = params.get('name') ?? params.get('q') ?? '';
  const page = Number(params.get('page') ?? '1') || 1;
  const pageSize = Number(params.get('limit') ?? params.get('page_size') ?? '20') || 20;

  const { data: dirtyKeys = [] } = useRegisterEdits();
  const dirty = useMemo(() => new Set(dirtyKeys), [dirtyKeys]);
  const saveCell = useSaveCell();
  const addStudent = useAddStudent();

  const query = useRegisterPage({
    name: text,
    page,
    limit: pageSize,
  });

  const roster = useMemo(
    () =>
      query.data?.items ??
      normalizeApiPageRows((data as any)?.data ?? (data as any)?.roster ?? []),
    [data, query.data],
  );
  const rows = useMemo(
    () =>
      roster.filter((r) => {
        if (!text) return true;
        const q = text.trim().toLowerCase();
        const fullName = `${r.first ?? ''} ${r.last ?? ''}`.trim().toLowerCase();
        return fullName.includes(q);
      }),
    [roster, text],
  );
  const total = query.data?.total ?? (data as any)?.total ?? roster.length;
  const currentPage = query.data?.page ?? page;
  const totalPages = Math.max(1, Math.ceil(total / (pageSize || 1)));

  const saving = saveCell.isPending || addStudent.isPending;
  const mutationError = saveCell.error ?? addStudent.error;

  function applyPatch(patch: Partial<RegisterFilters>) {
    const next = new URLSearchParams(params);
    if ('text' in patch) {
      const v = patch.text ?? '';
      if (v) {
        next.set('name', v);
        next.delete('q');
      } else {
        next.delete('name');
        next.delete('q');
      }
      next.delete('page');
    }
    if ('school' in patch) {
      next.delete('school');
      next.delete('page');
    }
    next.delete('page_size');
    next.delete('limit');
    if ('match' in patch) {
      next.delete('match');
      next.delete('page');
    }
    if ('missing' in patch) {
      next.delete('missing');
      next.delete('page');
    }
    setParams(next, { replace: true });
  }

  function onCommit(uid: string, field: string, value: string | null) {
    saveCell.mutate({ uid, key: field, value });
  }

  function onAdd() {
    addStudent.mutate();
    applyPatch({ text: '' });
  }

  function onPageChange(nextPage: number) {
    const next = new URLSearchParams(params);
    const limit = Number(params.get('limit') ?? params.get('page_size') ?? 20) || 20;
    const bounded = Math.min(Math.max(1, nextPage), totalPages);
    next.set('page', String(bounded));
    next.set('limit', String(limit));
    next.delete('page_size');
    setParams(next, { replace: true });
  }

  return (
    <>
      <Eyebrow>Records · key staff only</Eyebrow>
      <PageTitle>Student register</PageTitle>
      <Lede>
        This view matches the live students JSON: student ID, names, DOB, age, contact info,
        school and country. Pagination follows the API response page metadata.
      </Lede>

      <RegisterControls
        filters={{ text }}
        busy={addStudent.isPending}
        onChange={applyPatch}
        onAdd={onAdd}
      />

      {mutationError ? (
        <Notice variant="err" title="A change could not be saved">
          <p>
            {mutationError instanceof Error
              ? mutationError.message
              : String(mutationError)}
            . The edit was rolled back.
          </p>
        </Notice>
      ) : null}

      <p className="mb-3 -mt-1 text-[12.5px] text-muted">
        Showing <b className="font-mono tabular-nums">{fmt(rows.length)}</b> of{' '}
        <b className="font-mono tabular-nums">{fmt(total)}</b> students ·{' '}
        <b className="font-mono tabular-nums">{dirty.size}</b> edited
        {saving ? ' · Saving…' : ''} · page{' '}
        <b className="font-mono tabular-nums">{currentPage}</b> of{' '}
        <b className="font-mono tabular-nums">{totalPages}</b>
      </p>

      <RegisterTable rows={rows} dirty={dirty} onCommit={onCommit} />

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-[7px] border border-line-2 bg-card px-3 py-2 text-[12.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-[12.5px] text-muted">
          Page {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-[7px] border border-line-2 bg-card px-3 py-2 text-[12.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </>
  );
}
