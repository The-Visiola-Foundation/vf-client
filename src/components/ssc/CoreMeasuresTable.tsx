import { Blank, EmptyState, Pill } from '../ui/primitives';
import { SectionHeading } from '../ui/layout';
import { Table, TableWrap, Td, TdNum, Th, Tr } from '../ui/table';
import { fmt } from '../../lib/format';
import type { SscCompareRow } from '../../types/ssc';

export function CoreMeasuresTable({
  rows,
  coreLabel,
}: {
  rows: SscCompareRow[];
  coreLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState title={`No {coreLabel} comparison data recorded`}>
        No core-measure figures were captured for comparison across camps.
      </EmptyState>
    );
  }

  const anyBlank = rows.some((r) => r.average === null);

  return (
    <>
      <SectionHeading>{coreLabel}</SectionHeading>
      <div className="mb-3 text-[12px] text-muted">
        Core-measure average by camp — comparable because the same measure is
        used everywhere.
      </div>
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Camp</Th>
              <Th align="right">Average</Th>
              <Th align="right">n</Th>
              <Th align="right">Trend</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Tr key={r.coreCode}>
                <Td><b>{r.coreLabel}</b></Td>
                <TdNum align="right">
                  {r.average === null ? <Blank /> : fmt(r.average)}
                </TdNum>
                <TdNum>{fmt(r.n)}</TdNum>
                <Td>
                  <Pill variant={r.trend ?? 'flat'}>
                    {r.trend === null ? 'No data' : r.trend.charAt(0).toUpperCase() + r.trend.slice(1)}
                  </Pill>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
      {anyBlank && (
        <div className="mt-3 text-[12px] text-muted">
          Some camps have no data for this measure — hatched cells, not zero.
        </div>
      )}
    </>
  );
}