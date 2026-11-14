/**
 * Student register resource.
 *
 *   GET   /students?name=&page=&limit=
 *     -> { items: [], total, page, limit }
 *   GET   /students/:uid               -> RosterRow
 *   PATCH /students/:uid/fields/:field -> { value }
 *   POST  /students                    -> { uid? }
 *   POST  /students/export             -> CSV download
 */
import type {
  MisData,
  RegisterCellPatch,
  RegisterFilters,
  RegisterPage,
  RosterRow,
} from '../../types/mis';
import { buildRegisterEditsCsv } from '../csv';
import { registerBlankRow } from '../registerColumns';
import { API_BASE_URL, isBackendConfigured } from './config';
import { api, apiRequest } from './client';
import { getOrFallback, loadSnapshot, withParams } from './shared';

type SchoolApiItem = {
  id?: string;
  school?: string | null;
  name?: string | null;
  schoolCode?: string | null;
  category?: string | null;
  program?: string | null;
};

function normalizeSchoolNames(raw: unknown): string[] {
  const items = Array.isArray(raw) ? raw.flat(Infinity) : [];
  return items
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const school = item as SchoolApiItem;
        return school.school ?? school.name ?? school.id ?? '';
      }
      return '';
    })
    .filter(Boolean) as string[];
}

/** v0 monolith accessor — the whole snapshot until per-page splits land. */
export async function fetchDashboard(signal?: AbortSignal): Promise<MisData> {
  return getOrFallback('/stats/overview', { signal }, (s) => s);
}

export async function fetchSchools(signal?: AbortSignal): Promise<string[]> {
  if (isBackendConfigured) {
    const raw = await apiRequest<unknown>('/schools', { signal });
    return normalizeSchoolNames(raw);
  }

  return getOrFallback('/schools', { signal }, (s) => s.schools);
}

