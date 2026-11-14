import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CbcGraduate,
  CbcGraduatePatch,
  CbcOutcome,
  MisData,
  NewCbcGraduate,
  NewCbcOutcome,
  RegisterFilters,
  RegisterPage,
  RosterRow,
} from '../types/mis';
import { registerBlankRow } from '../lib/registerColumns';
import {
  createCbcGraduate,
  createCbcOutcome,
  createRegisterStudent,
  exportRegisterEdits,
  isBackendConfigured,
  patchCbcGraduate,
  resolveQualityIssue,
  saveRegisterCell,
  updateStudent,
  type UpdateStudentPayload,
} from '../lib/api';
import { queryKeys } from './keys';
import { queryOptionFactories } from './options';

export interface CellEdit {
  uid: string;
  key: string;
  value: string | null;
}

/** School names for the register filter dropdown. */
export function useSchools() {
  return useQuery(queryOptionFactories.schools());
}

/**
 * One paginated register page.
 */
export function useRegisterPage(filters: RegisterFilters = {}) {
  return useQuery(queryOptionFactories.registerPage(filters));
}

/**
 * Download the session's register edits as CSV. UI-only: built locally;
 * backend: POSTed to /students/export and downloaded from the response.
 */
export function useExportRegisterEdits() {
  return useMutation({
    mutationFn: async (vars: {
      edits: Array<{ uid: string; field: string; value: string | null }>;
      localRows: MisData['roster'];
    }) => {
      const blob = await exportRegisterEdits(vars.edits, vars.localRows);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vf_register_edits.csv';
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

/** CBC: create a graduate record, then refresh graduate lists. */
export function useCreateCbcGraduate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCbcGraduate) => createCbcGraduate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cbcGraduates() });
      qc.invalidateQueries({ queryKey: queryKeys.cbcSummary });
    },
  });
}

/** CBC: patch a graduate record, then refresh graduate lists. */
export function usePatchCbcGraduate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: CbcGraduatePatch }) =>
      patchCbcGraduate(vars.id, vars.patch),
    onSuccess: (_data: CbcGraduate) => {
      qc.invalidateQueries({ queryKey: queryKeys.cbcGraduates() });
      qc.invalidateQueries({ queryKey: queryKeys.cbcSummary });
    },
  });
}

/** CBC: record an outcome, then refresh outcomes + summary. */
export function useCreateCbcOutcome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCbcOutcome) => createCbcOutcome(input),
    onSuccess: (_data: CbcOutcome) => {
      qc.invalidateQueries({ queryKey: queryKeys.cbcOutcomes() });
      qc.invalidateQueries({ queryKey: queryKeys.cbcSummary });
    },
  });
}

/** Quality: mark an issue resolved, then refresh issue lists + summary. */
export function useResolveQualityIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resolveQualityIssue(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.qualityIssues() });
      qc.invalidateQueries({ queryKey: queryKeys.qualitySummary });
    },
  });
}

/** The set of `uid|field` pairs edited in this session. */
export function useRegisterEdits() {
  return useQuery<string[]>({
    queryKey: queryKeys.registerEdits,
    queryFn: () => [],
    initialData: [],
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Commits a single edited cell. The cache is updated optimistically so the UI
 * is instant; when a backend is configured the write is sent and rolled back
 * if it fails.
 */
export function useSaveCell() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (edit: CellEdit) =>
      saveRegisterCell({ uid: edit.uid, field: edit.key, value: edit.value }),
    onMutate: (edit: CellEdit) => {
      // 1. Optimistically update paginated register pages in cache
      qc.setQueriesData<RegisterPage>({ queryKey: ['mis', 'students'] }, (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((row) =>
            row.uid === edit.uid ? ({ ...row, [edit.key]: edit.value } as RosterRow) : row,
          ),
        };
      });

      // 2. Optimistically update individual student cache if loaded
      qc.setQueryData<RosterRow>(queryKeys.student(edit.uid), (old) => {
        if (!old) return old;
        return { ...old, [edit.key]: edit.value } as RosterRow;
      });

      // 3. Record dirty cell edit
      qc.setQueryData<string[]>(queryKeys.registerEdits, (old = []) => {
        const k = `${edit.uid}|${edit.key}`;
        return old.includes(k) ? old : [...old, k];
      });

      // 4. Update legacy dashboard if present
      const previous = qc.getQueryData<MisData>(queryKeys.dashboard);
      if (previous) {
        qc.setQueryData<MisData>(queryKeys.dashboard, {
          ...previous,
          roster: previous.roster.map((r) =>
            r.uid === edit.uid ? { ...r, [edit.key]: edit.value } : r,
          ),
        });
      }

      return { previous };
    },
    onError: (_error, edit, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.dashboard, context.previous);
      }
      qc.invalidateQueries({ queryKey: ['mis', 'students'] });
      qc.invalidateQueries({ queryKey: queryKeys.student(edit.uid) });
    },
    onSuccess: (_data, edit) => {
      if (isBackendConfigured) {
        qc.invalidateQueries({ queryKey: ['mis', 'students'] });
        qc.invalidateQueries({ queryKey: queryKeys.student(edit.uid) });
        qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      }
    },
  });
}

/** Prepends a fresh blank student row or triggers creation on backend. */
export function useAddStudent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => createRegisterStudent(),
    onMutate: () => {
      const previous = qc.getQueryData<MisData>(queryKeys.dashboard);
      if (previous) {
        const n = previous.roster.filter((r) => r.uid.startsWith('VF-NEW')).length + 1;
        const row = registerBlankRow(`VF-NEW-${String(n).padStart(4, '0')}`);
        qc.setQueryData<MisData>(queryKeys.dashboard, {
          ...previous,
          roster: [row, ...previous.roster],
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.dashboard, context.previous);
      }
      qc.invalidateQueries({ queryKey: ['mis', 'students'] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mis', 'students'] });
      qc.invalidateQueries({ queryKey: queryKeys.overview });
      if (isBackendConfigured) {
        qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      }
    },
  });
}

/** Updates student details and synchronizes cache. */
export function useUpdateStudent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; payload: UpdateStudentPayload }) =>
      updateStudent(vars.id, vars.payload),
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: queryKeys.student(id) });
      const previous = qc.getQueryData<RosterRow>(queryKeys.student(id));

      if (previous) {
        qc.setQueryData<RosterRow>(queryKeys.student(id), {
          ...previous,
          ...payload,
          first: payload.firstName ?? payload.first ?? previous.first,
          last: payload.lastName ?? payload.last ?? previous.last,
          dob: payload.dateOfBirth ?? payload.dob ?? previous.dob,
        });
      }

      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.student(id), context.previous);
      }
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.student(id) });
      qc.invalidateQueries({ queryKey: ['mis', 'students'] });
    },
  });
}

