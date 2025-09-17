# DGK Restaurante

Aplicação Next.js para gerenciamento do cardápio de um restaurante integrada ao Back4App e com consulta de clima via Open-Meteo. O projeto não utiliza CSS externo e foi desenvolvido integralmente em JavaScript, focando na funcionalidade e na interação direta com a API Parse.

## Funcionalidades

- CRUD completo de pratos utilizando a classe `MenuItem` no Back4App (Parse Server).
- Formulário dinâmico para cadastro e edição, com validações básicas e suporte a disponibilidade do prato.
- Lista filtrável de pratos com busca por nome ou descrição.
- Consulta em tempo real da condição climática em cidades brasileiras (São Paulo, Rio de Janeiro e Salvador) consumindo a API pública Open-Meteo.
- Feedback imediato das operações de criação, atualização, remoção e carregamento.

## Pré-requisitos

- Node.js 18 ou superior.
- NPM 9 ou superior.

## Configuração

Crie um arquivo `.env.local` na raiz do projeto caso deseje substituir as credenciais padrão fornecidas. Os valores abaixo já são preenchidos com as chaves disponibilizadas para este desafio.

```env
NEXT_PUBLIC_PARSE_APP_ID=VXY7L2vhMJd5FlohOKs8m4LTS9N9a2IbdCTtPrlM
NEXT_PUBLIC_PARSE_CLIENT_KEY=zQrntobRZgMVspU7J7lk728NEytCVkcJ90pfjSb9
NEXT_PUBLIC_PARSE_SERVER_URL=https://parseapi.back4app.com/
```

## Scripts disponíveis

- `npm run dev`: inicia o servidor de desenvolvimento em `http://localhost:3000`.
- `npm run build`: cria a versão de produção.
- `npm start`: executa a build de produção.
- `npm run lint`: executa as verificações de lint do Next.js.

## Execução

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o ambiente de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Acesse `http://localhost:3000` no navegador para utilizar o sistema.

O formulário de pratos realiza as operações diretamente no Back4App, refletindo as alterações em tempo real no cardápio exibido.
