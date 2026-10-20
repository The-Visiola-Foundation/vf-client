import { Blank, EmptyState, Pill } from '../ui/primitives';
import { BarChart } from '../ui/charts';
import { SectionHeading } from '../ui/layout';
import { Table, TableWrap, Td, TdNum, Th, Tr } from '../ui/table';
import { fmt, pct } from '../../lib/format';
import type { SscImpactPayload } from '../../types/ssc';

export function SelfEfficacySection({ impact }: { impact: SscImpactPayload }) {
  const rows = impact.selfEfficacy;
  if (rows.length === 0) {
    return (
      <EmptyState title="No self-efficacy data recorded">
        The self-efficacy survey was not run for this camp, or no responses
        were captured.
      </EmptyState>
    );
  }

  const anyBlank = rows.some((r) => r.agreePct === null);

  return (
    <>
      <SectionHeading>Self-efficacy</SectionHeading>
      <div className="mb-3 text-[12px] text-muted">
        Share of participants who agreed with each statement, after camp.
      </div>
      <BarChart
        rows={rows.map((r) => ({ statement: r.statement, agreePct: r.agreePct ?? 0, n: r.n }))}
        labelKey="statement"
        series={[
          { k: 'agreePct', label: 'Agree (%)', c: '#00A3DA' },
          { k: 'n', label: 'Responses (n)', c: '#958EB8' },
        ]}
        height={260}
      />
      <TableWrap className="mt-5">
        <Table>
          <thead>
            <tr>
              <Th>Statement</Th>
              <Th align="right">Agree (%)</Th>
              <Th align="right">n</Th>
              <Th align="right">Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Tr key={r.statement}>
                <Td>{r.statement}</Td>
                <TdNum align="right">
                  {r.agreePct === null ? <Blank /> : pct(r.agreePct)}
                </TdNum>
                <TdNum>{fmt(r.n)}</TdNum>
                <Td>
                  <Pill
                    variant={
                      r.agreePct === null
                        ? 'flat'
                        : r.agreePct >= 70
                        ? 'up'
                        : 'flat'
                    }
                  >
                    {r.agreePct === null ? 'No data' : r.agreePct >= 70 ? 'Strong' : 'Moderate'}
                  </Pill>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
      {anyBlank && (
        <div className="mt-3 text-[12px] text-muted">
          Some statements have no data recorded — they appear as hatched cells,
          not zero.
        </div>
      )}
    </>
  );
}