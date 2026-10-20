import { useMemo, useState, type ReactNode } from "react";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor,
  useSensor, useSensors, useDraggable, useDroppable,
  closestCorners, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clock } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { quoteStatus, quoteColumns } from "@/lib/status";
import { money, hoursSince } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTr } from "@/lib/i18n";

const CLOSED = ["aprovado", "perdido", "cancelado"];

/** Transições curtas e discretas — nada de salto ou elástico exagerado. */
const spring = { type: "spring" as const, stiffness: 520, damping: 42, mass: 0.6 };
const soft = { duration: 0.16, ease: [0.22, 0.61, 0.36, 1] as const };

function QuoteCardFace({ quote, dragging }: { quote: any; dragging?: boolean }) {
  const custName: string = quote.__customerName ?? "—";
  const stale = !CLOSED.includes(quote.status) && hoursSince(quote.last_followup) > 24;
  return (
    <div
      className={cn(
        "w-full rounded-xl border bg-card p-3 text-left shadow-soft",
        quote.is_aog && "border-aog/40 ring-1 ring-aog/20",
        dragging && "shadow-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-foreground">{quote.internal_number}</span>
        {quote.is_aog && <StatusBadge label="AOG" tone="aog" />}
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{custName}</p>
      <p className="text-xs text-muted-foreground">{quote.aircraft ?? "—"}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{money(quote.final_price)}</span>
        <span className="text-xs text-muted-foreground">{Number(quote.real_margin ?? 0).toFixed(0)}%</span>
      </div>
      {stale && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-warning-foreground">
          <Clock className="h-3 w-3" /> Follow-up &gt; 24h
        </p>
      )}
    </div>
  );
}

function DraggableCard({
  quote, onOpen, reduced,
}: { quote: any; onOpen: (q: any) => void; reduced: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: quote.id });

  return (
    <motion.div
      ref={setNodeRef}
      layout={!reduced}
      layoutId={reduced ? undefined : `quote-${quote.id}`}
      initial={reduced ? false : { opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: isDragging ? 0.35 : 1, y: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.96, transition: soft }}
      transition={reduced ? { duration: 0 } : spring}
      whileHover={reduced || isDragging ? undefined : { y: -2 }}
      whileTap={reduced ? undefined : { scale: 0.985 }}
      className="cursor-grab touch-none outline-none active:cursor-grabbing"
      onClick={() => { if (!isDragging) onOpen(quote); }}
      {...listeners}
      {...attributes}
    >
      <QuoteCardFace quote={quote} />
    </motion.div>
  );
}

function Column({
  col, count, children, reduced,
}: { col: string; count: number; children: ReactNode; reduced: boolean }) {
  const { tr } = useTr();
  const { setNodeRef, isOver } = useDroppable({ id: col });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tr(quoteStatus[col].label)}
        </span>
        <motion.span
          key={count}
          initial={reduced ? false : { scale: 0.7, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={reduced ? { duration: 0 } : spring}
          className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
        >
          {count}
        </motion.span>
      </div>
      <motion.div
        ref={setNodeRef}
        animate={
          reduced
            ? undefined
            : isOver
              ? { backgroundColor: "rgba(66,89,138,0.07)", scale: 1.012 }
              : { backgroundColor: "rgba(66,89,138,0)", scale: 1 }
        }
        transition={soft}
        className={cn(
          "min-h-24 space-y-2 rounded-xl p-1",
          isOver && "ring-2 ring-primary/30 ring-inset",
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {children}
        </AnimatePresence>
        {count === 0 && (
          <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            {tr("Vazio")}
          </p>
        )}
      </motion.div>
    </div>
  );
}

export function QuoteKanban({
  quotes, customerName, onOpen, onMove,
}: {
  quotes: any[];
  customerName: (id: string) => string;
  onOpen: (q: any) => void;
  onMove: (quote: any, toStatus: string) => void;
}) {
  const reduced = !!useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);

  // 6px antes de considerar arraste — assim o clique simples continua abrindo o detalhe.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const decorated = useMemo(
    () => quotes.map((q) => ({ ...q, __customerName: customerName(q.customer_id) })),
    [quotes, customerName],
  );

  const active = activeId ? decorated.find((q) => q.id === activeId) : null;

  const handleStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const to = e.over?.id ? String(e.over.id) : null;
    if (!to) return;
    const quote = decorated.find((q) => q.id === String(e.active.id));
    if (!quote || quote.status === to) return;
    onMove(quote, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {quoteColumns.map((col) => {
          const items = decorated.filter((q) => q.status === col);
          return (
            <Column key={col} col={col} count={items.length} reduced={reduced}>
              {items.map((q) => (
                <DraggableCard key={q.id} quote={q} onOpen={onOpen} reduced={reduced} />
              ))}
            </Column>
          );
        })}
      </div>

      <DragOverlay dropAnimation={reduced ? null : { duration: 180, easing: "cubic-bezier(0.22,0.61,0.36,1)" }}>
        {active ? (
          <motion.div
            initial={reduced ? false : { scale: 1 }}
            animate={reduced ? undefined : { scale: 1.03, rotate: -1.2 }}
            transition={spring}
            className="w-72 cursor-grabbing"
          >
            <QuoteCardFace quote={active} dragging />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
