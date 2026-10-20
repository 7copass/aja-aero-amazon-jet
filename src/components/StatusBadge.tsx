import { cn } from "@/lib/utils";
import { toneClass, type Tone } from "@/lib/status";
import { useTr } from "@/lib/i18n";

export function StatusBadge({
  label,
  tone = "muted",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  const { tr } = useTr();
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      {tr(label)}
    </span>
  );
}
