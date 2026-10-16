import type { ReactNode } from 'react';

interface SectionHeaderProps {
  badge?: string;
  heading: string;
  highlight?: string;
  subheading?: string;
  centered?: boolean;
  light?: boolean;
}

export default function SectionHeader({
  badge,
  heading,
  highlight,
  subheading,
  centered = false,
  light = false,
}: SectionHeaderProps) {
  const textClass = light ? 'text-white' : 'text-[#0D1B3E]';
  const subClass = light ? 'text-[#AAC0E1]/80' : 'text-[#4A5568]';
  const badgeClass = light
    ? 'bg-white/10 text-white/80 border-white/20'
    : 'bg-[rgba(14,47,118,0.07)] text-[#0E2F76] border-[rgba(14,47,118,0.12)]';

  // Split heading and inject highlight
  let headingNode: ReactNode = heading;
  if (highlight && heading.includes(highlight)) {
    const parts = heading.split(highlight);
    headingNode = (
      <>
        {parts[0]}
        <span className="text-[#0E2F76]" style={light ? { color: '#AAC0E1' } : {}}>{highlight}</span>
        {parts[1]}
      </>
    );
  }

  return (
    <div className={centered ? 'text-center' : ''}>
      {badge && (
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest border mb-5 ${badgeClass}`}>
          {badge}
        </div>
      )}
      <h2 className={`font-bold text-balance leading-tight mb-4 ${textClass}`}>
        {headingNode}
      </h2>
      {subheading && (
        <p className={`text-base leading-relaxed max-w-2xl ${subClass} ${centered ? 'mx-auto' : ''}`}>
          {subheading}
        </p>
      )}
    </div>
  );
}
