import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Student } from '../types/mis';
import { useSaveStudentSection, useSchools, useUpdateStudent } from '../queries/useRegister';
import type {
  AscgParticipationPayload,
  AscgProfilePayload,
  CbcParticipationPayload,
  CbcProfilePayload,
  ScParticipationPayload,
} from '../lib/api';
import { queryOptionFactories } from '../queries/options';
import { ageOf, fmt } from '../lib/format';
import { Eyebrow, Grid4, Heading, PageTitle } from '../components/ui/layout';
import { Blank, Card, Kpi, Notice } from '../components/ui/primitives';
import { Table, TableWrap, Td, Th, Tr } from '../components/ui/table';

/**
 * Set to false to disable the profile and enrolment edit buttons.
 * Saving for these sections is not connected yet: see `submit` in SectionFormModal.
 */
const SECTION_EDITING_AVAILABLE = true;
const EDITING_UNAVAILABLE_HINT = 'Editing this section is not available yet';

type EditorType =
  | 'student'
  | 'ascg-profile'
  | 'cbc-profile'
  | 'ascg-participation'
  | 'cbc-participation'
  | 'sc-participation';

type SectionEditorType = Exclude<EditorType, 'student'>;

interface ParticipationRecord {
  id: string;
  entityId: number;
  program: 'ASCG' | 'CBC' | 'SC';
  year: number | string;
  detail: string;
  venue: string | null;
  source: 'ascg' | 'cbc' | 'sc';
  raw: Record<string, unknown>;
}

interface FormField {
  name: string;
  label: string;
  /** Any HTML input type, plus 'checkbox' and 'school' (a dropdown of schools, value = school id). */
  type?: string;
  placeholder?: string;
  options?: string[];
}

interface SchoolOption {
  id: string;
  name: string;
}

type ConsentChoice = 'unknown' | 'yes' | 'no';

const inputClass =
  'w-full rounded-[6px] border border-line-2 bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-vf-blue';

// ---- helpers ----------------------------------------------------------------

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return <Blank />;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// "one" -> "Cohort One"
function formatCohort(cohort: unknown) {
  const value = String(cohort ?? '').trim().toLowerCase();
  if (!value) return null;
  const label = value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return label.startsWith('Cohort') ? label : `Cohort ${label}`;
}

function formatCampType(type: unknown) {
  const value = String(type ?? '').trim().toLowerCase();
  if (value === 'ssc') return 'STEM Summer Camp';
  if (value === 'dsc') return 'December STEM Camp';
  return value ? value.toUpperCase() : 'STEM Camp';
}

function toConsentChoice(value: boolean | null | undefined): ConsentChoice {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return 'unknown';
}

function fromConsentChoice(choice: ConsentChoice): boolean | null {
  if (choice === 'yes') return true;
  if (choice === 'no') return false;
  return null;
}

function consentLabel(value: boolean | null | undefined) {
  if (value === true) return 'Recorded';
  if (value === false) return 'Not given';
  return 'Not recorded';
}

/**
 * Normalises the useSchools() result into { id, name } options.
 * Accepts `name`, `schoolName` or `school` for the display name.
 * Adjust here if your hook returns a different shape.
 */
