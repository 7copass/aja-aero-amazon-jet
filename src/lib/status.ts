// Status label + semantic tone maps for the AJA Aero ERP.
export type Tone = "navy" | "gold" | "success" | "warning" | "aog" | "muted" | "info";

export const toneClass: Record<Tone, string> = {
  navy: "bg-primary/10 text-primary border-primary/20",
  gold: "bg-gold/15 text-gold-foreground border-gold/30",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/20 text-warning-foreground border-warning/30",
  aog: "bg-aog/12 text-aog border-aog/30",
  muted: "bg-muted text-muted-foreground border-border",
  info: "bg-chart-3/12 text-chart-3 border-chart-3/25",
};

type Entry = { label: string; tone: Tone };

export const leadStatus: Record<string, Entry> = {
  novo: { label: "Novo", tone: "info" },
  qualificado: { label: "Qualificado", tone: "navy" },
  aguardando_cotacao: { label: "Aguardando cotação", tone: "muted" },
  em_cotacao: { label: "Em cotação", tone: "gold" },
  estimate_enviado: { label: "Estimate enviado", tone: "warning" },
  follow_up: { label: "Follow-up", tone: "warning" },
  ganhou: { label: "Ganhou", tone: "success" },
  perdido: { label: "Perdido", tone: "aog" },
};

export const quoteStatus: Record<string, Entry> = {
  nova: { label: "Nova cotação", tone: "info" },
  em_pesquisa: { label: "Em pesquisa", tone: "navy" },
  aguardando_fornecedor: { label: "Aguardando fornecedor", tone: "muted" },
  preco_recebido: { label: "Preço recebido", tone: "navy" },
  analise_margem: { label: "Análise de margem", tone: "gold" },
  estimate_enviado: { label: "Estimate enviado", tone: "warning" },
  follow_up: { label: "Follow-up", tone: "warning" },
  aprovado: { label: "Aprovado", tone: "success" },
  perdido: { label: "Perdido", tone: "aog" },
  cancelado: { label: "Cancelado", tone: "muted" },
};

export const quoteColumns = [
  "nova", "em_pesquisa", "aguardando_fornecedor", "preco_recebido", "analise_margem",
  "estimate_enviado", "follow_up", "aprovado", "perdido", "cancelado",
];

export const rfqStatus: Record<string, Entry> = {
  rascunho: { label: "Rascunho", tone: "muted" },
  enviado: { label: "Enviado", tone: "navy" },
  respondido: { label: "Respondido", tone: "gold" },
  escolhido: { label: "Escolhido", tone: "success" },
  recusado: { label: "Recusado", tone: "aog" },
};

export const certType: Record<string, string> = {
  faa_8130_3: "FAA 8130-3",
  easa_form_1: "EASA Form 1",
  coc: "COC",
  mfg_cert: "MFG Cert",
  tag: "TAG",
  trace: "Trace",
  non_incident: "Non-Incident Statement",
};

export const certStatus: Record<string, Entry> = {
  pendente: { label: "Pendente", tone: "warning" },
  recebido: { label: "Recebido", tone: "navy" },
  aprovado: { label: "Aprovado", tone: "success" },
  rejeitado: { label: "Rejeitado", tone: "aog" },
};

export const poStatus: Record<string, Entry> = {
  aguardando_aprovacao: { label: "Aguardando aprovação cliente", tone: "warning" },
  po_criada: { label: "PO criada", tone: "info" },
  aguardando_pagamento: { label: "Aguardando pagamento", tone: "warning" },
  pedido_realizado: { label: "Pedido realizado", tone: "navy" },
  aguardando_envio: { label: "Aguardando envio", tone: "muted" },
  enviado_fornecedor: { label: "Enviado pelo fornecedor", tone: "navy" },
  recebido: { label: "Recebido na Amazon Jet", tone: "gold" },
  em_conferencia: { label: "Em conferência", tone: "gold" },
  liberado_logistica: { label: "Liberado para logística", tone: "success" },
};

export const logisticsStatus: Record<string, Entry> = {
  aguardando_peca: { label: "Aguardando peça", tone: "muted" },
  em_transito_deerfield: { label: "Em trânsito p/ Deerfield", tone: "navy" },
  recebido_deerfield: { label: "Recebido em Deerfield", tone: "info" },
  conferencia: { label: "Conferência", tone: "gold" },
  doc_pendente: { label: "Documentação pendente", tone: "warning" },
  pronto_exportacao: { label: "Pronto p/ exportação", tone: "info" },
  enviado_brasil: { label: "Enviado ao Brasil", tone: "navy" },
  em_nacionalizacao: { label: "Em nacionalização", tone: "gold" },
  entregue: { label: "Entregue ao cliente", tone: "success" },
};

export const finStatus: Record<string, Entry> = {
  rascunho: { label: "Rascunho", tone: "muted" },
  enviado: { label: "Enviado", tone: "navy" },
  aprovado: { label: "Aprovado", tone: "gold" },
  pago: { label: "Pago", tone: "success" },
  cancelado: { label: "Cancelado", tone: "aog" },
};

export const customerType: Record<string, string> = {
  oficina: "Oficina",
  operador: "Operador",
  taxi_aereo: "Táxi aéreo",
  mecanico: "Mecânico",
  proprietario: "Proprietário",
  empresa: "Empresa",
};

export const roleLabels: Record<string, string> = {
  admin: "Administrador",
  ceo: "CEO",
  comercial: "Comercial",
  compras: "Compras",
  financeiro: "Financeiro",
  logistica: "Logística",
  operador: "Operador",
};
