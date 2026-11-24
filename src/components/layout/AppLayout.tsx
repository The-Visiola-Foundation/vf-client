import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { MisData } from '../../types/mis';
import { canAccess, firstAllowedPage, isPage, roleLabel } from '../../lib/access';
import { SKIP_AUTH } from '../../lib/api/config';
import { useMisData } from '../../queries/useMisData';
import {
  useAscgAcademic,
  useBoardSummary,
  useCbcOutcomes,
  useOverview,
  useReach,
  useSscCamps,

} from '../../queries/usePages';
import { useLogout, useSession } from '../../queries/useSession';
import { TopBar } from './TopBar';
import { Rail } from './Rail';
import { Footer } from './Footer';
import { ErrorPanel, PageSkeleton } from '../ui/skeleton';
import { Overview } from '../../pages/Overview';
import { Reach } from '../../pages/Reach';
import { Ascg } from '../../pages/Ascg';
import { Cbc } from '../../pages/Cbc';
import { SC } from '../../pages/Sc';
import { Register } from '../../pages/Register';
import { Quality } from '../../pages/Quality';
import { Board } from '../../pages/Board';
import { Proposed } from '../../pages/Proposed';
import { StudentPage } from '../../pages/Student';

/** Thin indeterminate bar shown during a background refetch of loaded data. */
function FetchIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      role="progressbar"
      aria-label="Refreshing data"
      className="mb-3 h-0.5 w-full overflow-hidden rounded-full bg-line"
    >
      <div className="h-full w-1/4 animate-[fetch-bar_1.1s_ease-in-out_infinite] bg-vf-blue" />
    </div>
  );
}

function QueryShell({
  data,
  isFetching,
  isError,
  error,
  onRetry,
  generated,
  role,
  children,
}: {
  data: unknown;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  generated: string | undefined;
  role: string;
  children: (d: never) => React.ReactNode;
}) {
  if (data) {
    return (
      <>
        <FetchIndicator active={isFetching} />
        {children(data as never)}
        <Footer generated={generated ?? 'unknown'} roleLabel={role} />
      </>
    );
  }
  if (isError) {
    return (
      <ErrorPanel
        message={error instanceof Error ? error.message : String(error)}
        onRetry={onRetry}
      />
    );
  }
  return <PageSkeleton />;
}

function OverviewRoute({ roleLabelText }: { roleLabelText: string }) {
  const query = useOverview();
  return (
    <QueryShell
      data={query.data}
      isFetching={query.isFetching}
      isError={query.isError}
      error={query.error}
      onRetry={() => query.refetch()}
      generated={undefined}
      role={roleLabelText}
    >
      {(d) => <Overview data={d} />}
    </QueryShell>
  );
}

function ReachRoute({ roleLabelText }: { roleLabelText: string }) {
  const query = useReach();
  return (
    <QueryShell
      data={query.data}
      isFetching={query.isFetching}
      isError={query.isError}
      error={query.error}
      onRetry={() => query.refetch()}
      generated={undefined}
      role={roleLabelText}
    >
      {(d) => <Reach data={d} />}
    </QueryShell>
  );
}

function BoardRoute({ roleLabelText }: { roleLabelText: string }) {
  const query = useBoardSummary();
  return (
    <QueryShell
      data={query.data}
      isFetching={query.isFetching}
      isError={query.isError}
      error={query.error}
      onRetry={() => query.refetch()}
      generated={undefined}
      role={roleLabelText}
    >
      {(d) => <Board data={d} />}
    </QueryShell>
  );
}

export const ASCG_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
export const SC_YEARS = [2017, ...ASCG_YEARS]

