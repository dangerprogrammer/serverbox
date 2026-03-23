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

Se quiser trocar o nome do arquivo local, use `DB_FILENAME` no `.env.local`.

## Estrutura inicial do dominio

- `Administrator`: administrador que cria planos e gerencia condominios
- `Plan`: catalogo dos planos vendidos
- `Condominium`: dados do condominio cliente
- `CondominiumPlan`: vinculo entre condominio e planos disponiveis

## Endpoints iniciais

- `GET /api/administradores`
- `POST /api/administradores`
- `GET /api/plans`
- `POST /api/plans`
- `GET /api/condominios`
- `POST /api/condominios`

Exemplo de criacao de condominio:

```bash
curl -X POST http://localhost:3000/api/condominios \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Condominio Parque Central\",\"city\":\"Sao Paulo\",\"state\":\"SP\",\"courts\":2,\"activeResidents\":180,\"adminEmail\":\"admin@serverbox.local\",\"includeDefaultPlans\":true}"
```
