
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { Student } from '../types/mis';
import { useUpdateStudent } from '../queries/useRegister';
import { queryOptionFactories } from '../queries/options';
import { ageOf } from '../lib/format';
import { Eyebrow, Grid2, PageTitle, SectionHeading } from '../components/ui/layout';
import { Blank, Card, Kpi, Notice } from '../components/ui/primitives';
import { Table, TableWrap, Td, Th, Tr } from '../components/ui/table';

type EditorType =
  | 'student'
  | 'ascg-profile'
  | 'cbc-profile'
  | 'ascg-participation'
  | 'cbc-participation'
  | 'sc-participation';

interface ParticipationRecord {
  id: string;
  program: 'ASCG' | 'CBC' | 'SC';
  year: number | string;
  detail: string;
  venue: string;
  source: 'ascg' | 'cbc' | 'sc';
}

interface FormField {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  options?: string[];
}

const inputClass =
  'w-full rounded-[6px] border border-line-2 bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-vf-blue';

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return <Blank />;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

function getProgramBadgeClass(program: string) {
  switch (program) {
    case 'ASCG':
      return 'bg-vf-blue/15 text-vf-blue border-vf-blue/30';
    case 'CBC':
      return 'bg-vf-purple/15 text-vf-purple border-vf-purple/30';
    case 'SC':
      return 'bg-vf-green/15 text-vf-green border-vf-green/30';
    default:
      return 'bg-paper text-ink border-line';
  }
}

function extractParticipations(student: Student): ParticipationRecord[] {
  const records: ParticipationRecord[] = [];

  for (const p of student.ascgParticipation ?? []) {
    records.push({
      id: `ascg-${p.id}`,
      program: 'ASCG',
      year: p.year,
      detail: [
        p.type || 'After-School STEM Club',
        p.class ? `Class ${p.class}` : null,
      ].filter(Boolean).join(' · '),
      venue: p.schoolName || 'Not recorded',
      source: 'ascg',
    });
  }

  for (const p of student.cbcParticipation ?? []) {
    records.push({
      id: `cbc-${p.id}`,
      program: 'CBC',
      year: p.year,
      detail: [
        p.track || 'Track not specified',
        p.cohort ? `Cohort ${String(p.cohort).toUpperCase()}` : null,
      ].filter(Boolean).join(' · '),
      venue: student.cbcProfile?.school || 'Not recorded',
      source: 'cbc',
    });
  }

  for (const p of student.scParticipation ?? []) {
    records.push({
      id: `sc-${p.id}`,
      program: 'SC',
      year: p.year,
      detail: [
        p.type?.toUpperCase() || 'STEM Camp',
        p.theme || null,
      ].filter(Boolean).join(' · '),
      venue: 'Not recorded',
      source: 'sc',
    });
  }

  return records.sort((a, b) => Number(b.year) - Number(a.year));
}

function InfoTable({
  rows,
  emptyMessage = 'No information recorded.',
}: {
  rows: { label: string; value: unknown }[];
  emptyMessage?: string;
}) {
  if (!rows.length) {
    return <p className="py-5 text-[13px] text-muted">{emptyMessage}</p>;
  }

  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            <Th className="w-1/3">Field</Th>
            <Th>Value</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
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
  );
}

function SectionAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[7px] border border-line-2 bg-card px-3 py-1.5 text-[12px] font-semibold text-vf-blue hover:bg-paper"
    >
      {label}
    </button>
  );
}

const placeholderFields: Record<
  Exclude<EditorType, 'student'>,
  FormField[]