function toSchoolOptions(data: unknown): SchoolOption[] {
  const items = Array.isArray(data) ? data : data ? [data] : [];

  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const outer = item as Record<string, unknown>;
      const row =
        outer.json && typeof outer.json === 'object'
          ? (outer.json as Record<string, unknown>)
          : outer;
      return {
        id: String(row.id ?? ''),
        name: String(row.name ?? row.schoolName ?? row.school ?? ''),
      };
    })
    .filter((school): school is SchoolOption => Boolean(school?.id && school.name))
    .sort((a, b) => a.name.localeCompare(b.name));
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
      entityId: p.id,
      program: 'ASCG',
      year: p.year,
      detail: [p.type || 'Afterschool STEM Club', p.class ? `Class ${p.class}` : null]
        .filter(Boolean)
        .join(' · '),
      venue: p.schoolName || null,
      source: 'ascg',
      raw: p as unknown as Record<string, unknown>,
    });
  }

  for (const p of student.cbcParticipation ?? []) {
    records.push({
      id: `cbc-${p.id}`,
      entityId: p.id,
      program: 'CBC',
      year: p.year,
      detail: [p.track || 'Track not specified', formatCohort(p.cohort)]
        .filter(Boolean)
        .join(' · '),
      venue: student.cbcProfile?.school || null,
      source: 'cbc',
      raw: p as unknown as Record<string, unknown>,
    });
  }

  for (const p of student.scParticipation ?? []) {
    records.push({
      id: `sc-${p.id}`,
      entityId: p.id,
      program: 'SC',
      year: p.year,
      detail: [formatCampType(p.type), p.theme || null].filter(Boolean).join(' · '),
      venue: null,
      source: 'sc',
      raw: p as unknown as Record<string, unknown>,
    });
  }

  const yearOf = (y: number | string) => {
    const n = Number(y);
    return Number.isFinite(n) ? n : 0;
  };
  return records.sort((a, b) => yearOf(b.year) - yearOf(a.year));
}

// ---- small components -------------------------------------------------------

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
  disabled = false,
  title,
  ariaLabel,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? title : undefined}
      aria-label={ariaLabel}
      className="rounded-[7px] border border-line-2 bg-card px-3 py-1.5 text-[12px] font-semibold text-vf-blue hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-card"
    >
      {label}
    </button>
  );
}

const sectionFields: Record<SectionEditorType, FormField[]> = {
  'ascg-profile': [
    { name: 'schoolId', label: 'School', type: 'school' },
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
    { name: 'year', label: 'Year', type: 'number' },
  ],
  'cbc-profile': [
    { name: 'school', label: 'School' },
    { name: 'priorTechEducation', label: 'Prior technology education' },
    { name: 'priorTechExperience', label: 'Prior technology experience' },
    { name: 'track', label: 'Track' },
    { name: 'completedProgram', label: 'Completed programme', type: 'checkbox' },
    { name: 'outcomeAt6Months', label: 'Outcome at 6 months' },
    { name: 'outcomeAt12Months', label: 'Outcome at 12 months' },
    { name: 'roleTitle', label: 'Current role title' },
    { name: 'company', label: 'Company or employer' },
    { name: 'industry', label: 'Industry' },
    { name: 'techEngagementLevel', label: 'Technology engagement level' },
    { name: 'cohort', label: 'Cohort', options: ['one', 'two', 'weekend'] },
  ],
  'ascg-participation': [
    { name: 'schoolId', label: 'School', type: 'school' },
    { name: 'type', label: 'Type', options: ['ASCG', 'CBC', 'SC', 'OUTREACH'] },
    { name: 'year', label: 'Year', type: 'number' },
  ],
  'cbc-participation': [
    { name: 'cohort', label: 'Cohort', options: ['one', 'two', 'weekend'] },
    { name: 'track', label: 'Track' },
    { name: 'trackId', label: 'Track ID' },
    { name: 'year', label: 'Year', type: 'number' },
  ],
  'sc-participation': [
    { name: 'school', label: 'School' },
    { name: 'type', label: 'Camp', options: ['ssc', 'dsc'] },
    { name: 'year', label: 'Year', type: 'number' },
  ],
};

const editorTitles: Record<SectionEditorType, string> = {
  'ascg-profile': 'ASCG profile',
  'cbc-profile': 'CBC profile',
  'ascg-participation': 'ASCG enrolment',
  'cbc-participation': 'CBC enrolment',
  'sc-participation': 'STEM Camps enrolment',
};

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] w-full max-w-170 flex-col overflow-hidden rounded-card border border-line bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-[16px] font-semibold text-ink">
            {title}
          </h2>
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
  onCancel,
  saving,
  submitLabel = 'Save changes',
}: {
  onCancel: () => void;
  saving: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-line bg-paper px-5 py-3">
      <button
        type="button"
        onClick={onCancel}
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
        {saving ? 'Saving…' : submitLabel}
      </button>
    </div>
  );
}

