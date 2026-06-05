# CLAUDE.md

Orientações para agentes trabalhando neste repositório.

## O que é

RDO Digital — app full-stack (Next.js 14 App Router + Prisma + PostgreSQL) para
gestão de estoque de produtos químicos. Frontend e backend (API REST) vivem no
mesmo projeto Next.js.

## Comandos

- Dev: `npm run dev` · Build: `npm run build` · Tipos: `npm run typecheck`
- Banco: `npx prisma migrate dev`, `npm run db:seed`, `npm run prisma:studio`
- Requer `.env` com `DATABASE_URL` e `JWT_SECRET` (ver `.env.example`).

## Convenções

- **API**: Route Handlers em `src/app/api/**`. Toda rota usa o wrapper
  `handle()` de `src/lib/api.ts` e protege acesso com `requirePermission(...)`.
  Rotas que leem sessão declaram `export const dynamic = 'force-dynamic'`.
- **Domínio**: regras de negócio em `src/lib/services/*` (ex.: cálculo de saldo,
  autorização de restritos). Mantenha-as fora dos componentes/rotas.
- **Validação**: schemas Zod em `src/lib/validators.ts`.
- **RBAC**: permissões em `src/lib/rbac.ts`. Atualize a matriz ao criar rotas.
- **Auditoria**: use `audit()` para qualquer ação sensível (CRUD, login, export).
- **UI**: Tailwind com classes utilitárias em `globals.css` (`.btn-primary`,
  `.input`, `.card`, `.th`, `.td`). Componentes compartilhados em
  `src/components/ui.tsx`. Tema claro/escuro via `theme-provider`.

## Após mudanças

Rode `npm run typecheck` e `npm run build` antes de commitar. Se alterar o
schema Prisma, gere migração (`prisma migrate dev`) e atualize `docs/DATABASE.md`
e `docs/sql/schema.sql`.