> = {
  'ascg-profile': [
    { name: 'fatherFirstName', label: 'Father first name' },
    { name: 'fatherLastName', label: 'Father last name' },
    { name: 'fatherPhone', label: 'Father phone', type: 'tel' },
    { name: 'fatherEducation', label: 'Father education' },
    { name: 'motherFirstName', label: 'Mother first name' },
    { name: 'motherLastName', label: 'Mother last name' },
    { name: 'motherPhone', label: 'Mother phone', type: 'tel' },
    { name: 'motherEducation', label: 'Mother education' },
    { name: 'numberOfBrothers', label: 'Number of brothers', type: 'number' },
    { name: 'numberOfSisters', label: 'Number of sisters', type: 'number' },
    { name: 'positionInFamily', label: 'Position in family' },
    { name: 'specialization', label: 'Specialization' },
    { name: 'favouriteSubject', label: 'Favourite subject' },
    { name: 'mostDifficultSubject', label: 'Most difficult subject' },
    { name: 'careerChoice1', label: 'Career aspiration 1' },
    { name: 'careerChoice2', label: 'Career aspiration 2' },
    { name: 'parentalConsent', label: 'Parental consent', type: 'checkbox' },
  ],
  'cbc-profile': [
    { name: 'school', label: 'School' },
    { name: 'priorTechEducation', label: 'Prior technology education' },
    { name: 'priorTechExperience', label: 'Prior technology experience' },
    { name: 'completedProgram', label: 'Completed program', type: 'checkbox' },
    { name: 'outcomeAt6Months', label: 'Outcome at 6 months' },
    { name: 'outcomeAt12Months', label: 'Outcome at 12 months' },
    { name: 'roleTitle', label: 'Current role title' },
    { name: 'company', label: 'Company / Employer' },
    { name: 'industry', label: 'Industry' },
    { name: 'techEngagementLevel', label: 'Technology engagement level' },
  ],
  'ascg-participation': [
    { name: 'schoolId', label: 'School ID' },
    { name: 'type', label: 'Participation type' },
    { name: 'class', label: 'Class' },
    { name: 'year', label: 'Year', type: 'number' },
  ],
  'cbc-participation': [
    { name: 'cohort', label: 'Cohort' },
    { name: 'trackId', label: 'Track ID' },
    { name: 'year', label: 'Year', type: 'number' },
  ],
  'sc-participation': [
    { name: 'theme', label: 'Camp theme' },
    { name: 'type', label: 'Camp type' },
    { name: 'year', label: 'Year', type: 'number' },
  ],
};

const editorTitles: Record<EditorType, string> = {
  student: 'Student information',
  'ascg-profile': 'ASCG profile',
  'cbc-profile': 'CBC profile',
  'ascg-participation': 'ASCG participation',
  'cbc-participation': 'CBC participation',
  'sc-participation': 'STEM Camp participation',
};

function StudentInformationModal({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) {
  const updateMutation = useUpdateStudent();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: student.firstName ?? '',
    lastName: student.lastName ?? '',
    dateOfBirth: student.dateOfBirth ?? '',
    email: student.email ?? '',
    phone: student.phone ?? '',
    address: student.address ?? '',
    country: student.country ?? '',
    yearJoined: student.yearJoined?.toString() ?? '',
    consent: Boolean(student.consent),
  });

  function change(field: keyof typeof form, value: string | boolean) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await updateMutation.mutateAsync({
        id: student.id,
        payload: {
          firstName: form.firstName.trim() || null,
          lastName: form.lastName.trim() || null,
          dateOfBirth: form.dateOfBirth || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          country: form.country.trim() || null,
          yearJoined: form.yearJoined ? Number(form.yearJoined) : null,
          consent: form.consent,
        },
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update student.');
    }
  }

  const fields = [
    { name: 'firstName', label: 'First name', type: 'text' },
    { name: 'lastName', label: 'Last name', type: 'text' },
    { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
    { name: 'email', label: 'Email address', type: 'email' },
    { name: 'phone', label: 'Phone number', type: 'tel' },
    { name: 'country', label: 'Country of origin', type: 'text' },
    { name: 'yearJoined', label: 'Year joined', type: 'number' },
    { name: 'address', label: 'Home address', type: 'text' },
  ] as const;

  return (
    <ModalShell title="Student information" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className="block">
              <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                {field.label}
              </span>
              <input
                type={field.type}
                value={form[field.name]}
                onChange={(e) => change(field.name, e.target.value)}
                className={inputClass}
              />
            </label>
          ))}

          <label className="col-span-full flex items-center gap-2 text-[13px] font-medium text-ink">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => change('consent', e.target.checked)}
              className="h-4 w-4"
            />
            NDPA consent recorded
          </label>
        </div>

        {error && (
          <div className="px-5 pb-3">
            <Notice variant="err" title="Update failed">
              <p>{error}</p>
            </Notice>
          </div>
        )}

        <ModalFooter
          onClose={onClose}
          saving={updateMutation.isPending}
        />
      </form>
    </ModalShell>
  );
}

