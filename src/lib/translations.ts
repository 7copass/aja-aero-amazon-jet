// AJA Aero ERP — translation dictionary.
// Keyed by the Portuguese (pt-BR) source string. `pt` returns the key itself.
export type Lang = "pt" | "en" | "es";

type Entry = { en: string; es: string };

export const dict: Record<string, Entry> = {
  // ---- Navigation ----
  "Dashboard": { en: "Dashboard", es: "Panel" },
  "Leads": { en: "Leads", es: "Leads" },
  "Clientes": { en: "Customers", es: "Clientes" },
  "Cotações": { en: "Quotes", es: "Cotizaciones" },
  "RFQs": { en: "RFQs", es: "RFQs" },
  "Peças / PN": { en: "Parts / PN", es: "Piezas / PN" },
  "Fornecedores": { en: "Suppliers", es: "Proveedores" },
  "Certificados": { en: "Certificates", es: "Certificados" },
  "Compras": { en: "Purchasing", es: "Compras" },
  "Logística": { en: "Logistics", es: "Logística" },
  "Financeiro": { en: "Finance", es: "Finanzas" },
  "QuickBooks": { en: "QuickBooks", es: "QuickBooks" },
  "Automações IA": { en: "AI Automations", es: "Automatizaciones IA" },
  "Relatórios": { en: "Reports", es: "Informes" },
  "Configurações": { en: "Settings", es: "Configuración" },

  // ---- Header / layout ----
  "Sair": { en: "Sign out", es: "Salir" },
  "Usuário": { en: "User", es: "Usuario" },
  "Abrir menu": { en: "Open menu", es: "Abrir menú" },
  "Idioma": { en: "Language", es: "Idioma" },

  // ---- Page subtitles ----
  "Purchase Orders e acompanhamento de pedidos": { en: "Purchase orders and order tracking", es: "Órdenes de compra y seguimiento de pedidos" },
  "Operadores, oficinas, táxis aéreos e proprietários": { en: "Operators, MROs, air taxis and owners", es: "Operadores, talleres, taxis aéreos y propietarios" },
  "Indicadores operacionais e comerciais": { en: "Operational and commercial KPIs", es: "Indicadores operativos y comerciales" },
  "FAA 8130-3, EASA Form 1, COC, Trace e mais": { en: "FAA 8130-3, EASA Form 1, COC, Trace and more", es: "FAA 8130-3, EASA Form 1, COC, Trace y más" },
  "Requisições de cotação aos fornecedores": { en: "Requests for quotation to suppliers", es: "Solicitudes de cotización a proveedores" },
  "Sistema financeiro oficial nesta versão — integração via API": { en: "Official finance system in this version — API integration", es: "Sistema financiero oficial en esta versión — integración vía API" },
  "Catálogo técnico de part numbers": { en: "Technical catalog of part numbers", es: "Catálogo técnico de part numbers" },
  "Trânsito Deerfield → Brasil e nacionalização": { en: "Deerfield → Brazil transit and nationalization", es: "Tránsito Deerfield → Brasil y nacionalización" },
  "Captação e qualificação de oportunidades": { en: "Lead capture and qualification", es: "Captación y calificación de oportunidades" },
  "Rede global de suprimento de peças aeronáuticas": { en: "Global aviation parts supply network", es: "Red global de suministro de piezas aeronáuticas" },
  "Visão geral operacional · Amazon Jet Aviation": { en: "Operational overview · Amazon Jet Aviation", es: "Visión general operativa · Amazon Jet Aviation" },
  "Estrutura interna preparada para substituir o QuickBooks": { en: "Internal structure ready to replace QuickBooks", es: "Estructura interna preparada para reemplazar QuickBooks" },
  "Agentes inteligentes — preparados para OpenAI / Lovable AI": { en: "Intelligent agents — ready for OpenAI / Lovable AI", es: "Agentes inteligentes — preparados para OpenAI / Lovable AI" },
  "Pipeline comercial — do AOG ao fechamento": { en: "Sales pipeline — from AOG to closing", es: "Pipeline comercial — del AOG al cierre" },
  "Empresa, usuários, parâmetros e integrações": { en: "Company, users, parameters and integrations", es: "Empresa, usuarios, parámetros e integraciones" },

  // ---- Dashboard ----
  "Cotações por status": { en: "Quotes by status", es: "Cotizaciones por estado" },
  "Vendas por mês": { en: "Sales by month", es: "Ventas por mes" },
  "Margem por operação": { en: "Margin by deal", es: "Margen por operación" },
  "Fornecedores mais utilizados": { en: "Most used suppliers", es: "Proveedores más utilizados" },
  "PNs mais cotados": { en: "Most quoted PNs", es: "PN más cotizados" },
  "Tempo médio de resposta (horas)": { en: "Average response time (hours)", es: "Tiempo medio de respuesta (horas)" },
  "Cotações abertas": { en: "Open quotes", es: "Cotizaciones abiertas" },
  "Cotações AOG": { en: "AOG quotes", es: "Cotizaciones AOG" },
  "Estimates enviados": { en: "Estimates sent", es: "Estimaciones enviadas" },
  "Vendas aprovadas": { en: "Approved sales", es: "Ventas aprobadas" },
  "Compras pendentes": { en: "Pending purchases", es: "Compras pendientes" },
  "Pedidos em trânsito": { en: "Orders in transit", es: "Pedidos en tránsito" },
  "Certificados pendentes": { en: "Pending certificates", es: "Certificados pendientes" },
  "Valor vendido (mês)": { en: "Revenue (month)", es: "Ventas (mes)" },
  "Margem bruta (mês)": { en: "Gross margin (month)", es: "Margen bruto (mes)" },
  "Clientes ativos": { en: "Active customers", es: "Clientes activos" },
  "Fornecedores ativos": { en: "Active suppliers", es: "Proveedores activos" },

  // ---- Common actions / words ----
  "Nova cotação": { en: "New quote", es: "Nueva cotización" },
  "Kanban": { en: "Kanban", es: "Kanban" },
  "Tabela": { en: "Table", es: "Tabla" },
  "Salvar": { en: "Save", es: "Guardar" },
  "Editar": { en: "Edit", es: "Editar" },
  "Fechar": { en: "Close", es: "Cerrar" },
  "Cancelar": { en: "Cancel", es: "Cancelar" },
  "Vazio": { en: "Empty", es: "Vacío" },
  "Carregando...": { en: "Loading...", es: "Cargando..." },
  "Ativo": { en: "Active", es: "Activo" },
  "Inativo": { en: "Inactive", es: "Inactivo" },
  "Executar agora": { en: "Run now", es: "Ejecutar ahora" },
  "Buscar...": { en: "Search...", es: "Buscar..." },
  "Número": { en: "Number", es: "Número" },
  "Cliente": { en: "Customer", es: "Cliente" },
  "Aeronave": { en: "Aircraft", es: "Aeronave" },
  "Preço final": { en: "Final price", es: "Precio final" },
  "Margem": { en: "Margin", es: "Margen" },
  "Status": { en: "Status", es: "Estado" },
  "Responsável": { en: "Responsible", es: "Responsable" },
  "Data": { en: "Date", es: "Fecha" },
  "Validade": { en: "Valid until", es: "Validez" },
  "Câmbio": { en: "Exchange rate", es: "Tipo de cambio" },
  "Observações": { en: "Notes", es: "Observaciones" },

  // ---- Quote detail ----
  "Gerar RFQ": { en: "Generate RFQ", es: "Generar RFQ" },
  "Calcular preço": { en: "Calculate price", es: "Calcular precio" },
  "Gerar Estimate": { en: "Generate estimate", es: "Generar estimación" },
  "Enviar p/ QuickBooks": { en: "Send to QuickBooks", es: "Enviar a QuickBooks" },
  "Gerar PDF": { en: "Generate PDF", es: "Generar PDF" },
  "Enviar WhatsApp": { en: "Send WhatsApp", es: "Enviar WhatsApp" },
  "Criar follow-up": { en: "Create follow-up", es: "Crear seguimiento" },
  "Aprovar cotação": { en: "Approve quote", es: "Aprobar cotización" },
  "Marcar como perdida": { en: "Mark as lost", es: "Marcar como perdida" },
  "Custo fornecedor": { en: "Supplier cost", es: "Costo proveedor" },
  "Frete": { en: "Freight", es: "Flete" },
  "Taxa import.": { en: "Import fee", es: "Tasa import." },
  "Margem desejada": { en: "Target margin", es: "Margen deseado" },
  "Margem real": { en: "Real margin", es: "Margen real" },

  // ---- Status: quotes ----
  "Nova cotação ": { en: "New quote", es: "Nueva cotización" },
  "Em pesquisa": { en: "Researching", es: "En investigación" },
  "Aguardando fornecedor": { en: "Awaiting supplier", es: "Esperando proveedor" },
  "Preço recebido": { en: "Price received", es: "Precio recibido" },
  "Análise de margem": { en: "Margin analysis", es: "Análisis de margen" },
  "Estimate enviado": { en: "Estimate sent", es: "Estimación enviada" },
  "Follow-up": { en: "Follow-up", es: "Seguimiento" },
  "Aprovado": { en: "Approved", es: "Aprobado" },
  "Perdido": { en: "Lost", es: "Perdido" },
  "Cancelado": { en: "Cancelled", es: "Cancelado" },

  // ---- Status: leads ----
  "Novo": { en: "New", es: "Nuevo" },
  "Qualificado": { en: "Qualified", es: "Calificado" },
  "Aguardando cotação": { en: "Awaiting quote", es: "Esperando cotización" },
  "Em cotação": { en: "Quoting", es: "En cotización" },
  "Ganhou": { en: "Won", es: "Ganado" },

  // ---- Status: rfq ----
  "Rascunho": { en: "Draft", es: "Borrador" },
  "Enviado": { en: "Sent", es: "Enviado" },
  "Respondido": { en: "Answered", es: "Respondido" },
  "Escolhido": { en: "Chosen", es: "Elegido" },
  "Recusado": { en: "Declined", es: "Rechazado" },

  // ---- Status: certificates ----
  "Pendente": { en: "Pending", es: "Pendiente" },
  "Recebido": { en: "Received", es: "Recibido" },
  "Rejeitado": { en: "Rejected", es: "Rechazado" },

  // ---- Status: purchase orders ----
  "Aguardando aprovação cliente": { en: "Awaiting customer approval", es: "Esperando aprobación del cliente" },
  "PO criada": { en: "PO created", es: "OC creada" },
  "Aguardando pagamento": { en: "Awaiting payment", es: "Esperando pago" },
  "Pedido realizado": { en: "Order placed", es: "Pedido realizado" },
  "Aguardando envio": { en: "Awaiting shipment", es: "Esperando envío" },
  "Enviado pelo fornecedor": { en: "Shipped by supplier", es: "Enviado por el proveedor" },
  "Recebido na Amazon Jet": { en: "Received at Amazon Jet", es: "Recibido en Amazon Jet" },
  "Em conferência": { en: "Under inspection", es: "En verificación" },
  "Liberado para logística": { en: "Released to logistics", es: "Liberado a logística" },

  // ---- Status: logistics ----
  "Aguardando peça": { en: "Awaiting part", es: "Esperando pieza" },
  "Em trânsito p/ Deerfield": { en: "In transit to Deerfield", es: "En tránsito a Deerfield" },
  "Recebido em Deerfield": { en: "Received in Deerfield", es: "Recibido en Deerfield" },
  "Conferência": { en: "Inspection", es: "Verificación" },
  "Documentação pendente": { en: "Documentation pending", es: "Documentación pendiente" },
  "Pronto p/ exportação": { en: "Ready for export", es: "Listo para exportación" },
  "Enviado ao Brasil": { en: "Shipped to Brazil", es: "Enviado a Brasil" },
  "Em nacionalização": { en: "In customs clearance", es: "En nacionalización" },
  "Entregue ao cliente": { en: "Delivered to customer", es: "Entregado al cliente" },

  // ---- Status: finance ----
  "Pago": { en: "Paid", es: "Pagado" },

  // ---- Roles ----
  "Administrador": { en: "Administrator", es: "Administrador" },
  "Comercial": { en: "Sales", es: "Comercial" },
  "Operador": { en: "Operator", es: "Operador" },

  // ---- Customer types ----
  "Oficina": { en: "MRO / Workshop", es: "Taller" },
  "Operador ": { en: "Operator", es: "Operador" },
  "Táxi aéreo": { en: "Air taxi", es: "Taxi aéreo" },
  "Mecânico": { en: "Mechanic", es: "Mecánico" },
  "Proprietário": { en: "Owner", es: "Propietario" },
  "Empresa": { en: "Company", es: "Empresa" },

  // ---- AI Data Analyst agent ----
  "Agente de Análise de Dados": { en: "Data Analysis Agent", es: "Agente de Análisis de Datos" },
  "IA real conectada aos dados do ERP": { en: "Real AI connected to ERP data", es: "IA real conectada a los datos del ERP" },
  "Analisa vendas, margens, pipeline e gera insights acionáveis": { en: "Analyzes sales, margins, pipeline and generates actionable insights", es: "Analiza ventas, márgenes, pipeline y genera insights accionables" },
  "Gerar análise": { en: "Generate analysis", es: "Generar análisis" },
  "Analisando dados...": { en: "Analyzing data...", es: "Analizando datos..." },
  "Análise gerada com inteligência artificial": { en: "Analysis generated with artificial intelligence", es: "Análisis generado con inteligencia artificial" },
  "Não foi possível gerar a análise. Tente novamente.": { en: "Could not generate the analysis. Please try again.", es: "No se pudo generar el análisis. Inténtalo de nuevo." },
  "Limite de uso atingido. Tente novamente em instantes.": { en: "Usage limit reached. Try again shortly.", es: "Límite de uso alcanzado. Inténtalo en unos momentos." },
  "Créditos de IA esgotados. Adicione créditos para continuar.": { en: "AI credits exhausted. Add credits to continue.", es: "Créditos de IA agotados. Agrega créditos para continuar." },

  // ---- Misc ----
  "Página não encontrada": { en: "Page not found", es: "Página no encontrada" },
  "A página que você procura não existe ou foi movida.": { en: "The page you are looking for does not exist or has been moved.", es: "La página que buscas no existe o fue movida." },
  "Ir para o Dashboard": { en: "Go to dashboard", es: "Ir al panel" },

  // ---- Auth ----
  "Entrar": { en: "Sign in", es: "Iniciar sesión" },
  "Criar conta": { en: "Create account", es: "Crear cuenta" },
  "Acesse seu painel operacional.": { en: "Access your operations dashboard.", es: "Accede a tu panel operativo." },
  "Cadastre-se para começar.": { en: "Sign up to get started.", es: "Regístrate para empezar." },
  "Nome completo": { en: "Full name", es: "Nombre completo" },
  "Seu nome": { en: "Your name", es: "Tu nombre" },
  "E-mail": { en: "Email", es: "Correo electrónico" },
  "Senha": { en: "Password", es: "Contraseña" },
  "Não tem conta?": { en: "No account?", es: "¿No tienes cuenta?" },
  "Já tem conta?": { en: "Already have an account?", es: "¿Ya tienes cuenta?" },
  "Gestão aeronáutica de ponta a ponta.": { en: "End-to-end aviation management.", es: "Gestión aeronáutica de extremo a extremo." },
  "Leads, cotações, RFQs, peças, fornecedores, certificados, compras, logística e financeiro — tudo em um único sistema, do AOG à entrega.": {
    en: "Leads, quotes, RFQs, parts, suppliers, certificates, purchasing, logistics and finance — all in one system, from AOG to delivery.",
    es: "Leads, cotizaciones, RFQs, piezas, proveedores, certificados, compras, logística y finanzas — todo en un solo sistema, del AOG a la entrega.",
  },
  "Bem-vindo de volta!": { en: "Welcome back!", es: "¡Bienvenido de nuevo!" },
  "Conta criada com sucesso!": { en: "Account created successfully!", es: "¡Cuenta creada con éxito!" },
  "Falha na autenticação": { en: "Authentication failed", es: "Error de autenticación" },

  // ---- Forms / tables ----
  "Preencha os campos abaixo e salve.": { en: "Fill in the fields below and save.", es: "Completa los campos a continuación y guarda." },
  "Selecione": { en: "Select", es: "Seleccionar" },
  "Salvando...": { en: "Saving...", es: "Guardando..." },
  "Nenhum registro encontrado.": { en: "No records found.", es: "No se encontraron registros." },
};

const langs: { code: Lang; label: string }[] = [
  { code: "pt", label: "PT" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
];

export const LANGS = langs;

export function detectLang(): Lang {
  if (typeof window === "undefined") return "pt";
  const stored = window.localStorage.getItem("aja-lang") as Lang | null;
  if (stored && ["pt", "en", "es"].includes(stored)) return stored;
  const nav = (window.navigator.language || "").toLowerCase();
  if (nav.startsWith("pt")) return "pt";
  if (nav.startsWith("es")) return "es";
  return "en";
}

export function translate(s: string, lang: Lang): string {
  if (lang === "pt" || !s) return s;
  return dict[s]?.[lang] ?? s;
}
