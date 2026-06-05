# Wireframes — RDO Digital

Esboços em baixa fidelidade das telas principais. A interface segue um layout
estilo **ERP** (sidebar + topbar), responsivo (desktop, tablet e celular) com
**tema claro e escuro**.

## 1. Login

```
┌───────────────────────────────────────────┐
│             [ RDO ]  RDO Digital            │
│        Gestão de Estoque Químico            │
│   ┌─────────────────────────────────────┐  │
│   │ E-mail   [______________________]   │  │
│   │ Senha    [______________________]   │  │
│   │           [      Entrar      ]      │  │
│   │  Acesso restrito · ações auditadas  │  │
│   └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

## 2. Dashboard

```
┌──────────┬────────────────────────────────────────────────┐
│ SIDEBAR  │  Dashboard                       🌙  Usuário ▾  │
│ ▸ Dash   │ ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐      │
│ ▸ Produt │ │Prod ││Quím ││Restr││Venc.││Venci││Baixo│      │
│ ▸ Movim  │ │  42 ││  30 ││   6 ││   3 ││   2 ││   4 │      │
│ ▸ QR     │ └─────┘└─────┘└─────┘└─────┘└─────┘└─────┘      │
│ ▸ Relat  │ ┌──────────────┐ ┌──────────────┐               │
│ ▸ Usuár  │ │ Consumo/tempo│ │ Top produtos │               │
│ ▸ Audit  │ │   (linha)    │ │   (barras)   │               │
│          │ └──────────────┘ └──────────────┘               │
│          │ ┌──────────────┐ ┌──────────────┐               │
│          │ │ Por OM (pizza)│ │ Por local    │               │
│          │ └──────────────┘ └──────────────┘               │
│          │ Últimas Movimentações [tabela]                  │
└──────────┴────────────────────────────────────────────────┘
```

## 3. Cadastro de Produtos

```
┌ Produtos ──────────────────────── [+ Novo Produto] ┐
│ [buscar...]                                          │
│ Código │ Produto │ Categoria │ Saldo │ Validade │... │
│ QM-0001│ Álcool  │ Solventes │ 150 L │ 01/27   │✏️🗑 │
│ ...                                                  │
└──────────────────────────────────────────────────────┘
  Modal de cadastro (grade de campos):
  Código* | Nome* | Categoria | Marca | Fabricante | CAS
  Unidade | Est.Mín | Est.Máx | Qtd Atual | Lote | Validade
  Localização | Estoque(QR) | Status | FISPQ(PDF) [upload]
  Descrição [textarea]
  ☐ Químico   ☐ Restrito   ☐ Necessita autorização
```

## 4. Tela de Movimentação (acessada pelo QR Code) — `/m/{code}`

```
┌──────────────────────────────────────────┐
│ RDO Digital — Movimentação de Estoque     │
│ Almoxarifado Central — Galpão A           │
│ 📍 Materiais Perigosos · EST-A01          │
├──────────────────────────────────────────┤
│ [⬇️ Entrada] [⬆️ Saída] [↩️ Retorno]       │
│ Produto:  [ Álcool 70% (150 L)      ▾ ]   │
│ Saldo atual: 150 L                        │
│ Quantidade* [____]   OM [______ ▾]        │
│ Local de aplicação [______________]       │
│ Lote [_____]  Validade [__/__/__]         │
│ Observações [____________________]        │
│ ┌─ 🔒 Restrito (aparece p/ restritos) ─┐  │
│ │ Autorizador* [Supervisor ▾]          │  │
│ │ Motivo* [_______]  Assinatura* [___] │  │
│ └──────────────────────────────────────┘  │
│      [   Registrar Movimentação   ]       │
└──────────────────────────────────────────┘
```

## 5. Estoques & QR Codes

```
┌ Estoques & QR Codes ──── [📷 Ler QR] [+ Novo Estoque] ┐
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│ │ [QRCODE] │ │ [QRCODE] │ │ [QRCODE] │                │
│ │ Galpão A │ │ Galpão B │ │  ...     │                │
│ │ EST-A01  │ │ EST-B02  │ │          │                │
│ │ Abrir|Imp│ │ Abrir|Imp│ │          │                │
│ └──────────┘ └──────────┘ └──────────┘                │
└────────────────────────────────────────────────────────┘
```

## 6. Relatórios

```
┌ Relatórios ────────────────────────────────────────┐
│ Tipo [▾] Período [▾] De [__] Até [__]              │
│ [🔍 Visualizar] [📄 PDF] [📊 Excel] [📋 CSV]        │
│ ───────────────────────────────────────────────    │
│ Resultado (tabela paginável)                        │
└─────────────────────────────────────────────────────┘
```

## 7. Usuários e Auditoria

```
┌ Usuários ───────────────── [+ Novo] ┐  ┌ Auditoria ──────────────┐
│ Nome │ E-mail │ Perfil │ Status │... │  │ [filtro de ação ▾]      │
│ ...                                  │  │ Data│Ação│Usuário│IP│Disp│
└──────────────────────────────────────┘  └─────────────────────────┘
```
