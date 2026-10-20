import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useTr } from "@/lib/i18n";

export type FieldType = "text" | "number" | "textarea" | "date" | "select" | "switch" | "email";

export interface Field {
  name: string;
  label: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  full?: boolean;
}

export function RecordDialog({
  open,
  onOpenChange,
  title,
  fields,
  initial,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  fields: Field[];
  initial?: Record<string, any> | null;
  onSave: (values: Record<string, any>) => void;
  saving?: boolean;
}) {
  const { tr } = useTr();
  const [values, setValues] = useState<Record<string, any>>({});


  useEffect(() => {
    if (open) setValues(initial ? { ...initial } : {});
  }, [open, initial]);

  const set = (k: string, v: any) => setValues((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const payload: Record<string, any> = { ...values };
    fields.forEach((f) => {
      if (f.type === "number" && payload[f.name] !== undefined && payload[f.name] !== "") {
        payload[f.name] = Number(payload[f.name]);
      }
      if (payload[f.name] === "") payload[f.name] = null;
    });
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{tr(title)}</DialogTitle>
          <DialogDescription>{tr("Preencha os campos abaixo e salve.")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          {fields.map((f) => {
            const type = f.type ?? "text";
            const v = values[f.name] ?? (type === "switch" ? false : "");
            return (
              <div key={f.name} className={f.full || type === "textarea" ? "sm:col-span-2" : ""}>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {tr(f.label)}
                  {f.required && <span className="text-aog"> *</span>}
                </Label>
                {type === "textarea" ? (
                  <Textarea value={v} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} rows={3} />
                ) : type === "switch" ? (
                  <div className="flex h-9 items-center">
                    <Switch checked={!!v} onCheckedChange={(c) => set(f.name, c)} />
                  </div>
                ) : type === "select" ? (
                  <Select value={v ? String(v) : ""} onValueChange={(val) => set(f.name, val)}>
                    <SelectTrigger><SelectValue placeholder={tr("Selecione")} /></SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{tr(o.label)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={type === "number" ? "number" : type === "date" ? "date" : type === "email" ? "email" : "text"}
                    value={v}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.name, e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tr("Cancelar")}</Button>
          <Button onClick={submit} disabled={saving}>{saving ? tr("Salvando...") : tr("Salvar")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
