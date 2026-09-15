import { STRENGTH_LABELS, type StrengthLevel } from "@/guide/guide";

export function StrengthMeter({ level, compact }: { level: StrengthLevel; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2" role="meter" aria-label="手の強さ" aria-valuemin={1} aria-valuemax={4} aria-valuenow={level + 1} aria-valuetext={STRENGTH_LABELS[level]}>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 rounded-full ${compact ? "w-5" : "w-7"} ${i <= level ? "bg-accent" : "bg-border"}`} />
        ))}
      </div>
      <span className="text-[13px] text-muted">{STRENGTH_LABELS[level]}</span>
    </div>
  );
}
