# Modelagem do Banco de Dados — RDO Digital

Banco relacional **PostgreSQL**, modelado com **Prisma ORM**. O script SQL
completo está em [`docs/sql/schema.sql`](./sql/schema.sql) (gerado a partir do
schema Prisma via `prisma migrate`).

## 1. Diagrama de Entidades e Relacionamentos (ER)

```mermaid
erDiagram
    USER ||--o{ MOVEMENT : "responsável"
    USER ||--o{ RESTRICTED_AUTHORIZATION : "solicita"
    USER ||--o{ RESTRICTED_AUTHORIZATION : "autoriza"
    USER ||--o{ AUDIT_LOG : "gera"
    USER ||--o{ PRODUCT : "cadastra"
    USER }o--|| OM : "pertence"

    OM ||--o{ MOVEMENT : "destino"
    OM ||--o{ USER : "lotação"

    CATEGORY ||--o{ PRODUCT : "classifica"
    STOCK ||--o{ PRODUCT : "armazena"
    STOCK ||--o{ MOVEMENT : "origem (QR)"

    PRODUCT ||--o{ MOVEMENT : "movimentado"
    PRODUCT ||--o{ RESTRICTED_AUTHORIZATION : "restrito"

    MOVEMENT ||--o| RESTRICTED_AUTHORIZATION : "gera"

    USER {
        string id PK
        string name
        string email UK
        string password_hash
        enum   role "ADMINISTRADOR|SUPERVISOR|OPERADOR|CONSULTA"
        string rank
        string registration
        bool   active
        datetime last_login_at
        string om_id FK
    }
    OM {
        string id PK
        string code UK
        string name
        bool   active
    }
    CATEGORY {
        string id PK
        string name UK
        string description
    }
    STOCK {
        string id PK
        string code UK "embutido no QR Code"
        string name
        string location
        bool   active
    }
    PRODUCT {
        string id PK
        string internal_code UK
        string name
        string description
        string brand
        string manufacturer
        enum   unit
        float  min_stock
        float  max_stock
        float  current_quantity
        string cas_number
        bool   is_chemical
        bool   is_restricted
        bool   requires_auth
        string fispq_pdf_url
        datetime expiration_date
        string batch_number
        string physical_location
        enum   status "ATIVO|INATIVO"
        string category_id FK
        string stock_id FK
        string created_by_id FK
    }
    MOVEMENT {
        string id PK
        enum   type "ENTRADA|SAIDA|RETORNO"
        datetime occurred_at "data+hora automáticas"
        enum   unit
        float  quantity
        string application_site
        string notes
        string batch_number
        datetime expiration_date
        float  previous_balance
        float  updated_balance
        string product_id FK
        string stock_id FK
        string om_id FK
        string responsible_id FK
    }
    RESTRICTED_AUTHORIZATION {
        string id PK
        enum   status "PENDENTE|APROVADO|REJEITADO"
        string reason "motivo da retirada"
        string digital_signature "assinatura do solicitante"
        datetime authorized_at "data+hora da autorização"
        string product_id FK
        string requester_id FK
        string approver_id FK "responsável autorizador"
        string movement_id FK UK
    }
    AUDIT_LOG {
        string id PK
        enum   action
        string entity
        string entity_id
        string description
        json   metadata
        string ip_address "registro de IP"
        string user_agent "dispositivo utilizado"
        datetime created_at
        string user_id FK
    }
```

## 2. Entidades

| Entidade | Descrição |
|---|---|
| **User** | Usuários do sistema com perfil RBAC (Administrador, Supervisor, Operador, Consulta). Senha sempre armazenada como hash bcrypt. |
| **Om** | Organização Militar — destino/contexto das movimentações. |
| **Category** | Categorias de produto (Solventes, Ácidos, etc.). |
| **Stock** | Estoque físico. Cada um possui um `code` único embutido no **QR Code** que leva à tela de movimentação `/m/{code}`. |
| **Product** | Cadastro completo do produto químico, incluindo flags de restrição, CAS, FISPQ, validade, lote, localização e níveis de estoque. |
| **Movement** | Registro imutável de cada movimentação (Entrada/Saída/Retorno) com saldo anterior e atualizado, data/hora automáticas, responsável, OM e local. |
| **RestrictedAuthorization** | Autorização obrigatória para retirada de produtos restritos: motivo, assinatura digital, autorizador e data/hora. Relação 1:1 com a movimentação gerada. |
| **AuditLog** | Trilha de auditoria de todas as ações (login, logout, CRUD, movimentação, aprovação, exportação), com IP e dispositivo. |

## 3. Regras de Integridade e Negócio

- **Saldo:** `Movement.previous_balance` e `updated_balance` são gravados em cada
  movimentação; `Product.current_quantity` é atualizado **atomicamente** dentro
  de uma transação. Saídas não podem resultar em saldo negativo.
- **Produtos restritos:** uma `SAIDA` de produto com `is_restricted` ou
  `requires_auth` exige um bloco de autorização válido (autorizador deve ser
  Supervisor ou Administrador ativo).
- **Exclusão segura:** produtos com histórico de movimentação são **inativados**
  (status `INATIVO`), nunca apagados — preserva a rastreabilidade.
- **Índices:** criados em campos de filtro frequentes (`role`, `status`,
  `is_restricted`, `expiration_date`, `type`, `occurred_at`, `product_id`,
  `om_id`, `action`, `created_at`).

## 4. Enums

- `UserRole`: ADMINISTRADOR, SUPERVISOR, OPERADOR, CONSULTA
- `MovementType`: ENTRADA, SAIDA, RETORNO
- `UnitOfMeasure`: UN, L, ML, KG, G, MG, M3, CX, GL, FR
- `ProductStatus`: ATIVO, INATIVO
- `AuthorizationStatus`: PENDENTE, APROVADO, REJEITADO
- `AuditAction`: LOGIN, LOGOUT, LOGIN_FALHA, CRIACAO, ALTERACAO, EXCLUSAO, MOVIMENTACAO, APROVACAO, REJEICAO, EXPORTACAO
