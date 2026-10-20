# AJA Aero ERP — Amazon Jet Aviation

ERP de peças aeronáuticas: do lead ao AOG entregue. Gestão de leads, cotações,
RFQs, catálogo de PNs, fornecedores, certificados (FAA 8130-3, EASA Form 1, COC),
compras, logística Deerfield → Brasil, financeiro e automações de IA.

## Stack

| Camada | Tecnologia |
|---|---|
| Front | React 19 + TanStack Start/Router + Vite 8 |
| UI | Tailwind 4 + shadcn/ui |
| Banco | Supabase (Postgres 17, RLS por papel) |
| IA | Vercel AI SDK, provedor configurável |
| Deploy | Vercel (Nitro, Build Output API v3) |

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha as chaves do Supabase
npm run dev            # http://localhost:8080
```

O primeiro usuário que se cadastrar vira **admin** automaticamente
(trigger `handle_new_user`). Para o cadastro funcionar sem SMTP, desligue
**Confirm email** em Authentication → Sign In / Providers no painel do Supabase.

## Banco de dados

As migrations ficam em `supabase/migrations/`, aplicadas em ordem:

| Arquivo | Conteúdo |
|---|---|
| `20260624115614_*.sql` | Schema base: 24 tabelas, 12 enums, triggers de `updated_at` |
| `20261020120000_improvements.sql` | Numeração atômica de documentos, índices, autoria automática, auditoria |
| `20261020130000_rls_roles.sql` | RLS por papel (7 perfis), `DELETE` revogado |
| `20261020140000_seed.sql` | Carga inicial — fornecedores são dados manuais, sem integração de API |

A arquitetura-alvo completa está documentada na própria aplicação, em
**Arquitetura de dados** (`/arquitetura`), e descrita em `src/lib/schema-docs.ts`.

### Papéis

`admin`, `ceo`, `comercial`, `compras`, `financeiro`, `logistica`, `operador`.
A leitura é ampla para a equipe; a escrita é restrita ao papel dono de cada
módulo; valores financeiros só aparecem para admin, CEO e financeiro.

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Cadastre as variáveis de `.env.example` em **Settings → Environment Variables**.
   As `VITE_*` precisam existir em *build time*.
3. O build gera `.vercel/output` (Build Output API v3) — a Vercel reconhece sozinha.

`vercel.json` fixa `framework: null` para que o Build Output API tenha
precedência sobre a autodetecção.

## Integrações

O levantamento de quais integrações são viáveis, com custo e esforço estimados,
está no relatório de integrações entregue à equipe (outubro de 2026). Resumo:
câmbio PTAX, IA, e-mail transacional, rastreio de cargas e WhatsApp são viáveis
e baratos; QuickBooks depende de faixa de preço da Intuit; OEMs como a Textron
não oferecem API pública.
