import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Eyebrow, Lede, PageTitle, SectionHeading } from '../components/ui/layout';
import { Blank, Notice } from '../components/ui/primitives';
import { Table, TableWrap, Td, Th, Tr } from '../components/ui/table';
import { ageOf } from '../lib/format';
import { fetchStudent } from '../lib/api/register';
import { queryKeys } from '../queries/keys';

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return <Blank />;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return <>{String(value)}</>;
}

export function StudentPage({ studentId: explicitId }: { studentId?: string }) {
  const { studentId: pathId } = useParams();
  const navigate = useNavigate();
  const id = explicitId ?? pathId ?? '';

  const query = useQuery({
    queryKey: queryKeys.student(id),
    queryFn: ({ signal }) => fetchStudent(id, signal),
    enabled: Boolean(id),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
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
        <Lede>Loading the student record…</Lede>
      </>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        <Eyebrow>Records · student profile</Eyebrow>
        <PageTitle>Student details</PageTitle>
        <Notice variant="err" title="Unable to load the student record">
          <p>{query.error instanceof Error ? query.error.message : 'The student could not be found.'}</p>
        </Notice>
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="rounded-[7px] border border-line-2 bg-card px-3 py-2 text-[12.5px] font-semibold"
        >
          Back to register
        </button>
      </>
    );
  }

  const student = query.data as Record<string, unknown> & { uid?: string };
  const first = (student.first ?? student.firstName ?? '') as string | null;
  const last = (student.last ?? student.lastName ?? '') as string | null;
  const dob = student.dob ?? student.dateOfBirth ?? null;
  const displayName = [first, last].filter(Boolean).join(' ') || `Student ${student.uid ?? id}`;

  console.log(query.data);

  const details = [
    { label: 'Student ID', value: student.uid ?? id },
    { label: 'First name', value: first },
    { label: 'Last name', value: last },
    { label: 'Date of birth', value: dob },
    { label: 'Age', value: student.age ?? (typeof dob === 'string' ? ageOf(dob) : null) },
    { label: 'Email', value: student.email },
    { label: 'Phone', value: student.phone },
    { label: 'School', value: student.school },
    { label: 'Match status', value: student.match },
  ];

  return (
    <>
      <Eyebrow>Records · student profile</Eyebrow>
      <PageTitle>{displayName}</PageTitle>
   

      <div className="mb-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="rounded-[7px] border border-line-2 bg-card px-3 py-2 text-[12.5px] font-semibold"
        >
          Back to register
        </button>
      </div>

      <SectionHeading>Student profile</SectionHeading>
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Field</Th>
              <Th>Value</Th>
            </tr>
          </thead>
          <tbody>
            {details.map((row) => (
              <Tr key={row.label}>
                <Td><strong>{row.label}</strong></Td>
                <Td>{formatValue(row.value)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </>
  );
}
