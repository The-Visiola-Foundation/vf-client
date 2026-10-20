import { Blank, EmptyState } from '../ui/primitives';
import { Grid2, SectionHeading } from '../ui/layout';
import { Table, TableWrap, Td, Tr } from '../ui/table';
import type { SscImpactPayload } from '../../types/ssc';

function ListBlock({
  title,
  items,
  valueKey,
  secondaryKey,
}: {
  title: string;
  items: { [key: string]: string }[];
  valueKey: string;
  secondaryKey?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-card border border-line bg-card p-4">
        <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted mb-3">
          {title}
        </div>
        <EmptyState title="None recorded" className="mb-0" />
      </div>
    );
  }
  return (
    <div className="rounded-card border border-line bg-card p-4">
      <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted mb-3">
        {title}
      </div>
      <TableWrap>
        <Table>
          <tbody>
            {items.map((item) => (
              <Tr key={item[valueKey]}>
                <Td><b>{cellTextOrBlank(item[valueKey])}</b></Td>
                {secondaryKey ? (
                  <Td className="text-[12px] text-ink-2">{cellTextOrBlank(item[secondaryKey])}</Td>
                ) : null}
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}

function cellTextOrBlank(v: string | null | undefined) {
  return v === null || v === undefined || v === '' ? <Blank /> : v;
}

export function AwardsPartnersSection({ impact }: { impact: SscImpactPayload }) {
  return (
    <>
      <SectionHeading>Awards &amp; partners</SectionHeading>
      <Grid2>
        <ListBlock
          title="Awards"
          items={impact.awards.map((a) => ({ award: a.award, recipient: a.recipient }))}
          valueKey="award"
          secondaryKey="recipient"
        />
        <ListBlock
          title="Partners"
          items={impact.partners.map((p) => ({ name: p.name, contribution: p.contribution }))}
          valueKey="name"
          secondaryKey="contribution"
        />
      </Grid2>
    </>
  );
}