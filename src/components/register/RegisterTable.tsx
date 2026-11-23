import { useNavigate } from 'react-router-dom';
import type { RosterRow } from '../../types/mis';
import { ageOf } from '../../lib/format';
import { Cell } from '../ui/primitives';
import { Table, TableWrap, Td, TdNum, Th, Tr } from '../ui/table';

const DISPLAY_COLS: Array<{
  k: keyof RosterRow | 'age';
  t: string;
  ro?: boolean;
  derived?: boolean;
  w?: string;
}> = [
    { k: 'firstName', t: 'First name' },
    { k: 'lastName', t: 'Last name' },
    { k: 'dateOfBirth', t: 'Date of birth' },
    { k: 'age', t: 'Age', ro: true, derived: true },
    { k: 'yearJoined', t: 'Year Joined' },
    { k: 'email', t: 'E-mail' },
    { k: 'phone', t: 'Cell' },
    { k: 'school', t: 'School' },
    { k: 'country', t: 'Country' }
  ];

export function RegisterTable({
  rows
}: {
  rows: RosterRow[];
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
           
                </Th>
              ))}
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <Cell value={r.firstName} />
                </Td>
                <Td>
                  <Cell value={r.lastName} />
                </Td>
                <Td>
                  <Cell value={r.dateOfBirth} />
                </Td>
                <TdNum>
                  <Cell value={ageOf(r.dateOfBirth)} />
                </TdNum>
                <Td>
                  <Cell value={r.yearJoined} />
                </Td>
                <Td>
                  <Cell value={r.email} />
                </Td>
                <Td>
                  <Cell value={r.phone} />
                </Td>
                <Td>
                  <Cell value={r.school} />
                </Td>
                <Td>
                  <Cell value={r.country} />
                </Td>
                <Td>
                  <button
                    type="button"
                    onClick={() => navigate(`/students/${encodeURIComponent(r.id)}`)}
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
