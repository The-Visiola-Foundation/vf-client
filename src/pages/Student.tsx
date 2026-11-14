import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { RosterRow } from '../types/mis';
import { Eyebrow, Grid4, PageTitle, SectionHeading } from '../components/ui/layout';
import { Blank, Card, Kpi, Notice } from '../components/ui/primitives';
import { Table, TableWrap, Td, Th, Tr } from '../components/ui/table';
import { ageOf } from '../lib/format';
import { queryOptionFactories } from '../queries/options';
import { EditStudentModal } from '../components/student/EditStudentModal';

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return <Blank />;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return <>{String(value)}</>;
}

interface ParticipationRecord {
  id: string;
  program: 'ASCG' | 'CBC' | 'SC' | 'OUTREACH' | string;
  year: number | string;
  detail: string;
  venue: string;
  status: string;
}

function extractParticipations(student: Record<string, unknown>, studentId: string): ParticipationRecord[] {
  const records: ParticipationRecord[] = [];
  const cbcProfile = student.cbcProfile as Record<string, unknown> | null;
  const ascgProfile = student.ascgProfile as Record<string, unknown> | null;

  const defaultSchool =
    (student.school as string) ||
    (cbcProfile?.school as string) ||
    (ascgProfile?.school as string) ||
    'Federal Capital Territory';

  // 1. ASCG participations array
  if (Array.isArray(student.ascgParticipation) && student.ascgParticipation.length > 0) {
    for (const p of student.ascgParticipation as Array<Record<string, unknown>>) {
      records.push({
        id: `ascg-${p.id ?? records.length}`,
        program: 'ASCG',
        year: (p.year as number | string) ?? '—',
        detail: String(p.type ?? 'After-School STEM Club'),
        venue: String(p.school ?? defaultSchool),
        status: String(p.status ?? 'Active'),
      });
    }
  }

  // 2. CBC participations array
  if (Array.isArray(student.cbcParticipation) && student.cbcParticipation.length > 0) {
    for (const p of student.cbcParticipation as Array<Record<string, unknown>>) {
      const isCompleted = cbcProfile?.completedProgram ? 'Completed' : 'Enrolled';
      const track = String(p.track ?? (p.trackId ? `Track ${p.trackId}` : 'Web Development'));
      const cohort = p.cohort ? `Cohort ${String(p.cohort).toUpperCase()}` : '';
      records.push({
        id: `cbc-${p.id ?? records.length}`,
        program: 'CBC',
        year: (p.year as number | string) ?? '—',
        detail: [track, cohort].filter(Boolean).join(' · '),
        venue: String(cbcProfile?.school ?? defaultSchool),
        status: isCompleted,
      });
    }
  }

  // 3. SC participations array
  if (Array.isArray(student.scParticipation) && student.scParticipation.length > 0) {
    for (const p of student.scParticipation as Array<Record<string, unknown>>) {
      records.push({
        id: `sc-${p.id ?? records.length}`,
        program: 'SC',
        year: (p.year as number | string) ?? '—',
        detail: `${String(p.type ?? 'SSC').toUpperCase()} STEM Clinic`,
        venue: String(p.school ?? defaultSchool),
        status: String(p.status ?? 'Completed'),
      });
    }
  }

  // 4. Generic participations array if present
  if (records.length === 0 && Array.isArray(student.participations) && student.participations.length > 0) {
    for (const p of student.participations as Array<Record<string, unknown>>) {
      records.push({
        id: String(p.id ?? records.length),
        program: String(p.program ?? p.type ?? 'ASCG').toUpperCase(),
        year: (p.year as number | string) ?? '—',
        detail: String(p.track ?? p.campType ?? p.role ?? p.type ?? 'Participant'),
        venue: String(p.school ?? p.venue ?? defaultSchool),
        status: String(p.status ?? 'Completed'),
      });
    }
  }

  // 5. Fallback derivation if no participation records exist in arrays
  if (records.length === 0) {
    if (cbcProfile || student.track || student.cohort) {
      records.push({
        id: `${studentId}-cbc-fallback`,
        program: 'CBC',
        year: (student.yearJoined as number | string) ?? 2023,
        detail: 'Coding Boot Camp',
        venue: defaultSchool,
        status: cbcProfile?.completedProgram ? 'Completed' : 'Enrolled',
      });
    } else {
      records.push({
        id: `${studentId}-ascg-fallback`,
        program: 'ASCG',
        year: (student.yearJoined as number | string) ?? 2024,
        detail: 'After-School STEM Club',
        venue: defaultSchool,
        status: 'Active',
      });
    }
  }

  return records;
}

function getProgramBadgeClass(program: string) {
  switch (program.toUpperCase()) {
    case 'ASCG':
      return 'bg-vf-blue/15 text-vf-blue border-vf-blue/30';
    case 'CBC':
      return 'bg-vf-purple/15 text-vf-purple border-vf-purple/30';
    case 'SC':
      return 'bg-vf-green/15 text-vf-green border-vf-green/30';
    default:
      return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
  }
}

