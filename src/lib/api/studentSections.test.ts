import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './client';
import { saveStudentSection, type StudentSectionSaveInput } from './studentSections';

const cases: Array<{
  label: string;
  path: string;
  input: StudentSectionSaveInput;
}> = [
  {
    label: 'ASCG profile',
    path: '/ascg-profile',
    input: { type: 'ascg-profile', studentId: 'student-1', payload: { year: 2024 } },
  },
  {
    label: 'CBC profile',
    path: '/cbc-profile',
    input: { type: 'cbc-profile', studentId: 'student-1', payload: { cohort: 'one' } },
  },
  {
    label: 'ASCG enrolment',
    path: '/ascg-participation',
    input: {
      type: 'ascg-participation',
      studentId: 'student-1',
      payload: { schoolId: 'school-1', year: 2024 },
    },
  },
  {
    label: 'CBC enrolment',
    path: '/cbc-participation',
    input: { type: 'cbc-participation', studentId: 'student-1', payload: { year: 2024 } },
  },
  {
    label: 'STEM Camp enrolment',
    path: '/sc-participation',
    input: { type: 'sc-participation', studentId: 'student-1', payload: { year: 2024 } },
  },
];

describe('student section write endpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each(cases)('creates a $label with its student ID', async ({ path, input }) => {
    const post = vi.spyOn(api, 'post').mockResolvedValueOnce({});

    await saveStudentSection(input);

    expect(post).toHaveBeenCalledWith(path, {
      studentId: 'student-1',
      ...input.payload,
    });
  });

  it.each(cases)('updates a $label without its immutable student ID', async ({ path, input }) => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValueOnce({});

    await saveStudentSection({ ...input, recordId: 42 } as StudentSectionSaveInput);

    expect(patch).toHaveBeenCalledWith(`${path}/42`, input.payload);
  });
});