function AscgRoute({ roleLabelText }: { roleLabelText: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawYear = searchParams.get('year');
  const year = rawYear !== null && rawYear !== '' && Number.isFinite(Number(rawYear))
    ? Number(rawYear)
    : 2025;
  const query = useAscgAcademic({ year });
  const changeYear = (nextYear: number) => {
    setSearchParams({ year: String(nextYear) }, { replace: true });
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm text-subtle">
          <span className="font-medium">Academic year</span>
          <select
            value={year}
            onChange={(e) => changeYear(Number(e.target.value))}
            className="bg-paper border border-black/10 rounded-md px-2 py-1 font-mono text-sm"
          >
            {ASCG_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <QueryShell
        data={query.data}
        isFetching={query.isFetching}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        generated={undefined}
        role={roleLabelText}
      >
        {(d) => <Ascg data={d} year={year} />}
      </QueryShell>
    </>
  );
}


function CbcRoute({ roleLabelText }: { roleLabelText: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawYear = searchParams.get('year');
  const year = rawYear !== null && rawYear !== '' && Number.isFinite(Number(rawYear))
    ? Number(rawYear)
    : 0;
  const query = useCbcOutcomes({ year });
  const changeYear = (nextYear: number) => {
    setSearchParams({ year: String(nextYear) }, { replace: true });
  };

  return (
    <>
      <div className="mb-
      4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm text-subtle">
          <span className="font-medium">Year</span>
          <select
            value={year}
            onChange={(e) => changeYear(Number(e.target.value))}
            className="bg-paper border border-black/10 rounded-md px-2 py-1 font-mono text-sm"
          >
            <option value={0}>All Years</option>
            {ASCG_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <QueryShell
        data={query.data}
        isFetching={query.isFetching}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        generated={undefined}
        role={roleLabelText}
      >
        {(d) => <Cbc data={d} year={year} />}
      </QueryShell>
    </>
  );
}


function RegisterRoute({ roleLabelText }: { roleLabelText: string }) {
  return (
    <>
      <Register />
      <Footer generated="live" roleLabel={roleLabelText} />
    </>
  );
}

function ScRoute({ roleLabelText }: { roleLabelText: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawYear = searchParams.get('year');
  const year = rawYear !== null && rawYear !== '' && Number.isFinite(Number(rawYear))
    ? Number(rawYear)
    : 0;
  const query = useSscCamps({ year });
  const changeYear = (nextYear: number) => {
    setSearchParams({ year: String(nextYear) }, { replace: true });
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm text-subtle">
          <span className="font-medium">Year</span>
          <select
            value={year}
            onChange={(e) => changeYear(Number(e.target.value))}
            className="bg-paper border border-black/10 rounded-md px-2 py-1 font-mono text-sm"
          >
            <option value={0}>All Years</option>
            {SC_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <QueryShell
        data={query.data}
        isFetching={query.isFetching}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        generated={undefined}
        role={roleLabelText}
      >
        {(d) => <SC data={d} year={year} />}
      </QueryShell>
    </>
  );
}


function LegacyRoute({ page, roleLabelText }: { page: string; roleLabelText: string }) {
  const query = useMisData();
  return (
    <QueryShell
      data={query.data}
      isFetching={query.isFetching}
      isError={query.isError}
      error={query.error}
      onRetry={() => query.refetch()}
      generated={query.data?.generated}
      role={roleLabelText}
    >
      {(d: MisData) => <LegacyPage page={page} data={d} />}
    </QueryShell>
  );
}

function LegacyPage({ page, data }: { page: string; data: MisData }) {
  switch (page) {
    case 'ascg':
      return <Ascg data={data} />;
    case 'quality':
      return <Quality data={data} />;
    default:
      return null;
  }
}

function StaticRoute() {
  const { page } = useParams();
  switch (page) {
    case 'cbc':
      return <Cbc data={{ year: 0, total: 0, uniqueCount: 0, tracks: [] }} year={0} />;
    case 'sc':
      return <SC />;
    default:
      return <Proposed />;
  }
}

export function AppLayout() {
  // Role comes from the session (RequireAuth guarantees it), never the URL.
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();
  const { page: pageParam, studentId } = useParams();

  const user =
    session.data ??
    (SKIP_AUTH
      ? { email: 'local@dev', name: 'Local testing', role: 'admin' as const }
      : null);
  if (!user) return null; // guard redirects to /login
  const role = user.role;

  function onSignOut() {
    logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) });
  }

  if (studentId) {
    return (
      <div className='max-w-360 mx-auto'>
        <TopBar user={user} signingOut={logout.isPending} onSignOut={onSignOut} />
        <div className="flex min-h-[calc(100vh-64px)] items-start max-[820px]:flex-col">
          <Rail role={role} />
          <main className="min-w-0 max-w-full flex-1 px-[30px] pb-[70px] pt-[26px] max-[820px]:px-3.5 max-[820px]:pb-[60px] max-[820px]:pt-[18px]">
            <StudentPage studentId={studentId} />
          </main>
        </div>
      </div>
    );
  }

  const page = isPage(pageParam) ? pageParam : null;
  if (!page || !canAccess(role, page)) {
    return <Navigate to={`/${firstAllowedPage(role)}`} replace />;
  }

  const label = roleLabel(role);

  return (
    <div className='max-w-360 mx-auto'>
      <TopBar user={user} signingOut={logout.isPending} onSignOut={onSignOut} />
      <div className="flex min-h-[calc(100vh-64px)] items-start max-[820px]:flex-col">
        <Rail role={role} />
        <main className="min-w-0 max-w-full flex-1 px-[30px] pb-[70px] pt-[26px] max-[820px]:px-3.5 max-[820px]:pb-[60px] max-[820px]:pt-[18px]">
          {page === 'overview' ? (
            <OverviewRoute roleLabelText={label} />
          ) : page === 'reach' ? (
            <ReachRoute roleLabelText={label} />
          ) : page === 'register' ? (
            <RegisterRoute roleLabelText={label} />
          ) : page === 'board' ? (
            <BoardRoute roleLabelText={label} />
          ) : page === 'ascg' ? (
            <AscgRoute roleLabelText={label} />
          ) : page === 'cbc' ? (
            <CbcRoute roleLabelText={label} />
          ) : page === 'sc' ? (
            < ScRoute roleLabelText={label} />) : page === 'proposed' ? (
              <StaticRoute />
            ) : (
            <LegacyRoute page={page} roleLabelText={label} />
          )}
        </main>
      </div>
    </div>
  );
}