function PlaceholderFormModal({
  type,
  student,
  record,
  onClose,
}: {
  type: Exclude<EditorType, 'student'>;
  student: Student;
  record?: ParticipationRecord;
  onClose: () => void;
}) {
  const fields = placeholderFields[type];
  const [submitted, setSubmitted] = useState(false);

  const existingValues: Record<string, unknown> = (() => {
    switch (type) {
      case 'ascg-profile':
        return student.ascgProfile ?? {};
      case 'cbc-profile':
        return student.cbcProfile ?? {};
      case 'ascg-participation':
        return student.ascgParticipation?.find((p) => `ascg-${p.id}` === record?.id) ?? {};
      case 'cbc-participation':
        return student.cbcParticipation?.find((p) => `cbc-${p.id}` === record?.id) ?? {};
      case 'sc-participation':
        return student.scParticipation?.find((p) => `sc-${p.id}` === record?.id) ?? {};
    }
  })();

  const [form, setForm] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(
      fields.map((field) => {
        const value = existingValues[field.name];
        return [
          field.name,
          field.type === 'checkbox'
            ? Boolean(value)
            : value === null || value === undefined
              ? ''
              : String(value),
        ];
      }),
    ),
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <ModalShell title={editorTitles[type]} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
          <p className="text-[12px] text-muted">
            Student: {student.firstName} {student.lastName}
          </p>

          {submitted && (
            <Notice variant="warn" title="Backend integration pending">
              <p>
                Your entries have not been saved. The API operation for this
                section has not been implemented yet.
              </p>
            </Notice>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label
                key={field.name}
                className={`block ${field.type === 'checkbox' ? 'sm:col-span-2' : ''}`}
              >
                {field.type === 'checkbox' ? (
                  <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                    <input
                      type="checkbox"
                      checked={Boolean(form[field.name])}
                      onChange={(e) =>
                        setForm((previous) => ({
                          ...previous,
                          [field.name]: e.target.checked,
                        }))
                      }
                    />
                    {field.label}
                  </span>
                ) : (
                  <>
                    <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                      {field.label}
                    </span>
                    <input
                      type={field.type ?? 'text'}
                      value={String(form[field.name] ?? '')}
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        setForm((previous) => ({
                          ...previous,
                          [field.name]: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line bg-paper px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[7px] border border-line-2 bg-card px-3.5 py-2 text-[12px] font-semibold text-ink"
          >
            Close
          </button>
          <button
            type="submit"
            className="rounded-[7px] bg-vf-blue px-4 py-2 text-[12px] font-semibold text-white"
          >
            {record ? 'Update' : 'Add'} record
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[90vh] w-full max-w-[680px] flex-col overflow-hidden rounded-card border border-line bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-paper hover:text-ink"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({
  onClose,
  saving,
}: {
  onClose: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-line bg-paper px-5 py-3">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="rounded-[7px] border border-line-2 bg-card px-3.5 py-2 text-[12px] font-semibold text-ink"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-[7px] bg-vf-blue px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

export function StudentPage({
  studentId: explicitId,
}: {
  studentId?: string;
}) {
  const { studentId: pathId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = explicitId ?? pathId ?? '';

  const [editor, setEditor] = useState<{
    type: EditorType;
    record?: ParticipationRecord;
  } | null>(null);

  const query = useQuery({
    ...queryOptionFactories.student(id),
    enabled: Boolean(id),
  });

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
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="mt-4 rounded-[7px] border border-line-2 bg-card px-3 py-2 text-[12px] font-semibold text-ink"
        >
          ← Back to register
        </button>
      </>
    );
  }

  const student = query.data as Student;
  const displayName =
    [student.firstName, student.lastName].filter(Boolean).join(' ') ||
    `Student ${student.id}`;

  const calculatedAge = student.dateOfBirth
    ? ageOf(student.dateOfBirth)
    : null;

  const participations = extractParticipations(student);
  const programs = [...new Set(participations.map((p) => p.program))];

  const personalInfo = [
    { label: 'First name', value: student.firstName },
    { label: 'Last name', value: student.lastName },
    { label: 'Date of birth', value: student.dateOfBirth },
    { label: 'Age', value: calculatedAge ? `${calculatedAge} years` : null },
    { label: 'Year joined', value: student.yearJoined },
    { label: 'Country', value: student.country },
    { label: 'Home address', value: student.address },
    { label: 'Email address', value: student.email },
    { label: 'Phone number', value: student.phone },
    { label: 'NDPA consent', value: student.consent ? 'Recorded' : 'Not recorded' },
  ];

  const ascg = student.ascgProfile;
  const cbc = student.cbcProfile;

  const familyInfo = ascg
    ? [
        {
          label: 'Father name',
          value: [ascg.fatherFirstName, ascg.fatherLastName].filter(Boolean).join(' '),
        },
        { label: 'Father phone', value: ascg.fatherPhone },
        { label: 'Father education', value: ascg.fatherEducation },
        {
          label: 'Mother name',
          value: [ascg.motherFirstName, ascg.motherLastName].filter(Boolean).join(' '),
        },
        { label: 'Mother phone', value: ascg.motherPhone },
        { label: 'Mother education', value: ascg.motherEducation },
        { label: 'Brothers', value: ascg.numberOfBrothers },
        { label: 'Sisters', value: ascg.numberOfSisters },
        { label: 'Position in family', value: ascg.positionInFamily },
        { label: 'Parental consent', value: ascg.parentalConsent },
      ]
    : [];

  const academicInfo = ascg
    ? [
        { label: 'Specialization', value: ascg.specialization },
        { label: 'Favourite subject', value: ascg.favouriteSubject },
        { label: 'Most difficult subject', value: ascg.mostDifficultSubject },
        { label: 'Career aspiration 1', value: ascg.careerChoice1 },
        { label: 'Career aspiration 2', value: ascg.careerChoice2 },
      ]
    : [];

  const cbcInfo = cbc
    ? [
        { label: 'Associated school', value: cbc.school },
        { label: 'Program completion', value: cbc.completedProgram },
        { label: 'Prior tech education', value: cbc.priorTechEducation },
        { label: 'Prior tech experience', value: cbc.priorTechExperience },
        { label: 'Tech engagement level', value: cbc.techEngagementLevel },
        { label: 'Outcome at 6 months', value: cbc.outcomeAt6Months },
        { label: 'Outcome at 12 months', value: cbc.outcomeAt12Months },
        { label: 'Current role', value: cbc.roleTitle },
        { label: 'Company / Employer', value: cbc.company },
        { label: 'Industry', value: cbc.industry },
      ]
    : [];

  const groupedParticipations = {
    ASCG: participations.filter((p) => p.program === 'ASCG'),
    CBC: participations.filter((p) => p.program === 'CBC'),
    SC: participations.filter((p) => p.program === 'SC'),
  };

  function openEditor(type: EditorType, record?: ParticipationRecord) {
    setEditor({ type, record });
  }

  function closeEditor() {
    setEditor(null);
    queryClient.invalidateQueries({
      queryKey: queryOptionFactories.student(id).queryKey,
    });
  }

  return (
    <>
      <Eyebrow>Records · student profile</Eyebrow>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <PageTitle>{displayName}</PageTitle>
          <p className="mt-1 text-[12px] text-muted">
            Student ID: {student.id}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/register')}
          className="rounded-[7px] border border-line-2 bg-card px-3 py-2 text-[12px] font-semibold text-ink hover:bg-paper"
        >
          ← Back to register
        </button>
      </div>

      <div className="mt-6">
        <Grid2>
          <Kpi
            label="Age"
            value={calculatedAge ? `${calculatedAge} yrs` : '—'}
            sub={student.dateOfBirth ? `Born ${student.dateOfBirth}` : 'Date of birth not recorded'}
            accent="blue"
          />
          <Kpi
            label="Programs involved"
            value={programs.length}
            sub={programs.join(', ') || 'No programs recorded'}
            accent="purple"
          />
          <Kpi
            label="Participation records"
            value={participations.length}
            sub="Total recorded program participations"
            accent="green"
          />
          <Kpi
            label="NDPA consent"
            value={student.consent ? 'On file' : 'Missing'}
            sub={student.consent ? 'Consent recorded' : 'No consent recorded'}
            accent={student.consent ? 'green' : 'red'}
          />
        </Grid2>
      </div>

      <div className="mt-8 space-y-6">
        {/* Student information */}
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SectionHeading>Student information</SectionHeading>
            <SectionAction
              label="Edit information"
              onClick={() => openEditor('student')}
            />
          </div>
          <InfoTable rows={personalInfo} />
        </Card>

        {/* ASCG profile */}
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionHeading>ASCG profile</SectionHeading>
              <p className="mt-1 text-[11px] text-muted">
                Family background, demographics, academic interests and career aspirations.
              </p>
            </div>
            <SectionAction
              label={ascg ? 'Edit profile' : 'Add profile'}
              onClick={() => openEditor('ascg-profile')}
            />
          </div>

          {ascg ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-ink">
                  Family background
                </h3>
                <InfoTable rows={familyInfo} />
              </div>
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-ink">
                  Academic interests
                </h3>
                <InfoTable rows={academicInfo} />
              </div>
            </div>
          ) : (
            <p className="py-4 text-[13px] text-muted">
              No ASCG profile has been added for this student.
            </p>
          )}
        </Card>

        {/* CBC profile */}
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionHeading>Coding Boot Camp profile</SectionHeading>
              <p className="mt-1 text-[11px] text-muted">
                Technology background, program completion and graduate outcomes.
              </p>
            </div>
            <SectionAction
              label={cbc ? 'Edit profile' : 'Add profile'}
              onClick={() => openEditor('cbc-profile')}
            />
          </div>

          {cbc ? (
            <InfoTable rows={cbcInfo} />
          ) : (
            <p className="py-4 text-[13px] text-muted">
              No CBC profile has been added for this student.
            </p>
          )}
        </Card>

        {/* Program participation */}
        <Card>
          <div className="mb-4">
            <SectionHeading>Program participation history</SectionHeading>
            <p className="mt-1 text-[11px] text-muted">
              Participation records are grouped by program. Add or edit individual records.
            </p>
          </div>

          {(
            [
              ['ASCG', 'ascg-participation'],
              ['CBC', 'cbc-participation'],
              ['SC', 'sc-participation'],
            ] as const
          ).map(([program, editorType]) => {
            const records = groupedParticipations[program];

            return (
              <div key={program} className="mb-6 last:mb-0">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getProgramBadgeClass(program)}`}
                    >
                      {program === 'SC' ? 'STEM Camp' : program}
                    </span>
                    <span className="text-[11px] text-muted">
                      {records.length} {records.length === 1 ? 'record' : 'records'}
                    </span>
                  </div>

                  <SectionAction
                    label="Add participation"
                    onClick={() => openEditor(editorType)}
                  />
                </div>

                {records.length ? (
                  <TableWrap>
                    <Table>
                      <thead>
                        <tr>
                          <Th>Year</Th>
                          <Th>Details</Th>
                          <Th>School / Venue</Th>
                          <Th>Action</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record) => (
                          <Tr key={record.id}>
                            <Td className="font-mono text-[12px]">
                              {record.year}
                            </Td>
                            <Td>{record.detail}</Td>
                            <Td>{record.venue}</Td>
                            <Td>
                              <button
                                type="button"
                                onClick={() => openEditor(editorType, record)}
                                className="text-[12px] font-semibold text-vf-blue hover:underline"
                              >
                                Edit
                              </button>
                            </Td>
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  </TableWrap>
                ) : (
                  <p className="rounded-[7px] border border-dashed border-line p-4 text-[12px] text-muted">
                    No {program === 'SC' ? 'STEM Camp' : program} participation records.
                  </p>
                )}
              </div>
            );
          })}
        </Card>
      </div>

      {editor?.type === 'student' && (
        <StudentInformationModal
          student={student}
          onClose={closeEditor}
        />
      )}

      {editor && editor.type !== 'student' && (
        <PlaceholderFormModal
          type={editor.type}
          student={student}
          record={editor.record}
          onClose={closeEditor}
        />
      )}
    </>
  );
}
