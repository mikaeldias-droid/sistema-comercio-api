# API - Sistema Web para Organização de Pequeno Comércio

Backend (API) do Projeto Integrador da UESPI. O frontend fica em https://github.com/mikaeldias-droid/sistema-comercio

## Grupo

- Edinael de Carvalho Nunes
- Eliade Dias Pereira
- Juana Elen de Sousa e Silva
- Manoel Alves Vieira Junior
- Mikael Dias Plácido

## Tecnologias utilizadas

- Node.js
- Express
- SQLite (better-sqlite3)
- bcryptjs
- CORS

## Como rodar

```bash
npm install
npm run dev
```

A API sobe em http://localhost:3000

## Login inicial

Ao iniciar a API pela primeira vez, é criado automaticamente o usuário administrador:
- **Login:** `admin`
- **Senha:** `123456`


## Rotas da API

### Autenticação
- `POST /api/login` - Autentica usuário com login e senha (retorna dados sem a senha)

### Usuários
- `GET /api/usuarios` - Lista todos os usuários cadastrados (sem a senha)
- `POST /api/usuarios` - Cadastra um novo usuário (`nome`, `login`, `senha`, `perfil`)
- `PUT /api/usuarios/:id` - Atualiza os dados de um usuário existente
- `DELETE /api/usuarios/:id` - Exclui um usuário por ID

### Produtos
- `GET /api/produtos` - Lista todos os produtos
- `GET /api/produtos/:id` - Busca detalhes de um produto por ID
- `POST /api/produtos` - Cadastra um novo produto (`nome`, `categoria`, `preco`, `estoque`, `observacao`)
- `PUT /api/produtos/:id` - Atualiza um produto por ID
- `DELETE /api/produtos/:id` - Exclui um produto por ID

### Controle de Estoque
- `GET /api/estoque` - Lista os itens do estoque com o campo `situacao` ("Estoque baixo" ou "Disponível")
- `POST /api/estoque` - Cadastra um item de estoque (`produto`, `quantidade`, `minima`, `observacao`)
- `PUT /api/estoque/:id` - Atualiza quantidade e informações de um item no estoque
- `DELETE /api/estoque/:id` - Exclui um item do estoque por ID

## Gerenciamento do projeto

Trello: https://trello.com/b/kXcDqxvR/sistema-web-pequeno-comercio
