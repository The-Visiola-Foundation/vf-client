import { Blank, EmptyState } from '../ui/primitives';
import { SectionHeading } from '../ui/layout';
import { Table, TableWrap, Td, Th, Tr } from '../ui/table';
import { cellText } from '../../lib/format';
import type { SscImpactPayload } from '../../types/ssc';

export function ProjectsSection({ impact }: { impact: SscImpactPayload }) {
  const projects = impact.projects;
  if (projects.length === 0) {
    return (
      <EmptyState title="No projects recorded">
        No student-led projects were captured for this camp.
      </EmptyState>
    );
  }

  return (
    <>
      <SectionHeading>Student projects</SectionHeading>
      <div className="mb-3 text-[12px] text-muted">
        Projects designed and delivered by camp participants.
      </div>
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Project</Th>
              <Th>Description</Th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <Tr key={p.title}>
                <Td><b>{p.title}</b></Td>
                <Td>
                  {p.description ? cellText(p.description) : <Blank />}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </>
  );
}