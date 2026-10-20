import { Blank, EmptyState } from '../ui/primitives';
import { SectionHeading } from '../ui/layout';
import { Table, TableWrap, Td, TdNum, Th, Tr } from '../ui/table';
import { fmtCurrency } from '../../lib/format';
import type { SscImpactPayload } from '../../types/ssc';

export function ExpensesSection({ impact }: { impact: SscImpactPayload }) {
  const expenses = impact.expenses;
  if (expenses.length === 0) {
    return (
      <EmptyState title="No expense lines recorded">
        No expenditure was captured for this camp.
      </EmptyState>
    );
  }

  const total = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const hasAmounts = expenses.some((e) => e.amount !== null);

  return (
    <>
      <SectionHeading>Camp expenditure</SectionHeading>
      <div className="mb-3 text-[12px] text-muted">
        Spend by line, in {impact.currency ?? 'the camp currency'}.
      </div>
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Item</Th>
              <Th align="right">Amount</Th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <Tr key={e.item}>
                <Td>{e.item}</Td>
                <TdNum align="right">
                  {e.amount === null ? <Blank /> : fmtCurrency(e.amount, impact.currency)}
                </TdNum>
              </Tr>
            ))}
            <Tr>
              <Td><b>Total</b></Td>
              <TdNum align="right">
                {hasAmounts ? fmtCurrency(total, impact.currency) : <Blank />}
              </TdNum>
            </Tr>
          </tbody>
        </Table>
      </TableWrap>
      {!hasAmounts && (
        <div className="mt-3 text-[12px] text-muted">
          Amounts were not captured for any line — totals appear hatched, not
          zero.
        </div>
      )}
    </>
  );
}