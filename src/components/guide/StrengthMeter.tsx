"use client";

import type { StrengthLevel } from "@/guide/guide";
import { useI18n } from "@/i18n/I18nProvider";

export function StrengthMeter({ level, compact }: { level: StrengthLevel; compact?: boolean }) {
  const { t } = useI18n();
  const label = t.guide.strengths[level];
  return (
    <div className="flex items-center gap-2" role="meter" aria-label={t.guide.strengthLabel} aria-valuemin={1} aria-valuemax={4} aria-valuenow={level + 1} aria-valuetext={label}>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 rounded-full ${compact ? "w-5" : "w-7"} ${i <= level ? "bg-accent" : "bg-border"}`} />
        ))}
      </div>
      <span className="text-[13px] text-muted">{label}</span>
    </div>
  );
}
