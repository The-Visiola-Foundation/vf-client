import { EmptyState } from '../ui/primitives';
import { SectionHeading } from '../ui/layout';
import { BarChart } from '../ui/charts';
import { fmt } from '../../lib/format';
import type { SscImpactPayload } from '../../types/ssc';

export function FeedbackThemesSection({ impact }: { impact: SscImpactPayload }) {
  const themes = impact.feedbackThemes;
  if (themes.length === 0) {
    return (
      <EmptyState title="No feedback themes recorded">
        No open-feedback themes were captured from camp participants.
      </EmptyState>
    );
  }

  const totalMentions = themes.reduce((sum, t) => sum + t.mentions, 0);

  return (
    <>
      <SectionHeading>What girls said</SectionHeading>
      <div className="mb-3 text-[12px] text-muted">
        Themes from participant feedback, ranked by how often they came up.
      </div>
      <BarChart
        rows={themes.map((t) => ({ theme: t.theme, mentions: t.mentions }))}
        labelKey="theme"
        series={[
          { k: 'mentions', label: 'Mentions', c: '#9EC83E' },
        ]}
        height={220}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {themes.map((t) => (
          <span key={t.theme} className="px-2.5 py-1 rounded-[6px] border border-line bg-card text-[12px] text-ink font-mono">
            {t.theme} <span className="text-muted">· {fmt(t.mentions)}</span>
          </span>
        ))}
        <span className="ml-2 px-2.5 py-1 rounded-[6px] border border-line-2 bg-paper text-[12px] text-muted font-mono">
          Total mentions: {fmt(totalMentions)}
        </span>
      </div>
    </>
  );
}