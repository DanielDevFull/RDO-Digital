# Deploy na Vercel + Neon (Postgres)

Guia para publicar o **RDO Digital** com uma URL pública. A Vercel hospeda a
aplicação Next.js; o banco PostgreSQL fica no **Neon** (grátis e otimizado para
ambientes serverless).

> ⚠️ O erro **"Erro interno do servidor"** no login quase sempre significa que a
> variável **`DATABASE_URL` não está configurada** na Vercel (veja o log:
> `Environment variable not found: DATABASE_URL`). Siga os passos abaixo.

---

## 1. Criar o banco no Neon

Pela CLI (o `neonctl` **não** tem comando `init` — use `auth`):

```bash
npx neonctl@latest auth                                # login no navegador
npx neonctl@latest projects create --name rdo-digital  # cria o projeto
npx neonctl@latest connection-string --pooled          # imprime a DATABASE_URL
```

O último comando imprime a string de conexão **pooled** (recomendada para
serverless), no formato:

```
postgresql://user:senha@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

> Alternativa sem CLI: crie a conta em https://neon.tech, novo projeto, e copie
> a **Pooled connection string** do dashboard.

---

## 2. Criar as tabelas e o usuário administrador

Do seu computador, apontando para o banco de produção (rode **uma vez**):

```bash
export DATABASE_URL="cole-a-string-pooled-do-neon-aqui"
npx prisma migrate deploy   # cria todas as tabelas
npm run db:seed             # cria admin@rdo.mil.br / admin123 + dados de exemplo
```

> As migrações também rodam **automaticamente** em cada deploy na Vercel (ver
> seção 4), mas o **seed** precisa ser executado manualmente uma vez.

---

## 3. Configurar as variáveis de ambiente na Vercel

No painel do projeto → **Settings → Environment Variables**, adicione para os
ambientes **Production** e **Preview**:

| Nome | Valor | Obrigatório |
|---|---|:---:|
| `DATABASE_URL` | a string pooled do Neon | ✅ |
| `JWT_SECRET` | um texto aleatório com **≥ 32 caracteres** | ✅ |
| `NEXT_PUBLIC_APP_URL` | a URL pública do projeto (ex.: `https://rdo.vercel.app`) | ✅ |
| `JWT_EXPIRES_IN` | `8h` (opcional) | — |

Gere um `JWT_SECRET` forte com:
```bash
openssl rand -base64 48
```

> 💡 **Atalho:** conectando o Neon pela integração oficial da Vercel
> (**Integrations → Neon**), a `DATABASE_URL` é injetada automaticamente nos dois
> ambientes — nesse caso você só precisa adicionar `JWT_SECRET` e
> `NEXT_PUBLIC_APP_URL`.

---

## 4. Migração automática no build

O `package.json` define um script **`vercel-build`** que a Vercel executa
automaticamente:

```json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

Assim, a cada deploy a Vercel aplica as migrações pendentes no banco antes de
construir a aplicação. O script `build` padrão (usado localmente) permanece sem o
`migrate deploy`.

---

## 5. Deploy

1. Importe o repositório na Vercel (**New Project** → selecione o repo).
2. Framework detectado automaticamente: **Next.js** (não precisa configurar nada).
3. Após o primeiro deploy, se você adicionou as variáveis depois, faça
   **Deployments → Redeploy** para que elas sejam aplicadas.

Acesse a URL pública e faça login com **`admin@rdo.mil.br` / `admin123`**.
Troque a senha do administrador em **Usuários** logo no primeiro acesso.

---

## Solução de problemas

| Sintoma | Causa provável | Correção |
|---|---|---|
| `Erro interno do servidor` no login | `DATABASE_URL` ausente na Vercel | Passo 3 + Redeploy |
| `Credenciais inválidas` | Banco sem o usuário admin | Rode `npm run db:seed` (passo 2) |
| `Environment variable not found: DATABASE_URL` no log | Variável não definida no ambiente | Passo 3 |
| Erro de SSL ao conectar no Neon | Falta `?sslmode=require` na URL | Garanta o parâmetro na `DATABASE_URL` |
| Esgotamento de conexões sob carga | Usando conexão direta em vez de pooled | Use a string **`-pooler`** do Neon |
