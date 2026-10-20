import { useState } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { useTr } from "@/lib/i18n";
import { LANGS } from "@/lib/translations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { tr, lang, setLang } = useTr();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(tr("Bem-vindo de volta!"));
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success(tr("Conta criada com sucesso!"));
      }
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.message ?? tr("Falha na autenticação"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Language switcher (top-right) */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border bg-card/90 p-0.5 backdrop-blur">
        <Globe className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={cn(
              "rounded-full px-2 py-1 text-[11px] font-semibold transition-colors",
              lang === l.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-navy p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-gold-foreground">
            <Plane className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-white">AJA Aero ERP</p>
            <p className="text-sm text-white/60">Amazon Jet Aviation</p>
          </div>
        </div>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight text-white">
            {tr("Gestão aeronáutica de ponta a ponta.")}
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            {tr("Leads, cotações, RFQs, peças, fornecedores, certificados, compras, logística e financeiro — tudo em um único sistema, do AOG à entrega.")}
          </p>
        </div>
        <p className="text-xs text-white/40">Deerfield Beach, FL · Brasil</p>
      </div>

      {/* Form */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Plane className="h-6 w-6" />
            </div>
            <p className="font-display text-xl font-bold">AJA Aero ERP</p>
            <p className="text-sm text-muted-foreground">Amazon Jet Aviation</p>
          </div>

          <h1 className="font-display text-2xl font-bold">
            {mode === "login" ? tr("Entrar") : tr("Criar conta")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? tr("Acesse seu painel operacional.") : tr("Cadastre-se para começar.")}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{tr("Nome completo")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("Seu nome")} required />
              </div>
            )}
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{tr("E-mail")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@amazonjet.aero" required />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{tr("Senha")}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? tr("Entrar") : tr("Criar conta")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? tr("Não tem conta?") : tr("Já tem conta?")}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "login" ? tr("Criar conta") : tr("Entrar")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
