import { useLocation, useNavigate } from 'react-router-dom';
import type { RosterRow } from '../../types/mis';
import { ageOf } from '../../lib/format';
import { Cell } from '../ui/primitives';
import { Table, TableWrap, Td, TdNum, Th, Tr } from '../ui/table';
import { CircleCheckBig} from 'lucide-react'

const DISPLAY_COLS: Array<{
  k: keyof RosterRow | 'age';
  t: string;
  ro?: boolean;
  derived?: boolean;
  w?: string;
}> = [
    { k: 'firstName', t: 'Student Name' },
    // { k: 'lastName', t: 'Last name' },
    { k: 'dateOfBirth', t: 'Date of birth' },
    { k: 'age', t: 'Age', ro: true, derived: true },
    { k: 'yearJoined', t: 'Year Joined' },
    // { k: 'email', t: 'E-mail' },
    // { k: 'phone', t: 'Cell' },
    { k: 'school', t: 'School' },
    { k: 'country', t: 'Country' }
  ];

export function RegisterTable({
  rows
}: {
  rows: RosterRow[];
}) {
  const navigate = useNavigate();
  const location = useLocation();

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
                <Td className='flex items-center gap-2'>
                  <Cell value={r.firstName+" "+r.lastName} />
                  {r.parentalConsent ? 
                  <CircleCheckBig size={16} color="green" scale={2} />
                : undefined}
                </Td>
                {/* <Td>
                  <Cell value={r.lastName} />
                </Td> */}
                <Td>
                  <Cell value={r.dateOfBirth} />
                </Td>
                <TdNum>
                  <Cell value={ageOf(r.dateOfBirth)} />
                </TdNum>
                <Td>
                  <Cell value={r.yearJoined} />
                </Td>
                {/* <Td>
                  <Cell value={r.email} />
                </Td>
                <Td>
                  <Cell value={r.phone} />
                </Td> */}
                <Td>
                  <Cell value={r.school} />
                </Td>
                <Td>
                  <Cell value={r.country} />
                </Td>
                <Td>
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        pathname: `/students/${encodeURIComponent(r.id)}`,
                        search: location.search,
                      })
                    }
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
