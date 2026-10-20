import { cn } from "@/lib/utils";
import { useTr } from "@/lib/i18n";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "navy",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "navy" | "gold" | "success" | "aog" | "warning";
}) {
  const { tr } = useTr();
  const tones: Record<string, string> = {
    navy: "bg-primary/10 text-primary",
    gold: "bg-gold/15 text-gold-foreground",
    success: "bg-success/12 text-success",
    aog: "bg-aog/12 text-aog",
    warning: "bg-warning/20 text-warning-foreground",
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr(label)}</p>
        {Icon && (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", tones[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2.5 font-display text-[1.65rem] font-bold leading-none tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