export function StudentPage({ studentId: explicitId }: { studentId?: string }) {
  const { studentId: pathId } = useParams();
  const navigate = useNavigate();
  const id = explicitId ?? pathId ?? '';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const query = useQuery(queryOptionFactories.student(id));

  if (!id) {
    return (
      <>
        <Eyebrow>Records · student profile</Eyebrow>
        <PageTitle>Student details</PageTitle>
        <Notice variant="err" title="Missing student ID">
          <p>This page needs a valid student ID in the URL.</p>
        </Notice>
      </>
    );
  }

  if (query.isLoading) {
    return (
      <>
        <Eyebrow>Records · student profile</Eyebrow>
        <PageTitle>Student details</PageTitle>
        <div className="mt-6 flex items-center gap-3 text-muted">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-vf-blue border-t-transparent" />
          <span>Loading student record…</span>
        </div>
      </>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        <Eyebrow>Records · student profile</Eyebrow>
        <PageTitle>Student details</PageTitle>
        <Notice variant="err" title="Unable to load the student record">
          <p>
            {query.error instanceof Error
              ? query.error.message
              : 'The student could not be found.'}
          </p>
        </Notice>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="rounded-[7px] border border-line-2 bg-card px-3 py-2 text-[12.5px] font-semibold text-ink"
          >
            ← Back to register
          </button>
        </div>
      </>
    );
  }

  const student = query.data as Record<string, unknown> & { uid?: string };
  const first = (student.first ?? student.firstName ?? '') as string;
  const last = (student.last ?? student.lastName ?? '') as string;
  const dob = (student.dob ?? student.dateOfBirth ?? null) as string | null;
  const displayName = [first, last].filter(Boolean).join(' ') || `Student ${student.uid ?? id}`;
  const calculatedAge = student.age ?? (typeof dob === 'string' ? ageOf(dob) : null);
  const hasConsent = Boolean(student.consent);
  const participations = extractParticipations(student, student.uid ?? id);

  const cbcProfile = student.cbcProfile as Record<string, unknown> | null;
  const ascgProfile = student.ascgProfile as Record<string, unknown> | null;

  const personalInfo = [
    { label: 'Student ID', value: student.uid ?? id },
    { label: 'First name', value: first },
    { label: 'Last name', value: last },
    { label: 'Date of birth', value: dob },
    { label: 'Age', value: calculatedAge },
    { label: 'School', value: student.school },
    { label: 'Year joined', value: student.yearJoined },
    { label: 'Country of origin', value: student.country ?? 'Nigeria' },
    { label: 'Home address', value: student.address },
    { label: 'Email address', value: student.email },
    { label: 'Phone number', value: student.phone },
  ];

  const familyInfo = [
    { label: 'Father name', value: student.father },
    { label: 'Father phone', value: student.fatherPhone },
    { label: 'Father education', value: student.fatherEdu },
    { label: 'Mother name', value: student.mother },
    { label: 'Mother phone', value: student.motherPhone },
    { label: 'Mother education', value: student.motherEdu },
    { label: 'Brothers in family', value: student.bro },
    { label: 'Sisters in family', value: student.sis },
    {
      label: 'Parental consent',
      value: hasConsent ? (
        <span className="font-semibold text-vf-green">Consent on file</span>
      ) : (
        <span className="font-semibold text-vf-red">No consent recorded</span>
      ),
    },
  ];

  const cbcInfo = cbcProfile
    ? [
        { label: 'Associated School', value: cbcProfile.school },
        { label: 'Program Completion', value: cbcProfile.completedProgram ? 'Completed' : 'Enrolled' },
        { label: 'Prior Tech Education', value: cbcProfile.priorTechEducation },
        { label: 'Prior Tech Experience', value: cbcProfile.priorTechExperience },
        { label: 'Tech Engagement Level', value: cbcProfile.techEngagementLevel },
        { label: 'Outcome at 6 Months', value: cbcProfile.outcomeAt6Months },
        { label: 'Outcome at 12 Months', value: cbcProfile.outcomeAt12Months },
        { label: 'Current Role Title', value: cbcProfile.roleTitle },
        { label: 'Company / Employer', value: cbcProfile.company },
        { label: 'Industry Sector', value: cbcProfile.industry },
      ]
    : [];

  const academicInfo = [
    { label: 'Term 1 evaluation', value: student.t1 },
    { label: 'Term 2 evaluation', value: student.t2 },
    { label: 'Term 3 evaluation', value: student.t3 },
    { label: 'Performance band', value: student.band },
    { label: 'Favorite STEM subject', value: student.fav },
    { label: 'Most difficult subject', value: student.diff },
    { label: 'Career aspiration 1', value: student.car1 },
    { label: 'Career aspiration 2', value: student.car2 },
  ];

  return (
    <>
      <Eyebrow>Records · student profile</Eyebrow>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <PageTitle>{displayName}</PageTitle>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full border border-line-2 bg-paper px-2.5 py-0.5 text-[11.5px] font-mono text-muted">
              {student.uid ?? id}
            </span>
            {hasConsent ? (
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-emerald-700">
                Consent verified
              </span>
            ) : (
              <span className="rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-rose-700">
                No consent
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="rounded-[7px] border border-line-2 bg-card px-3 py-2 text-[12.5px] font-semibold text-ink hover:bg-paper"
          >
            ← Back to register
          </button>
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="rounded-[7px] bg-vf-blue px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-vf-blue/90"
          >
            ✏️ Edit student
          </button>
        </div>
      </div>

      {/* Hero KPIs */}
      <div className="mt-6">
        <Grid4>
          <Kpi
            label="Age / DOB"
            value={calculatedAge ? `${calculatedAge} yrs` : (dob ?? '—')}
            sub={dob ? `Born ${dob}` : 'Birth date not recorded'}
            accent="blue"
          />
          <Kpi
            label="Enrolled School"
            value={(student.school as string) || 'Not assigned'}
            sub="Federal Capital Territory"
            accent="green"
          />
          <Kpi
            label="Active Programs"
            value={participations.length}
            sub={`${participations.map((p) => p.program).join(', ')}`}
            accent="purple"
          />
          <Kpi
            label="NDPA Consent Status"
            value={
              hasConsent ? (
                <span className="text-vf-green">On file</span>
              ) : (
                <span className="text-vf-red">Missing</span>
              )
            }
            sub={hasConsent ? 'NDPA compliant' : 'Consent action required'}
            accent={hasConsent ? 'green' : 'red'}
          />
        </Grid4>
      </div>

      {/* Main Details Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Card 1: Personal & Contact */}
        <Card>
          <SectionHeading>Personal & Contact Information</SectionHeading>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th className="w-1/3">Field</Th>
                  <Th>Value</Th>
                </tr>
              </thead>
              <tbody>
                {personalInfo.map((row) => (
                  <Tr key={row.label}>
                    <Td>
                      <strong className="text-ink-2">{row.label}</strong>
                    </Td>
                    <Td>{formatValue(row.value)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>

        {/* Card 2: Family & Demographics */}
        <Card>
          <SectionHeading>Family Background & Demographics</SectionHeading>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th className="w-1/3">Field</Th>
                  <Th>Value</Th>
                </tr>
              </thead>
              <tbody>
                {familyInfo.map((row) => (
                  <Tr key={row.label}>
                    <Td>
                      <strong className="text-ink-2">{row.label}</strong>
                    </Td>
                    <Td>{formatValue(row.value)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>

        {/* Card 3: Programme Participations */}
        <Card className="lg:col-span-2">
          <SectionHeading>Programme Participations & History</SectionHeading>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Programme</Th>
                  <Th>Year</Th>
                  <Th>Track / Camp Details</Th>
                  <Th>School / Venue</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {participations.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getProgramBadgeClass(
                          p.program,
                        )}`}
                      >
                        {p.program}
                      </span>
                    </Td>
                    <Td className="font-mono text-[12.5px]">{p.year}</Td>
                    <Td>{p.detail}</Td>
                    <Td>{p.venue}</Td>
                    <Td>
                      <span className="font-semibold text-ink-2">{p.status}</span>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>

        {/* Card 4: CBC Profile Card (Rendered if CBC Profile exists) */}
        {cbcProfile ? (
          <Card className="lg:col-span-2">
            <SectionHeading>Coding Boot Camp (CBC) Graduate Details</SectionHeading>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th className="w-1/3">CBC Attribute</Th>
                    <Th>Value</Th>
                  </tr>
                </thead>
                <tbody>
                  {cbcInfo.map((row) => (
                    <Tr key={row.label}>
                      <Td>
                        <strong className="text-ink-2">{row.label}</strong>
                      </Td>
                      <Td>{formatValue(row.value)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        ) : null}

        {/* Card 5: Academic Record & Aspirations (Rendered if ASCG data exists) */}
        {ascgProfile || student.fav || student.diff || student.t1 ? (
          <Card className="lg:col-span-2">
            <SectionHeading>Academic Performance & Career Aspirations</SectionHeading>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th className="w-1/3">Metric / Preference</Th>
                    <Th>Recorded Value</Th>
                  </tr>
                </thead>
                <tbody>
                  {academicInfo.map((row) => (
                    <Tr key={row.label}>
                      <Td>
                        <strong className="text-ink-2">{row.label}</strong>
                      </Td>
                      <Td>{formatValue(row.value)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        ) : null}
      </div>

      {/* Edit Student Modal */}
      <EditStudentModal
        student={student as RosterRow}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}