// ---- modals -----------------------------------------------------------------

function StudentInformationModal({
  student,
  onClose,
}: {
  student: Student;
  /** `saved` is true only after a successful save. */
  onClose: (saved: boolean) => void;
}) {
  const updateMutation = useUpdateStudent();
  const [error, setError] = useState<string | null>(null);

  const [initial] = useState(() => ({
    firstName: student.firstName ?? '',
    lastName: student.lastName ?? '',
    dateOfBirth: student.dateOfBirth ?? '',
    email: student.email ?? '',
    phone: student.phone ?? '',
    address: student.address ?? '',
    country: student.country ?? '',
    yearJoined: student.yearJoined?.toString() ?? '',
    consent: toConsentChoice(student.consent as boolean | null | undefined),
  }));
  const [form, setForm] = useState(initial);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  function change(field: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function requestClose() {
    if (updateMutation.isPending) return;
    if (dirty && !window.confirm('Discard your changes?')) return;
    onClose(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Enter a first name and a last name.');
      return;
    }
    if (form.dateOfBirth && new Date(form.dateOfBirth) > new Date()) {
      setError('Date of birth cannot be in the future.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: student.id,
        payload: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          dateOfBirth: form.dateOfBirth || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          country: form.country.trim() || null,
          yearJoined: form.yearJoined ? Number(form.yearJoined) : null,
          // null means "not recorded". Confirm the API accepts null here.
          consent: fromConsentChoice(form.consent),
        },
      });

      onClose(true);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'The changes could not be saved. Try again.',
      );
    }
  }

  const fields = [
    { name: 'firstName', label: 'First name', type: 'text', required: true },
    { name: 'lastName', label: 'Last name', type: 'text', required: true },
    { name: 'dateOfBirth', label: 'Date of birth', type: 'date', required: false },
    { name: 'email', label: 'Email address', type: 'email', required: false },
    { name: 'phone', label: 'Phone number', type: 'tel', required: false },
    { name: 'country', label: 'Country', type: 'text', required: false },
    { name: 'yearJoined', label: 'Year joined', type: 'number', required: false },
    { name: 'address', label: 'Home address', type: 'text', required: false },
  ] as const;

  return (
    <ModalShell title="Edit student details" onClose={requestClose}>
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className="block">
              <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                {field.label}
                {field.required ? ' *' : ''}
              </span>
              <input
                type={field.type}
                value={form[field.name]}
                required={field.required}
                max={field.type === 'date' ? new Date().toISOString().slice(0, 10) : undefined}
                onChange={(e) => change(field.name, e.target.value)}
                className={inputClass}
              />
            </label>
          ))}

          <label className="col-span-full block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-2">
              Data protection consent (NDPA)
            </span>
            <select
              value={form.consent}
              onChange={(e) => change('consent', e.target.value)}
              className={inputClass}
            >
              <option value="unknown">Not recorded</option>
              <option value="yes">Recorded</option>
              <option value="no">Not given</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="px-5 pb-3">
            <Notice variant="err" title="Changes not saved">
              <p>{error}</p>
            </Notice>
          </div>
        )}

        <ModalFooter onCancel={requestClose} saving={updateMutation.isPending} />
      </form>
    </ModalShell>
  );
}

