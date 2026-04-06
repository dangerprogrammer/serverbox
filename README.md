## ServerBox

Base inicial em Next.js 16 para vender bolinhas de tenis para condominios.
O projeto usa TypeORM no servidor com banco SQLite local para desenvolvimento.

## Stack

- Next.js 16 com App Router
- React 19
- TypeORM
- better-sqlite3

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Suba o projeto:

```bash
npm run dev
```

3. Abra `http://localhost:3000`.

Na primeira execucao, o banco e criado automaticamente em `data/serverbox.sqlite` e recebe seed com:

- 1 administrador inicial

Se quiser trocar o nome do arquivo local, use `DB_FILENAME` no `.env.local`.

## Estrutura inicial do dominio

- `Administrator`: administrador que cria planos e gerencia condominios
- `Plan`: plano comercial pertencente a um condominio
- `Condominium`: dados do condominio cliente
- `CondominiumPayment`: pagamento de um plano para um condominio
- `BallInventoryMovement`: livro-caixa de credito e consumo de bolinhas

## Endpoints iniciais

- `GET /api/administradores`
- `POST /api/administradores`
- `GET /api/plans`
- `POST /api/plans`
- `GET /api/condominios`
- `POST /api/condominios`
- `GET /api/pagamentos`
- `POST /api/pagamentos`
- `GET /api/pagamentos/:paymentId`
- `POST /api/pagamentos/:paymentId`

## Dashboard

- `GET /dashboard`: tela administrativa com saldo de bolinhas e cobrancas PIX em aberto

## Checkout PIX

- `GET /pagamentos/:paymentId`: tela da cobranca com QR Code, copia e cola e atualizacao automatica de status

Fluxo atual:

1. Cria um pagamento pendente para um plano de um condominio
2. Abre a cobranca PIX com QR Code e copia e cola
3. O backend so libera o credito quando a AbacatePay confirma o pagamento
4. O sistema gera um credito em `BallInventoryMovement`
5. O saldo de bolinhas fica visivel na dashboard

Exemplo de criacao de condominio:

```bash
curl -X POST http://localhost:3000/api/condominios \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Condominio Parque Central\",\"city\":\"Sao Paulo\",\"state\":\"SP\",\"courts\":2,\"activeResidents\":180,\"adminEmail\":\"admin@serverbox.local\"}"
```

Exemplo de criacao de plano dentro de um condominio:

```bash
curl -X POST http://localhost:3000/api/plans \
  -H "Content-Type: application/json" \
  -d "{\"condominiumId\":\"SEU_CONDOMINIUM_ID\",\"name\":\"Plano Quadra 1\",\"description\":\"Plano mensal da quadra principal\",\"monthlyBallAllowance\":48,\"monthlyPriceInCents\":14900,\"overagePriceInCents\":1390}"
```

Exemplo de criacao de pagamento:

```bash
curl -X POST http://localhost:3000/api/pagamentos \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"SEU_PLAN_ID\",\"method\":\"pix\"}"
```

## Configuracao AbacatePay

O fluxo de checkout agora nasce diretamente na AbacatePay. Para criar cobrancas
PIX, configure no `.env.local`:

```bash
ABACATEPAY_API_KEY=sua_chave
ABACATEPAY_WEBHOOK_SECRET=seu_segredo
ABACATEPAY_PUBLIC_WEBHOOK_KEY=sua_chave_publica_do_webhook
ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE=5511999999999
ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID=12345678909
```

Sem `ABACATEPAY_API_KEY`, a API passa a recusar a criacao de novas cobrancas
com `503`.

Como o dominio atual ainda nao cadastra telefone e documento por condominio, a
criacao da cobranca usa um contato padrao da AbacatePay vindo do ambiente.