function applyRegisterFilters(
  rows: RosterRow[],
  f: RegisterFilters,
): { rows: RosterRow[]; total: number } {
  const q = (f.name ?? '').trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (f.school && r.school !== f.school) return false;
    if (f.match && r.match !== f.match) return false;
    if (f.missing_consent && r.consent) return false;
    if (q) {
      const hay = `${r.uid} ${r.last ?? ''} ${r.first ?? ''} ${r.school ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  return { rows: filtered, total: filtered.length };
}

type StudentApiRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  age: number | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  school: string | null;
};

type StudentPageApiResponse = {
  items?: StudentApiRow[];
  data?: StudentApiRow[];
  total?: number;
  page?: number;
  limit?: number;
  page_size?: number;
  totalPages?: number;
};

function normalizeStudentApiRow(row: StudentApiRow & Record<string, unknown>): RosterRow {
  const ascg = row.ascgProfile as Record<string, unknown> | null;
  const cbc = row.cbcProfile as Record<string, unknown> | null;

  const fatherName =
    (row.father as string | null) ??
    (ascg?.fatherFirstName || ascg?.fatherLastName
      ? [ascg.fatherFirstName, ascg.fatherLastName].filter(Boolean).join(' ')
      : null);

  const motherName =
    (row.mother as string | null) ??
    (ascg?.motherFirstName || ascg?.motherLastName
      ? [ascg.motherFirstName, ascg.motherLastName].filter(Boolean).join(' ')
      : null);

  const schoolName =
    row.school ??
    (cbc?.school as string | null) ??
    (ascg?.school as string | null) ??
    null;

  return {
    ...row,
    uid: row.id ?? (row.uid as string),
    legacy: (row.legacy as string | null) ?? null,
    match: (row.match as string) ?? 'unmatched',
    dobFlag: Boolean(row.dobFlag),
    first: row.firstName ?? (row.first as string | null) ?? null,
    last: row.lastName ?? (row.last as string | null) ?? null,
    dob: row.dateOfBirth ?? (row.dob as string | null) ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    school: schoolName,
    country: row.country ?? null,
    father: fatherName,
    fatherPhone: (row.fatherPhone as string | null) ?? (ascg?.fatherPhone as string | null) ?? null,
    fatherEdu: (row.fatherEdu as string | null) ?? (ascg?.fatherEducation as string | null) ?? null,
    mother: motherName,
    motherPhone: (row.motherPhone as string | null) ?? (ascg?.motherPhone as string | null) ?? null,
    motherEdu: (row.motherEdu as string | null) ?? (ascg?.motherEducation as string | null) ?? null,
    bro: (row.bro as string | null) ?? (ascg?.numberOfBrothers as string | null) ?? null,
    sis: (row.sis as string | null) ?? (ascg?.numberOfSisters as string | null) ?? null,
    fav: (row.fav as string | null) ?? (ascg?.favouriteSubject as string | null) ?? null,
    diff: (row.diff as string | null) ?? (ascg?.mostDifficultSubject as string | null) ?? null,
    car1: (row.car1 as string | null) ?? (ascg?.careerChoice1 as string | null) ?? null,
    car2: (row.car2 as string | null) ?? (ascg?.careerChoice2 as string | null) ?? null,
    consent: row.consent !== undefined ? Boolean(row.consent) : null,
  };
}

export async function fetchRegisterPage(
  filters: RegisterFilters = {},
  signal?: AbortSignal,
): Promise<RegisterPage> {
  const { page = 1, limit, name } = filters;
  const requestPage = Number(page) || 1;
  const requestLimit = Number(limit ?? 20) || 20;
  const requestName = (name ?? '').trim();

  const requestParams = {
    name: requestName || undefined,
    page: requestPage,
    limit: requestLimit,
  };

  if (isBackendConfigured) {
    const payload = await apiRequest<StudentPageApiResponse>(withParams('/students', requestParams), {
      signal,
    });

    const response = (payload && typeof payload === 'object' && ('items' in payload || 'data' in payload)
      ? payload
      : {
          data: Array.isArray(payload) ? payload : [],
          total: 0,
          page: requestPage,
          limit: requestLimit,
        }) as StudentPageApiResponse;

    const sourceRows = Array.isArray(response.data) ? response.data : Array.isArray(response.items) ? response.items : [];
    const rows = sourceRows.map(normalizeStudentApiRow);

    const total = Number(response.total ?? rows.length);
    const pageNumber = Number(response.page ?? requestPage);
    const pageLimit = Number(response.limit ?? response.page_size ?? requestLimit);
    const totalPages = Number(response.totalPages ?? Math.max(1, Math.ceil(total / (pageLimit || 1))));
    const filtered = applyRegisterFilters(rows, filters);
    const start = (pageNumber - 1) * pageLimit;

    return {
      items: filtered.rows.slice(start, start + pageLimit),
      total: filtered.total ?? total,
      page: pageNumber,
      page_size: pageLimit,
      limit: pageLimit,
      totalPages,
    };
  }

  return getOrFallback(withParams('/students', requestParams), { signal }, (s) => {
    const { rows, total } = applyRegisterFilters(s.roster, filters);
    const start = (requestPage - 1) * requestLimit;
    const totalPages = Math.max(1, Math.ceil(total / requestLimit));
    return {
      items: rows.slice(start, start + requestLimit),
      total,
      page: requestPage,
      page_size: requestLimit,
      limit: requestLimit,
      totalPages,
    };
  });
}

export async function fetchStudent(uid: string, signal?: AbortSignal): Promise<RosterRow> {
  const path = `/students/${encodeURIComponent(uid)}`;

  if (isBackendConfigured) {
    const row = await api.get<StudentApiRow | RosterRow | null>(path, { signal });
    if (!row) throw new Error(`Student ${uid} not found.`);

    if ('uid' in row && typeof row.uid === 'string') {
      return row as RosterRow;
    }

    return normalizeStudentApiRow(row as StudentApiRow);
  }

  return getOrFallback(path, { signal }, (s) => {
    const row = s.roster.find((r: RosterRow) => r.uid === uid);
    if (!row) throw new Error(`Student ${uid} not found in the loaded snapshot`);
    return row;
  });
}

export interface UpdateStudentPayload {
  firstName?: string | null;
  lastName?: string | null;
  first?: string | null;
  last?: string | null;
  dateOfBirth?: string | null;
  dob?: string | null;
  email?: string | null;
  phone?: string | null;
  school?: string | null;
  country?: string | null;
  address?: string | null;
  father?: string | null;
  fatherPhone?: string | null;
  fatherEdu?: string | null;
  mother?: string | null;
  motherPhone?: string | null;
  motherEdu?: string | null;
  sis?: string | null;
  bro?: string | null;
  consent?: boolean | null;
  fav?: string | null;
  diff?: string | null;
  car1?: string | null;
  car2?: string | null;
  [key: string]: unknown;
}

/** Update student details via PATCH /students/:id */
export async function updateStudent(
  id: string,
  payload: UpdateStudentPayload,
): Promise<RosterRow> {
  const path = `/students/${encodeURIComponent(id)}`;

  if (isBackendConfigured) {
    const body: Record<string, unknown> = {
      ...payload,
      firstName: payload.firstName ?? payload.first,
      lastName: payload.lastName ?? payload.last,
      dateOfBirth: payload.dateOfBirth ?? payload.dob,
    };
    const row = await api.patch<StudentApiRow | RosterRow>(path, body);
    if ('uid' in row && typeof row.uid === 'string') {
      return row as RosterRow;
    }
    return normalizeStudentApiRow(row as StudentApiRow);
  }

  // UI-only fallback
  const s = await loadSnapshot();
  const existing = s.roster.find((r) => r.uid === id);
  const updated: RosterRow = {
    ...(existing ?? { uid: id }),
    ...payload,
    first: payload.firstName ?? payload.first ?? existing?.first,
    last: payload.lastName ?? payload.last ?? existing?.last,
    dob: payload.dateOfBirth ?? payload.dob ?? existing?.dob,
    uid: id,
  };
  return updated;
}

/** PATCH one editable register cell. No-op in UI-only mode. */
export async function saveRegisterCell(patch: RegisterCellPatch): Promise<void> {
  if (!isBackendConfigured) return;
  await apiRequest<void>(
    `/students/${encodeURIComponent(patch.uid)}/fields/${encodeURIComponent(patch.field)}`,
    { method: 'PATCH', body: JSON.stringify({ value: patch.value }) },
  );
}

export interface CreatedStudent {
  uid?: string;
}

/** POST a new blank student row. Returns the created uid when supplied. */
export async function createRegisterStudent(): Promise<CreatedStudent | void> {
  if (!isBackendConfigured) return;
  return apiRequest<CreatedStudent>('/students', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Export session edits as CSV. UI-only: build locally from the snapshot
 * rows. Backend: POST the edits and download the returned file.
 */
export async function exportRegisterEdits(
  edits: RegisterCellPatch[],
  localRows: RosterRow[],
): Promise<Blob> {
  if (!isBackendConfigured) {
    const csv = buildRegisterEditsCsv(localRows, edits);
    if (!csv) throw new Error('No edits to export yet. Change a cell first.');
    return new Blob([csv], {
      type: 'text/csv;charset=utf-8',
    });
  }
  const res = await fetch(`${API_BASE_URL}/students/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ edits }),
  });
  if (!res.ok) throw new Error(`Export failed (HTTP ${res.status})`);
  return await res.blob();
}

/** Local blank row for the optimistic "Add student" insert. */
export function blankRegisterRow(uid: string): RosterRow {
  return registerBlankRow(uid);
}
