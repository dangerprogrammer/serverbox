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
- 3 planos padrao: basico, intermediario e premium
- 1 plano personalizado de exemplo
- 3 condominios de exemplo
- vinculos entre condominios e os planos disponiveis para cada um
- pagamentos seed ja confirmados, liberando saldo inicial de bolinhas

Se quiser trocar o nome do arquivo local, use `DB_FILENAME` no `.env.local`.

## Estrutura inicial do dominio

- `Administrator`: administrador que cria planos e gerencia condominios
- `Plan`: catalogo dos planos vendidos
- `Condominium`: dados do condominio cliente
- `CondominiumPlan`: vinculo entre condominio e planos disponiveis
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

1. Cria um pagamento pendente para um condominio
2. Abre a cobranca PIX com QR Code e copia e cola
3. O backend so libera o credito quando a AbacatePay confirma o pagamento
4. O sistema gera um credito em `BallInventoryMovement`
5. O saldo de bolinhas fica visivel na dashboard

Exemplo de criacao de condominio:

```bash
curl -X POST http://localhost:3000/api/condominios \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Condominio Parque Central\",\"city\":\"Sao Paulo\",\"state\":\"SP\",\"courts\":2,\"activeResidents\":180,\"adminEmail\":\"admin@serverbox.local\",\"includeDefaultPlans\":true}"
```

Exemplo de criacao de pagamento:

```bash
curl -X POST http://localhost:3000/api/pagamentos \
  -H "Content-Type: application/json" \
  -d "{\"condominiumId\":\"SEU_CONDOMINIUM_ID\",\"planId\":\"SEU_PLAN_ID\",\"method\":\"pix\"}"
```

## Configuracao AbacatePay

O fluxo de checkout agora nasce diretamente na AbacatePay. Para criar cobrancas
PIX, configure no `.env.local`:

```bash
ABACATEPAY_API_KEY=sua_chave
ABACATEPAY_WEBHOOK_SECRET=seu_segredo
ABACATEPAY_PUBLIC_WEBHOOK_KEY=sua_chave_publica_do_webhook
```

Sem `ABACATEPAY_API_KEY`, a API passa a recusar a criacao de novas cobrancas
com `503`.
