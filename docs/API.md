# API REST — RDO Digital

Base URL: `/api`. Autenticação via cookie de sessão **httpOnly** (`rdo_session`)
contendo um JWT (HS256). Todas as respostas seguem o envelope:

```jsonc
// Sucesso
{ "success": true, "data": <payload> }
// Erro
{ "success": false, "error": "mensagem", "details": <opcional> }
```

Os erros usam códigos HTTP padrão: `401` não autenticado, `403` sem permissão,
`404` não encontrado, `409` conflito, `422` validação, `500` erro interno.

## Autenticação

| Método | Rota | Descrição | Perfil |
|---|---|---|---|
| POST | `/auth/login` | Autentica e cria a sessão. Body: `{ email, password }` | público |
| POST | `/auth/logout` | Encerra a sessão | autenticado |
| GET  | `/auth/me` | Dados do usuário logado + permissões | autenticado |

## Produtos

| Método | Rota | Descrição | Permissão |
|---|---|---|---|
| GET | `/products` | Lista. Query: `q, status, categoryId, restricted, chemical` | `product:view` |
| POST | `/products` | Cadastra produto | `product:create` |
| GET | `/products/{id}` | Detalhe + últimas movimentações | `product:view` |
| PUT | `/products/{id}` | Atualiza | `product:update` |
| DELETE | `/products/{id}` | Exclui (ou inativa se houver histórico) | `product:delete` |

## Movimentações

| Método | Rota | Descrição | Permissão |
|---|---|---|---|
| GET | `/movements` | Lista. Query: `productId, stockId, omId, type, from, to, limit` | `movement:view` |
| POST | `/movements` | Registra movimentação (ver corpo abaixo) | `movement:create` |

Corpo de uma movimentação:

```jsonc
{
  "type": "SAIDA",              // ENTRADA | SAIDA | RETORNO
  "productId": "...",
  "stockId": "...",            // opcional (preenchido pelo QR)
  "unit": "L",
  "quantity": 5,
  "omId": "...",               // opcional
  "applicationSite": "Oficina",
  "notes": "...",
  "batchNumber": "...",
  "expirationDate": "2027-01-01",
  // Obrigatório SOMENTE para SAIDA de produto restrito / que exige autorização:
  "authorization": {
    "reason": "Motivo da retirada",
    "digitalSignature": "Nome do solicitante",
    "approverId": "id-do-supervisor-ou-admin"
  }
}
```

## Estoques & QR Code

| Método | Rota | Descrição | Permissão |
|---|---|---|---|
| GET | `/stocks` | Lista estoques com contadores | `stock:view` |
| POST | `/stocks` | Cria estoque | `stock:manage` |
| GET | `/stocks/{id\|code}` | Estoque + produtos ativos (tela do QR) | `stock:view` |
| GET | `/stocks/{id}/qrcode` | **PNG** do QR Code → aponta para `/m/{code}` | `stock:view` |

## Auxiliares

| Método | Rota | Permissão |
|---|---|---|
| GET/POST | `/categories` | `product:view` / `product:create` |
| GET/POST | `/oms` | `movement:view` / `stock:manage` |
| GET/POST | `/users` | `user:view` / `user:manage` |
| PUT/DELETE | `/users/{id}` | `user:manage` |
| POST | `/uploads` | Upload FISPQ (PDF, multipart) — `product:update` |

## Dashboard, Relatórios e Auditoria

| Método | Rota | Descrição | Permissão |
|---|---|---|---|
| GET | `/dashboard` | Cards + gráficos agregados | `dashboard:view` |
| GET | `/reports` | Relatórios. Query: `type, period, from, to, format` | `report:view` (+ `report:export` para arquivos) |
| GET | `/audit` | Logs de auditoria. Query: `action, userId, limit` | `audit:view` |

### Relatórios — parâmetros

- `type`: `movimentacoes`, `por-produto`, `por-om`, `por-usuario`, `por-local`,
  `vencidos`, `a-vencer`, `restritos`
- `period`: `diario`, `semanal`, `mensal`, `anual` (ou use `from`/`to`)
- `format`: `json` (padrão), `pdf`, `excel`, `csv`

## Matriz de Permissões (RBAC)

| Permissão | Admin | Supervisor | Operador | Consulta |
|---|:---:|:---:|:---:|:---:|
| dashboard:view | ✅ | ✅ | ✅ | ✅ |
| product:view | ✅ | ✅ | ✅ | ✅ |
| product:create/update/delete | ✅ | parcial | — | — |
| movement:view | ✅ | ✅ | ✅ | ✅ |
| movement:create | ✅ | ✅ | ✅ | — |
| restricted:approve | ✅ | ✅ | — | — |
| stock:manage | ✅ | — | — | — |
| report:export | ✅ | ✅ | — | — |
| user:manage | ✅ | — | — | — |
| audit:view | ✅ | ✅ | — | — |
