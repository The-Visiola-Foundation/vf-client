import { useSearchParams } from 'react-router-dom';
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
  useRegisterPage,
  useSaveCell,
} from '../queries/useRegister';

export function Register() {
  const [params, setParams] = useSearchParams();

  const text = params.get('name') ?? params.get('q') ?? '';
  const page = Number(params.get('page') ?? '1') || 1;
  const pageSize = Number(params.get('limit') ?? params.get('page_size') ?? '20') || 20;

  const saveCell = useSaveCell();
  const addStudent = useAddStudent();

  const query = useRegisterPage({
    name: text,
    page,
    limit: pageSize,
  });


  if (query.data) {
    const rows = query.data.data;
    const total = query.data?.totalCount;
    const currentPage = query.data?.page ?? page;
    const totalPages = query.data?.totalPages!;

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
          Search, review and edit student records: names, date of birth, contact details, school and country. Changes are saved as you make them.
        </Lede>

        <RegisterControls
          filters={{ text }}
          busy={addStudent.isPending}
          onChange={applyPatch}
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
          <b className="font-mono tabular-nums">{fmt(total)}</b> {' '}students
        </p>

        <RegisterTable rows={query.data?.data} />

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
    )
  }


}


