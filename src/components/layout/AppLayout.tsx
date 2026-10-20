import { Navigate, useNavigate, useParams } from 'react-router-dom';
import type { MisData } from '../../types/mis';
import { canAccess, firstAllowedPage, isPage, roleLabel } from '../../lib/access';
import { SKIP_AUTH } from '../../lib/api/config';
import { useMisData } from '../../queries/useMisData';
import { useOverview, useReach } from '../../queries/usePages';
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
    case 'register':
      return <Register data={data} />;
    case 'quality':
      return <Quality data={data} />;
    case 'board':
      return <Board data={data} />;
    default:
      return null;
  }
}

function StaticRoute() {
  const { page } = useParams();
  switch (page) {
    case 'cbc':
      return <Cbc />;
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
  const { page: pageParam } = useParams();

  const user =
    session.data ??
    (SKIP_AUTH
      ? { email: 'local@dev', name: 'Local testing', role: 'admin' as const }
      : null);
  if (!user) return null; // guard redirects to /login
  const role = user.role;

  const page = isPage(pageParam) ? pageParam : null;
  if (!page || !canAccess(role, page)) {
    return <Navigate to={`/${firstAllowedPage(role)}`} replace />;
  }

  function onSignOut() {
    logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) });
  }

  const label = roleLabel(role);

  return (
    <>
      <TopBar user={user} signingOut={logout.isPending} onSignOut={onSignOut} />
      <div className="flex min-h-[calc(100vh-64px)] items-start max-[820px]:flex-col">
        <Rail role={role} />
        <main className="min-w-0 max-w-[1240px] flex-1 px-[30px] pb-[70px] pt-[26px] max-[820px]:px-3.5 max-[820px]:pb-[60px] max-[820px]:pt-[18px]">
          {page === 'overview' ? (
            <OverviewRoute roleLabelText={label} />
          ) : page === 'reach' ? (
            <ReachRoute roleLabelText={label} />
          ) : page === 'cbc' || page === 'sc' || page === 'proposed' ? (
            <StaticRoute />
          ) : (
            <LegacyRoute page={page} roleLabelText={label} />
          )}
        </main>
      </div>
    </>
  );
}
