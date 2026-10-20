import { useState } from "react";
import { Link, useRouterState, useNavigate, Outlet } from "@tanstack/react-router";
import { Menu, LogOut, Plane, Globe } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { roleLabels } from "@/lib/status";
import { highestRole } from "@/hooks/useUserRoles";
import { useQueryClient } from "@tanstack/react-query";
import { useTr } from "@/lib/i18n";
import { LANGS } from "@/lib/translations";
import logo from "@/assets/aja-logo.png";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { tr } = useTr();
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
      {navItems.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className={cn("h-4 w-4 shrink-0", active && "text-sidebar-primary")} />
            <span>{tr(item.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold text-sidebar-primary-foreground">
        <Plane className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-sm font-bold text-sidebar-accent-foreground">AJA Aero ERP</p>
        <p className="text-[11px] text-sidebar-foreground/60">Amazon Jet Aviation</p>
      </div>
    </div>
  );
}

function LanguageSwitcher() {
  const { lang, setLang, tr } = useTr();
  return (
    <div className="flex items-center gap-1 rounded-full border bg-card p-0.5" aria-label={tr("Idioma")}>
      <Globe className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={cn(
            "rounded-full px-2 py-1 text-[11px] font-semibold transition-colors",
            lang === l.code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { tr } = useTr();

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const role = highestRole(user?.roles);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar lg:flex">
        <Brand />
        <NavList />
        <SignOutFooter user={user} role={role} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar">
            <Brand />
            <NavList onNavigate={() => setMobileOpen(false)} />
            <SignOutFooter user={user} role={role} onSignOut={handleSignOut} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label={tr("Abrir menu")}>
            <Menu className="h-5 w-5" />
          </button>
          <img src={logo} alt="AJA Aero ERP" className="h-8 w-auto lg:hidden" width={120} height={32} />
          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher />
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-foreground">{user?.profile?.full_name ?? user?.email}</p>
              <p className="text-[11px] text-muted-foreground">{role ? tr(roleLabels[role]) : "—"}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {(user?.profile?.full_name ?? user?.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SignOutFooter({ user, role, onSignOut }: { user: any; role?: string; onSignOut: () => void }) {
  const { tr } = useTr();
  return (
    <div className="border-t border-sidebar-border p-3">
      <div className="mb-2 px-1">
        <p className="truncate text-xs font-medium text-sidebar-accent-foreground">
          {user?.profile?.full_name ?? user?.email ?? tr("Usuário")}
        </p>
        <p className="text-[11px] text-sidebar-primary">{role ? tr(roleLabels[role]) : ""}</p>
      </div>
      <button
        onClick={onSignOut}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      >
        <LogOut className="h-4 w-4" /> {tr("Sair")}
      </button>
    </div>
  );
}
