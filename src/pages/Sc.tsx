import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageSkeleton } from '../components/ui/skeleton';
import { ErrorPanel } from '../components/ui/skeleton';
import {
  Eyebrow,
  Lede,
  PageTitle,
  SectionHeading,
} from '../components/ui/layout';
import {
  CampSelectors,
  BothCampsView,
  SingleCampView,
  SscEmptyState,
  type SscCamp,
} from '../components/ssc';
import {
  useSscCamps,
  useSscImpact,
  useSscCompare,
} from '../queries/usePages';
import { sscView, primaryCamp, type SscView, type SscImpactPayload } from '../types/ssc';
import { fmt } from '../lib/format';

const DEFAULT_CORE = 'self_efficacy';

export function SC() {
  const [params, setParams] = useSearchParams();
  const campsQuery = useSscCamps();
  const camps: SscCamp[] = campsQuery.data ?? [];
  const years = useMemo(
    () => [...new Set(camps.map((c) => c.year))].sort((a, b) => b - a),
    [camps],
  );
  const urlYear = Number(params.get('year') || '');
  const selectedYear =
    urlYear > 0 && years.includes(urlYear) ? urlYear : years[0] ?? null;
  const campsForYear = useMemo(
    () => camps.filter((c) => c.year === selectedYear),
    [camps, selectedYear],
  );
  const yearChange = (next: number) => {
    setParams((p) => {
      p.set('year', String(next));
      p.delete('camp');
      return p;
    });
  };
  const urlCamp = params.get('camp') || '';
  const selectedCampId = campsForYear.some((c) => c.id === urlCamp)
    ? urlCamp
    : '';
  const view: SscView = useMemo(() => {
    if (selectedCampId) {
      const camp = campsForYear.find((c) => c.id === selectedCampId);
      return camp && camp.hasResults ? 'single' : 'empty';
    }
    return sscView(campsForYear);
  }, [campsForYear, selectedCampId]);
  const oneMissing =
    view === 'both' &&
    campsForYear.length >= 2 &&
    campsForYear.filter((c) => c.hasResults).length === 1;
  const selectedCamp = campsForYear.find((c) => c.id === selectedCampId);
  const impactQuery = useSscImpact(selectedCampId);

  // Fixed number of hook calls (one per camp slot) to satisfy the rules of
  // hooks. At most two camps per year; empty slots fetch nothing.
  const [firstCamp, secondCamp] = campsForYear;
  const firstImpactQuery = useSscImpact(firstCamp?.id ?? '');
  const secondImpactQuery = useSscImpact(secondCamp?.id ?? '');

  const allCampsHaveResults =
    view === 'both' &&
    campsForYear.every((c) => c.hasResults);
  const compareQuery = useSscCompare(DEFAULT_CORE);

  const isLoading =
    campsQuery.isFetching ||
    impactQuery.isFetching ||
    firstImpactQuery.isFetching ||
    secondImpactQuery.isFetching ||
    compareQuery.isFetching;
  const error =
    campsQuery.error ??
    impactQuery.error ??
    firstImpactQuery.error ??
    secondImpactQuery.error ??
    compareQuery.error;
  if (isLoading && !campsQuery.data) return <PageSkeleton />;
  if (error) {
    return (
      <ErrorPanel
        title="Could not load STEM Camps data"
        message={error instanceof Error ? error.message : String(error)}
        onRetry={() => {
          campsQuery.refetch();
          impactQuery.refetch();
          firstImpactQuery.refetch();
          secondImpactQuery.refetch();
          compareQuery.refetch();
        }}
      />
    );
  }
  if (camps.length === 0) {
    return (
      <>
        <Eyebrow>Programmes · STEM Camps</Eyebrow>
        <PageTitle>STEM Camps</PageTitle>
        <SscEmptyState year={null} campName={null} />
      </>
    );
  }
  if (!selectedYear || campsForYear.length === 0) {
    return (
      <>
        <Eyebrow>Programmes · STEM Camps</Eyebrow>
        <PageTitle>STEM Camps</PageTitle>
        <CampSelectors
          camps={camps}
          year={selectedYear}
          campId=""
          onChange={({ year }) => yearChange(year)}
        />
        <SscEmptyState year={selectedYear} campName={null} />
      </>
    );
  }
  const yearLabel = String(selectedYear);
  if (view === 'empty') {
    const campName = selectedCamp?.name ?? null;
    return (
      <>
        <Eyebrow>Programmes · STEM Camps</Eyebrow>
        <PageTitle>
          STEM Camps {selectedCampId ? `· ${selectedCamp?.name}` : ''}
        </PageTitle>
        <CampSelectors
          camps={camps}
          year={selectedYear}
          campId={selectedCampId}
          onChange={({ year, campId }) => {
            yearChange(year);
            setParams((p) => {
              p.set('camp', campId);
              return p;
            });
          }}
        />
        <SscEmptyState year={selectedYear} campName={campName} />
      </>
    );
  }
  if (view === 'single' && selectedCamp && impactQuery.data) {
    return (
      <>
        <Eyebrow>Programmes · STEM Camps</Eyebrow>
        <PageTitle>STEM Camps · {selectedCamp.name}</PageTitle>
        <Lede>
          {selectedCamp.name} ({yearLabel}) — {fmt(selectedCamp.participants)}
          participants. Figures below are for this camp alone; camp-specific
          measures are not comparable across camps.
        </Lede>
        <CampSelectors
          camps={camps}
          year={selectedYear}
          campId={selectedCampId}
          onChange={({ year, campId }) => {
            yearChange(year);
            setParams((p) => {
              p.set('camp', campId);
              return p;
            });
          }}
        />
        <SingleCampView
          camp={selectedCamp}
          impact={impactQuery.data}
          otherMissing={false}
        />
      </>
    );
  }

  if (view === 'both' && allCampsHaveResults) {
    const impacts: Record<string, SscImpactPayload | null> = {
      [firstCamp.id]: firstImpactQuery.data ?? null,
      ...(secondCamp ? { [secondCamp.id]: secondImpactQuery.data ?? null } : {}),
    };
    const primary = primaryCamp(campsForYear);
    return (
      <>
        <Eyebrow>Programmes · STEM Camps</Eyebrow>
        <PageTitle>STEM Camps · {yearLabel}</PageTitle>
        <Lede>
          {fmt(campsForYear.reduce((s, c) => s + c.participants, 0))}
          participants across {campsForYear.length} camps in {yearLabel}.
          Core measures use the same definition everywhere and are comparable
          across camps; camp-specific measures are not.
        </Lede>
        <CampSelectors
          camps={camps}
          year={selectedYear}
          campId=""
          onChange={({ year, campId }) => {
            yearChange(year);
            setParams((p) => {
              if (campId) p.set('camp', campId);
              else p.delete('camp');
              return p;
            });
          }}
        />
        <BothCampsView
          camps={campsForYear}
          impacts={impacts}
          compareRows={compareQuery.data ?? []}
          oneMissing={oneMissing}
        />
        {primary && impacts[primary.id] && (
          <>
            <div className="mt-8">
              <SectionHeading>
                Deep dive: {primary.name}
              </SectionHeading>
            </div>
            <SingleCampView
              camp={primary}
              impact={impacts[primary.id]}
              otherMissing={oneMissing}
            />
          </>
        )}
      </>
    );
  }

  return (
    <>
      <Eyebrow>Programmes · STEM Camps</Eyebrow>
      <PageTitle>STEM Camps</PageTitle>
      <Lede>Select a year and camp above to view results.</Lede>
      <CampSelectors
        camps={camps}
        year={selectedYear ?? 0}
        campId=""
        onChange={({ year }) => yearChange(year)}
      />
      <SscEmptyState year={selectedYear} campName={null} />
    </>
  );
}
