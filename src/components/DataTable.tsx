import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTr } from "@/lib/i18n";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  rows,
  columns,
  searchKeys,
  onRowClick,
  loading,
  empty = "Nenhum registro encontrado.",
  toolbar,
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys?: string[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  empty?: string;
  toolbar?: ReactNode;
}) {
  const { tr } = useTr();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim() || !searchKeys) return rows;
    const term = q.toLowerCase();
    return rows.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(term)),
    );
  }, [rows, q, searchKeys]);

  return (
    <div className="rounded-xl border bg-card shadow-card">
      {(searchKeys || toolbar) && (
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
          {searchKeys ? (
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Buscar...")} className="pl-9" />
            </div>
          ) : <div />}
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              {columns.map((c) => (
                <th key={c.key} className={"px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground " + (c.className ?? "")}>
                  {tr(c.header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">{tr("Carregando...")}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">{tr(empty)}</td></tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  onClick={() => onRowClick?.(row)}
                  className={"border-b last:border-0 transition-colors hover:bg-muted/40 " + (onRowClick ? "cursor-pointer" : "")}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={"px-4 py-3 align-middle " + (c.className ?? "")}>
                      {c.render ? c.render(row) : (row[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
