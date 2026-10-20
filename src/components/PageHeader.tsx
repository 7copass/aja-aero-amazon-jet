import type { ReactNode } from "react";
import { useTr } from "@/lib/i18n";

export function PageHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const { tr } = useTr();
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-navy text-primary-foreground shadow-card">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{tr(title)}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{tr(subtitle)}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
