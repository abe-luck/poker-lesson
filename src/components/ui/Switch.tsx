"use client";

type Props = { checked: boolean; onChange: (value: boolean) => void; label: string };

/** ラベルは見た目では横に置き、ここでは読み上げ用に受け取る */
export function Switch({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[26px] w-11 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${checked ? "bg-accent" : "bg-[#d5d8dc]"}`}
    >
      <span className={`absolute top-[3px] size-5 rounded-full bg-white transition-all ${checked ? "left-[21px]" : "left-[3px]"}`} />
    </button>
  );
}
