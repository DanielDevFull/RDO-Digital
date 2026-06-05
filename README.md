# RDO Digital — Gestão de Estoque de Produtos Químicos

Aplicação web completa para **controle de entrada, saída e devolução de produtos
químicos**, com foco em rastreabilidade, controle de acesso (RBAC) e segurança
operacional. Cada estoque físico possui um **QR Code** que leva direto à tela de
movimentação.

> Interface moderna estilo **ERP**, responsiva (desktop/tablet/celular), com
> **tema claro e escuro** e leitor de QR Code integrado.

## ✨ Funcionalidades

- 📊 **Dashboard** com cards (total de produtos, químicos, restritos, vencidos,
  a vencer, estoque baixo) e gráficos de consumo por período, produto, OM e local.
- 🧪 **Cadastro de produtos** completo: código interno, CAS, FISPQ (PDF), lote,
  validade, estoque mín/máx, localização, flags de químico/restrito/autorização.
- 🔄 **Movimentações** (Entrada/Saída/Retorno) com data/hora automáticas, saldo
  anterior e atualizado, OM, local de aplicação e responsável.
- 🏷️ **QR Code por estoque** — escaneie e vá direto para `/m/{code}`.
- 🔒 **Controle de produtos restritos** — autorização adicional com autorizador,
  motivo, assinatura digital e data/hora.
- 📑 **Relatórios** (diário, semanal, mensal, anual, por produto/OM/usuário/local,
  vencidos, a vencer, restritos) exportáveis em **PDF, Excel e CSV**.
- 👥 **Usuários & RBAC**: Administrador, Supervisor, Operador, Consulta.
- 🛡️ **Auditoria** completa: login/logout, CRUD, movimentações, aprovações,
  exportações — com IP e dispositivo.
- 🔐 **Segurança**: senhas com bcrypt, JWT httpOnly, permissões por perfil,
  backup automático e histórico de alterações.

## 🧱 Tecnologias

| Camada | Stack |
|---|---|
| Frontend | **React 18 + Next.js 14 (App Router) + Tailwind CSS** |
| Backend | **Node.js** (Next.js Route Handlers — API REST) |
| Banco | **PostgreSQL** + **Prisma ORM** |
| Auth | **JWT (jose) + RBAC** + bcrypt |
| Gráficos | Recharts · **QR**: qrcode / html5-qrcode · **Export**: jsPDF, xlsx |

> **Nota de arquitetura:** o backend foi implementado como uma API REST em
> Node.js usando os Route Handlers do Next.js, entregando um único artefato
> coeso e pronto para deploy. A camada de domínio (`src/lib/services`) é isolada
> e portável para um serviço NestJS dedicado, caso se opte por separar os
> processos no futuro.

## 🚀 Início rápido (Docker)

```bash
cp .env.example .env        # ajuste JWT_SECRET
RDO_SEED=true docker compose up --build
# App em http://localhost:3000
```

## 🛠️ Desenvolvimento local

```bash
npm install
cp .env.example .env                 # configure DATABASE_URL e JWT_SECRET
npx prisma migrate dev               # cria o schema
npm run db:seed                      # dados de demonstração
npm run dev                          # http://localhost:3000
```

### Usuários de demonstração (seed)

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@rdo.mil.br` | `admin123` |
| Supervisor | `supervisor@rdo.mil.br` | `super123` |
| Operador | `operador@rdo.mil.br` | `oper123` |
| Consulta | `consulta@rdo.mil.br` | `consulta123` |

## 📂 Estrutura

```
prisma/            schema.prisma · seed.ts · migrations (SQL)
src/
  app/
    (app)/         telas autenticadas (dashboard, products, movements, stocks,
                   reports, users, audit) com shell ERP
    m/[code]/      tela de movimentação acessada pelo QR Code
    login/         autenticação
    api/           API REST (auth, products, movements, stocks, dashboard,
                   reports, users, audit, uploads, qrcode)
  components/      app-shell, movement-form, ui, theme-provider
  lib/             prisma, auth, rbac, api, audit, validators, services
docs/              DATABASE.md (ER) · API.md · WIREFRAMES.md · sql/schema.sql
scripts/           backup.sh
Dockerfile · docker-compose.yml
```

## 📜 Scripts npm

| Script | Ação |
|---|---|
| `npm run dev` | Ambiente de desenvolvimento |
| `npm run build` | Build de produção (gera Prisma Client) |
| `npm start` | Servidor de produção |
| `npm run typecheck` | Verificação de tipos |
| `npm run prisma:migrate` | Cria/aplica migrações |
| `npm run db:seed` | Popula dados de exemplo |
| `npm run prisma:studio` | UI do banco (Prisma Studio) |

## 📖 Documentação

- [Modelagem & Diagrama ER](docs/DATABASE.md)
- [API REST](docs/API.md)
- [Wireframes](docs/WIREFRAMES.md)
- [Script SQL](docs/sql/schema.sql)
- [Deploy na Vercel + Neon](docs/DEPLOY-VERCEL.md)

## 🔒 Segurança & operação

- Senhas com **bcrypt** (cost 12); sessão em cookie **httpOnly/SameSite**.
- **RBAC** aplicado em cada rota da API (`requirePermission`).
- **Auditoria** com IP e User-Agent em todas as ações sensíveis.
- **Backup automático** via `scripts/backup.sh` (agende no cron).
- Produtos com histórico são **inativados**, nunca apagados (rastreabilidade).
- Alertas de **estoque mínimo** e **vencimento** no dashboard.
