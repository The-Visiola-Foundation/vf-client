import { useNavigate } from 'react-router-dom';
import type { RosterRow } from '../../types/mis';
import { ageOf } from '../../lib/format';
import { Cell } from '../ui/primitives';
import { Table, TableWrap, Td, TdNum, Th, Tr } from '../ui/table';
import { EditableCell } from './EditableCell';

const DISPLAY_COLS: Array<{
  k: keyof RosterRow | 'age';
  t: string;
  ro?: boolean;
  derived?: boolean;
  w?: string;
}> = [
  { k: 'first', t: 'First name' },
  { k: 'last', t: 'Last name' },
  { k: 'dob', t: 'Date of birth' },
  { k: 'age', t: 'Age', ro: true, derived: true },
  { k: 'email', t: 'E-mail' },
  { k: 'phone', t: 'Cell' },
  { k: 'school', t: 'School' },
];

export function RegisterTable({
  rows,
  dirty,
  onCommit,
}: {
  rows: RosterRow[];
  dirty: Set<string>;
  onCommit: (uid: string, field: string, value: string | null) => void;
}) {
  const navigate = useNavigate();

  return (
    <>
      <TableWrap className="max-h-[66vh]">
        <Table>
          <thead>
            <tr>
              {DISPLAY_COLS.map((c) => (
                <Th key={c.k} style={c.w ? { minWidth: c.w } : undefined}>
                  {c.t}
                  {c.ro ? ' 🔒' : ''}
                </Th>
              ))}
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Tr key={r.uid}>
                {DISPLAY_COLS.map((c) => {
                  if (c.derived) {
                    const row = r as RosterRow & { age?: number | null };
                    return (
                      <TdNum key={c.k}>
                        <Cell value={row.age ?? ageOf(row.dob)} />
                      </TdNum>
                    );
                  }
                  if (c.ro) {
                    return (
                      <Td key={c.k}>
                        <Cell value={r[c.k as keyof RosterRow]} />
                      </Td>
                    );
                  }
                  return (
                    <EditableCell
                      key={c.k}
                      value={r[c.k as keyof RosterRow]}
                      dirty={dirty.has(`${r.uid}|${c.k}`)}
                      onCommit={(v) => onCommit(r.uid, String(c.k), v)}
                    />
                  );
                })}
                <Td>
                  <button
                    type="button"
                    onClick={() => navigate(`/students/${encodeURIComponent(r.uid)}`)}
                    className="rounded-[7px] border border-line-2 bg-card px-3 py-1.5 text-[12px] font-semibold text-ink transition hover:border-vf-blue hover:text-vf-blue"
                  >
                    View student details
                  </button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </>
  );
}