function SectionFormModal({
  type,
  student,
  record,
  schools,
  onClose,
}: {
  type: SectionEditorType;
  student: Student;
  record?: ParticipationRecord;
  schools: SchoolOption[];
  /** `saved` is true only after a successful save. */
  onClose: (saved: boolean) => void;
}) {
  const fields = sectionFields[type];
  const [error, setError] = useState<string | null>(null);
  const saveSection = useSaveStudentSection();

  const existingValues: Record<string, unknown> = (() => {
    switch (type) {
      case 'ascg-profile':
        return student.ascgProfile ? { ...student.ascgProfile } : {};
      case 'cbc-profile':
        return student.cbcProfile ? { ...student.cbcProfile } : {};
      default:
        return record?.raw ?? {};
    }
  })();

  const recordId =
    type === 'ascg-profile'
      ? student.ascgProfile?.id
      : type === 'cbc-profile'
        ? student.cbcProfile?.id
        : record?.entityId;
  const isEditing = recordId !== undefined;

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

  function setField(name: string, value: string | boolean) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  const optionalString = (name: string) => {
    const value = form[name];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  };
  const optionalNumber = (name: string) => {
    const value = optionalString(name);
    if (value === null) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };
  const requiredYear = () => {
    const year = optionalNumber('year');
    return year !== null && Number.isInteger(year) && year > 0 ? year : null;
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const year = requiredYear();
    if (
      (type === 'ascg-participation' && !optionalString('schoolId')) ||
      ((type === 'ascg-participation' || type === 'cbc-participation' || type === 'sc-participation') &&
        year === null)
    ) {
      setError(
        type === 'ascg-participation'
          ? 'Select a school and enter a valid year.'
          : 'Enter a valid year.',
      );
      return;
    }

    try {
      switch (type) {
        case 'ascg-profile': {
          const payload: AscgProfilePayload = {
            schoolId: optionalString('schoolId'),
            fatherFirstName: optionalString('fatherFirstName'),
            fatherLastName: optionalString('fatherLastName'),
            fatherPhone: optionalString('fatherPhone'),
            fatherEducation: optionalString('fatherEducation'),
            motherFirstName: optionalString('motherFirstName'),
            motherLastName: optionalString('motherLastName'),
            motherPhone: optionalString('motherPhone'),
            motherEducation: optionalString('motherEducation'),
            numberOfBrothers: optionalString('numberOfBrothers'),
            numberOfSisters: optionalString('numberOfSisters'),
            positionInFamily: optionalString('positionInFamily'),
            specialization: optionalString('specialization'),
            favouriteSubject: optionalString('favouriteSubject'),
            mostDifficultSubject: optionalString('mostDifficultSubject'),
            careerChoice1: optionalString('careerChoice1'),
            careerChoice2: optionalString('careerChoice2'),
            parentalConsent: Boolean(form.parentalConsent),
          };
          await saveSection.mutateAsync({ type, studentId: student.id, recordId, payload });
          break;
        }
        case 'cbc-profile': {
          const payload: CbcProfilePayload = {
            school: optionalString('school'),
            priorTechEducation: optionalString('priorTechEducation'),
            priorTechExperience: optionalString('priorTechExperience'),
            track: optionalString('track'),
            completedProgram: Boolean(form.completedProgram),
            outcomeAt6Months: optionalString('outcomeAt6Months'),
            outcomeAt12Months: optionalString('outcomeAt12Months'),
            roleTitle: optionalString('roleTitle'),
            company: optionalString('company'),
            industry: optionalString('industry'),
            techEngagementLevel: optionalString('techEngagementLevel'),
            cohort: optionalString('cohort'),
          };
          await saveSection.mutateAsync({ type, studentId: student.id, recordId, payload });
          break;
        }
        case 'ascg-participation': {
          const payload: AscgParticipationPayload = {
            schoolId: optionalString('schoolId')!,
            type: optionalString('type'),
            year: year!,
          };
          await saveSection.mutateAsync({ type, studentId: student.id, recordId, payload });
          break;
        }
        case 'cbc-participation': {
          const payload: CbcParticipationPayload = {
            track: optionalString('track'),
            trackId: optionalString('trackId'),
            cohort: optionalString('cohort'),
            year: year!,
          };
          await saveSection.mutateAsync({ type, studentId: student.id, recordId, payload });
          break;
        }
        case 'sc-participation': {
          const payload: ScParticipationPayload = {
            school: optionalString('school'),
            type: optionalString('type'),
            year: year!,
          };
          await saveSection.mutateAsync({ type, studentId: student.id, recordId, payload });
          break;
        }
      }
      onClose(true);
    } catch (err) {
      setError(
        err instanceof Error && err.message ? err.message : 'The changes could not be saved. Try again.',
      );
    }
  }

  const title = `${isEditing ? 'Edit' : 'Add'} ${editorTitles[type]}`;
  const needsSchools = fields.some((f) => f.type === 'school');

  return (
    <ModalShell title={title} onClose={() => onClose(false)}>
      <form onSubmit={submit}>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
          <p className="text-[12px] text-muted">
            Student: {student.firstName} {student.lastName}
          </p>

          {needsSchools && schools.length === 0 && (
            <Notice variant="warn" title="Schools unavailable">
              <p>The list of schools could not be loaded, so a school cannot be selected.</p>
            </Notice>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const current = String(form[field.name] ?? '');
              // A saved school that is not in the fetched list: keep it selectable so editing does not wipe it.
              const unlisted =
                field.type === 'school' &&
                current !== '' &&
                !schools.some((s) => s.id === current);

              return (
                <label
                  key={field.name}
                  className={`block ${field.type === 'checkbox' ? 'sm:col-span-2' : ''}`}
                >
                  {field.type === 'checkbox' ? (
                    <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                      <input
                        type="checkbox"
                        checked={Boolean(form[field.name])}
                        onChange={(e) => setField(field.name, e.target.checked)}
                      />
                      {field.label}
                    </span>
                  ) : field.type === 'school' ? (
                    <>
                      <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                        {field.label}
                      </span>
                      <select
                        value={current}
                        required
                        onChange={(e) => setField(field.name, e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select a school</option>
                        {unlisted && (
                          <option value={current}>Unlisted school (ID {current})</option>
                        )}
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : field.options ? (
                    <>
                      <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                        {field.label}
                      </span>
                      <select
                        value={current}
                        onChange={(e) => setField(field.name, e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Not recorded</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                        {field.label}
                      </span>
                      <input
                        type={field.type ?? 'text'}
                        value={current}
                        placeholder={field.placeholder}
                        onChange={(e) => setField(field.name, e.target.value)}
                        className={inputClass}
                      />
                    </>
                  )}
                </label>
              );
            })}
          </div>

          {error && (
            <Notice variant="err" title="Changes not saved">
              <p>{error}</p>
            </Notice>
          )}
        </div>

        <ModalFooter
          onCancel={() => onClose(false)}
          saving={saveSection.isPending}
          submitLabel={isEditing ? 'Save changes' : 'Add record'}
        />
      </form>
    </ModalShell>
  );
}

// ---- page -------------------------------------------------------------------

export function StudentPage({ studentId: explicitId }: { studentId?: string }) {
  const { studentId: pathId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const id = explicitId ?? pathId ?? '';

  const schools = useSchools();

  const [editor, setEditor] = useState<{
    type: EditorType;
    record?: ParticipationRecord;
  } | null>(null);

  const query = useQuery({
    ...queryOptionFactories.student(id),
    enabled: Boolean(id),
  });

  const eyebrow = <Eyebrow>Records · restricted to key staff</Eyebrow>;

  if (!id) {
    return (
      <>
        {eyebrow}
        <PageTitle>Student details</PageTitle>
        <Notice variant="err" title="Missing student ID">
          <p>This page needs a valid student ID in the URL.</p>
        </Notice>
      </>
    );
  }

  if (query.isLoading || schools.isLoading) {
    return (
      <>
        {eyebrow}
        <PageTitle>Student details</PageTitle>
        <div role="status" className="mt-6 flex items-center gap-3 text-muted">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-vf-blue border-t-transparent" />
          <span>Loading student record…</span>
        </div>
      </>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        {eyebrow}
        <PageTitle>Student details</PageTitle>
        <Notice variant="err" title="Student record unavailable">
          <p>
            {query.error instanceof Error && query.error.message
              ? query.error.message
              : 'The student could not be found.'}
          </p>
        </Notice>
        <button
          type="button"
          onClick={() => navigate({ pathname: '/register', search: location.search })}
          className="mt-4 rounded-[7px] border border-line-2 bg-card px-3 py-2 text-[12px] font-semibold text-ink"
        >
          ← Back to register
        </button>
      </>
    );
  }

  const student = query.data as Student;
  const schoolOptions = toSchoolOptions(schools.data);
  const consent = (student.consent ?? null) as boolean | null;
  const displayName =
    [student.firstName, student.lastName].filter(Boolean).join(' ') ||
    `Student ${student.id}`;

  const calculatedAge = student.dateOfBirth ? ageOf(student.dateOfBirth) : null;
  const hasAge = calculatedAge !== null && calculatedAge !== undefined;

  const participations = extractParticipations(student);
  const programmes = [
    ...new Set(participations.map((p) => (p.program === 'SC' ? 'STEM Camps' : p.program))),
  ];

  const personalInfo = [
    { label: 'First name', value: student.firstName },
    { label: 'Last name', value: student.lastName },
    { label: 'Date of birth', value: formatDate(student.dateOfBirth) },
    { label: 'Age', value: hasAge ? `${calculatedAge} years` : null },
    { label: 'Year joined', value: student.yearJoined },
    { label: 'Country', value: student.country },
    { label: 'Home address', value: student.address },
    { label: 'Email address', value: student.email },
    { label: 'Phone number', value: student.phone },
    { label: 'Data protection consent (NDPA)', value: consentLabel(consent) },
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
        { label: 'School', value: cbc.school },
        { label: 'Completed programme', value: cbc.completedProgram },
        { label: 'Prior technology education', value: cbc.priorTechEducation },
        { label: 'Prior technology experience', value: cbc.priorTechExperience },
        { label: 'Technology engagement level', value: cbc.techEngagementLevel },
        { label: 'Outcome at 6 months', value: cbc.outcomeAt6Months },
        { label: 'Outcome at 12 months', value: cbc.outcomeAt12Months },
        { label: 'Current role title', value: cbc.roleTitle },
        { label: 'Company or employer', value: cbc.company },
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

  function closeEditor(saved: boolean) {
    setEditor(null);
    if (saved) {
      queryClient.invalidateQueries({
        queryKey: queryOptionFactories.student(id).queryKey,
      });
    }
  }

  const programmeLabels = { ASCG: 'ASCG', CBC: 'CBC', SC: 'STEM Camps' } as const;
  const venueHeaders = { ASCG: 'School', CBC: 'School (from profile)', SC: '' } as const;

  return (
    <>
      {eyebrow}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <PageTitle>{displayName}</PageTitle>
        </div>

        <button
          type="button"
          onClick={() => navigate({ pathname: '/register', search: location.search })}
          className="rounded-[7px] border border-line-2 bg-card px-3 py-2 text-[12px] font-semibold text-ink hover:bg-paper"
        >
          ← Back to register
        </button>
      </div>

      <div className="mt-6">
        <Grid4>
          <Kpi
            label="Age"
            value={hasAge ? `${calculatedAge} yrs` : '–'}
            sub={
              student.dateOfBirth
                ? `Born ${formatDate(student.dateOfBirth)}`
                : 'Date of birth not recorded'
            }
            accent="blue"
          />
          <Kpi
            label="Programmes"
            value={fmt(programmes.length)}
            sub={programmes.join(', ') || 'No programmes recorded'}
            accent="purple"
          />
          <Kpi
            label="Enrolments"
            value={fmt(participations.length)}
            sub="Across all programmes"
            accent="green"
          />
          <Kpi
            label="Data protection consent"
            value={consentLabel(consent)}
            accent={consent === true ? 'green' : 'red'}
          />
        </Grid4>
      </div>

      <div className="mt-8 space-y-6">
        {/* Student details */}
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Heading>Student details</Heading>
            <SectionAction label="Edit details" onClick={() => openEditor('student')} />
          </div>
          <InfoTable rows={personalInfo} />
        </Card>

        {/* ASCG profile */}
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <Heading>ASCG profile</Heading>
              <p className="mt-1 text-[11px] text-muted">
                Family background, academic interests and career aspirations.
              </p>
            </div>
            <SectionAction
              label={ascg ? 'Edit profile' : 'Add profile'}
              onClick={() => openEditor('ascg-profile')}
              disabled={!SECTION_EDITING_AVAILABLE}
              title={EDITING_UNAVAILABLE_HINT}
            />
          </div>

          {ascg ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-ink">Family background</h3>
                <InfoTable rows={familyInfo} />
              </div>
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-ink">
                  Academic interests and career aspirations
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
              <Heading>CBC profile</Heading>
              <p className="mt-1 text-[11px] text-muted">
                Technology background, programme completion and later outcomes.
              </p>
            </div>
            <SectionAction
              label={cbc ? 'Edit profile' : 'Add profile'}
              onClick={() => openEditor('cbc-profile')}
              disabled={!SECTION_EDITING_AVAILABLE}
              title={EDITING_UNAVAILABLE_HINT}
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

        {/* Enrolment history */}
        <Card>
          <div className="mb-4">
            <Heading>Enrolment history</Heading>
            <p className="mt-1 text-[11px] text-muted">
              Enrolments are grouped by programme. Add or edit individual enrolments.
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
            const showVenue = program !== 'SC';

            return (
              <div key={program} className="mb-6 last:mb-0">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getProgramBadgeClass(program)}`}
                    >
                      {programmeLabels[program]}
                    </span>
                    <span className="text-[11px] text-muted">
                      {fmt(records.length)} {records.length === 1 ? 'enrolment' : 'enrolments'}
                    </span>
                  </div>

                  <SectionAction
                    label="Add enrolment"
                    onClick={() => openEditor(editorType)}
                    disabled={!SECTION_EDITING_AVAILABLE}
                    title={EDITING_UNAVAILABLE_HINT}
                  />
                </div>

                {records.length ? (
                  <TableWrap>
                    <Table>
                      <thead>
                        <tr>
                          <Th>Year</Th>
                          <Th>Details</Th>
                          {showVenue && <Th>{venueHeaders[program]}</Th>}
                          <Th>Actions</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record) => (
                          <Tr key={record.id}>
                            <Td className="font-mono text-[12px]">{record.year}</Td>
                            <Td>{record.detail}</Td>
                            {showVenue && <Td>{formatValue(record.venue)}</Td>}
                            <Td>
                              <button
                                type="button"
                                onClick={() => openEditor(editorType, record)}
                                disabled={!SECTION_EDITING_AVAILABLE}
                                title={
                                  !SECTION_EDITING_AVAILABLE
                                    ? EDITING_UNAVAILABLE_HINT
                                    : undefined
                                }
                                aria-label={`Edit ${record.year} enrolment`}
                                className="text-[12px] font-semibold text-vf-blue hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
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
                    No {programmeLabels[program]} enrolments recorded.
                  </p>
                )}
              </div>
            );
          })}
        </Card>
      </div>

      {editor?.type === 'student' && (
        <StudentInformationModal student={student} onClose={closeEditor} />
      )}

      {editor && editor.type !== 'student' && (
        <SectionFormModal
          type={editor.type}
          student={student}
          record={editor.record}
          schools={schoolOptions}
          onClose={closeEditor}
        />
      )}
    </>
  );
}
