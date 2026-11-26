import { useSearchParams } from 'react-router-dom';
import type { MisData, RegisterData } from '../types/mis';
import { fmt } from '../lib/format';
import { Notice } from '../components/ui/primitives';
import { Eyebrow, Lede, PageTitle } from '../components/ui/layout';
import { Skeleton, TableSkeleton } from '../components/ui/skeleton';
import {
  RegisterControls,
  type RegisterFilters,
} from '../components/register/RegisterControls';
import { RegisterTable } from '../components/register/RegisterTable';
import {
  useRegisterPage,
  useSaveCell,
} from '../queries/useRegister';

export function Register(_props: { data?: RegisterData | MisData }) {
  const [params, setParams] = useSearchParams();

  const text = params.get('name') ?? params.get('q') ?? '';
  const page = Number(params.get('page') ?? '1') || 1;
  const pageSize = Number(params.get('limit') ?? params.get('page_size') ?? '20') || 20;

  const saveCell = useSaveCell();

  const query = useRegisterPage({
    name: text,
    page,
    limit: pageSize,
  });

  function applyPatch(patch: Partial<RegisterFilters>) {
    const next = new URLSearchParams(params);
    if ('text' in patch) {
      const value = patch.text ?? '';
      if (value) {
        next.set('name', value);
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

  function onPageChange(nextPage: number) {
    if (!query.data) return;
    const next = new URLSearchParams(params);
    const limit = Number(params.get('limit') ?? params.get('page_size') ?? 20) || 20;
    const totalPages = query.data.totalPages ?? 1;
    const bounded = Math.min(Math.max(1, nextPage), totalPages);
    next.set('page', String(bounded));
    next.set('limit', String(limit));
    next.delete('page_size');
    setParams(next, { replace: true });
  }

  const mutationError = saveCell.error;
  const isInitialLoad = query.isLoading && !query.data;
  const rows = query.data?.data ?? [];
  const total = query.data?.totalCount ?? 0;
  const currentPage = query.data?.page ?? page;
  const totalPages = query.data?.totalPages ?? 1;

  return (
    <>
      <Eyebrow>Records · key staff only</Eyebrow>
      <PageTitle>Student register</PageTitle>
      <Lede>
        Search, review and edit student records: names, date of birth, contact details, school and country. Changes are saved as you make them.
      </Lede>

      <RegisterControls
        filters={{ text }}
        busy={query.isFetching}
        onChange={applyPatch}
      />

      {query.isFetching && !isInitialLoad ? (
        <div
          role="progressbar"
          aria-label="Refreshing student register"
          className="mb-3 h-0.5 w-full overflow-hidden rounded-full bg-line"
        >
          <div className="h-full w-1/4 animate-[fetch-bar_1.1s_ease-in-out_infinite] bg-vf-blue" />
        </div>
      ) : null}

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

      {query.isError && !query.data ? (
        <Notice variant="err" title="Student register unavailable">
          <p>
            {query.error instanceof Error && query.error.message
              ? query.error.message
              : 'The student register could not be loaded.'}
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-3 rounded-[7px] border border-ink bg-ink px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-black"
          >
            Try again
          </button>
        </Notice>
      ) : isInitialLoad ? (
        <div role="status" aria-live="polite" aria-busy="true">
          <span className="sr-only">Loading student register…</span>
          <Skeleton className="mb-3 h-3.5 w-44" />
          <TableSkeleton rows={8} cols={10} />
          <div className="mt-4 flex items-center justify-between gap-3">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-14" />
          </div>
        </div>
      ) : (
        <>
          <p className="mb-3 -mt-1 text-[12.5px] text-muted">
            Showing <b className="font-mono tabular-nums">{fmt(rows.length)}</b> of{' '}
            <b className="font-mono tabular-nums">{fmt(total)}</b> students
          </p>

          <RegisterTable rows={rows} />

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || query.isFetching}
              className="rounded-[7px] border border-line-2 bg-card px-3 py-2 text-[12.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-[12.5px] text-muted">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || query.isFetching}
              className="rounded-[7px] border border-line-2 bg-card px-3 py-2 text-[12.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </>
  );
}
