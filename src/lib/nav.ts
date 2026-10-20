import {
  LayoutDashboard, UserPlus, Users, FileText, Send, Package, Truck, Award,
  ShoppingCart, Plane, DollarSign, RefreshCw, Bot, BarChart3, Settings, Database,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: UserPlus },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/cotacoes", label: "Cotações", icon: FileText },
  { to: "/rfqs", label: "RFQs", icon: Send },
  { to: "/pecas", label: "Peças / PN", icon: Package },
  { to: "/fornecedores", label: "Fornecedores", icon: Truck },
  { to: "/certificados", label: "Certificados", icon: Award },
  { to: "/compras", label: "Compras", icon: ShoppingCart },
  { to: "/logistica", label: "Logística", icon: Plane },
  { to: "/financeiro", label: "Financeiro", icon: DollarSign },
  { to: "/quickbooks", label: "QuickBooks", icon: RefreshCw },
  { to: "/automacoes", label: "Automações IA", icon: Bot },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
  { to: "/arquitetura", label: "Arquitetura de dados", icon: Database },
];
