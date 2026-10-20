import { Blank, EmptyState } from '../ui/primitives';
import { Card } from '../ui/primitives';
import { SectionHeading } from '../ui/layout';
import { BarChart } from '../ui/charts';
import { Table, TableWrap, Td, TdNum, Th, Tr } from '../ui/table';
import { fmt } from '../../lib/format';
import type { SscImpactPayload } from '../../types/ssc';

export function AssessmentSection({ impact }: { impact: SscImpactPayload }) {
  const { preAverage, postAverage, matchedN } = impact.assessment;
  const hasData = preAverage !== null || postAverage !== null;

  if (!hasData) {
    return (
      <EmptyState title="No assessment data recorded">
        The knowledge assessment was not run for this camp, or no scores were
        captured.
      </EmptyState>
    );
  }

  const gain =
    preAverage !== null && postAverage !== null
      ? postAverage - preAverage
      : null;

  return (
    <>
      <SectionHeading>Knowledge assessment</SectionHeading>
      <div className="mb-3 text-[12px] text-muted">
        Average score on the camp's knowledge scale, before and after camp.
      </div>
      <Card>
        <BarChart
          rows={[
            { stage: 'Pre-camp', score: preAverage ?? 0, n: matchedN },
            { stage: 'Post-camp', score: postAverage ?? 0, n: matchedN },
          ]}
          labelKey="stage"
          series={[
            { k: 'score', label: 'Average score', c: '#00A3DA' },
          ]}
          height={210}
        />
      </Card>
      <TableWrap className="mt-4">
        <Table>
          <thead>
            <tr>
              <Th>Measure</Th>
              <Th align="right">Score</Th>
              <Th align="right">Matched n</Th>
            </tr>
          </thead>
          <tbody>
            <Tr>
              <Td>Pre-camp average</Td>
              <TdNum>{preAverage === null ? <Blank /> : fmt(preAverage)}</TdNum>
              <TdNum>{fmt(matchedN)}</TdNum>
            </Tr>
            <Tr>
              <Td>Post-camp average</Td>
              <TdNum>{postAverage === null ? <Blank /> : fmt(postAverage)}</TdNum>
              <TdNum>{fmt(matchedN)}</TdNum>
            </Tr>
            <Tr>
              <Td>Gain</Td>
              <TdNum>
                {gain === null ? <Blank /> : `${gain >= 0 ? '+' : ''}${gain.toFixed(1)}`}
              </TdNum>
              <TdNum>{fmt(matchedN)}</TdNum>
            </Tr>
          </tbody>
        </Table>
      </TableWrap>
    </>
  );
}