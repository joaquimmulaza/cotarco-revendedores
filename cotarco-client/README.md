# Cotarco Client - Frontend

Frontend React para o sistema de revendedores Cotarco.

## Configuração

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação de dependências
```bash
npm install
```

## Execução

### Desenvolvimento
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

### Build de produção
```bash
npm run build
```

### Preview da build
```bash
npm run preview
```

## Configuração da API

O frontend está configurado para se conectar ao backend Laravel através de um proxy do Vite.

### Configuração do proxy
O arquivo `vite.config.js` está configurado para redirecionar todas as requisições `/api/*` para `http://localhost:8000/api/*`.

### Variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="Cotarco Revendedores"
```

## Estrutura do projeto

```
src/
├── components/          # Componentes reutilizáveis
├── config/             # Configurações da aplicação
├── hooks/              # Custom hooks
├── layouts/            # Layouts das páginas
├── pages/              # Páginas da aplicação
├── services/           # Serviços de API
└── assets/             # Recursos estáticos
```

## Funcionalidades implementadas

- ✅ Registro de revendedores
- ✅ Login de revendedores
- ✅ Login de administradores
- ✅ Sistema de autenticação com tokens
- ✅ Tratamento de erros
- ✅ Estados de loading
- ✅ Navegação entre páginas
- ✅ Configuração centralizada

## Conexão com o backend

O frontend se conecta ao backend Laravel através das seguintes rotas:

- `POST /api/register` - Registro de revendedores
- `POST /api/login` - Login de revendedores
- `POST /api/admin/login` - Login de administradores
- `POST /api/logout` - Logout

## Resolução de problemas

### Erro de conexão com a API
1. Verifique se o backend Laravel está rodando em `http://localhost:8000`
2. Verifique se o proxy do Vite está configurado corretamente
3. Verifique se as rotas da API estão funcionando

### Erro de CORS
O backend está configurado para aceitar requisições do frontend. Se houver problemas de CORS, verifique a configuração em `cotarco-api/config/cors.php`.

## Desenvolvimento

### Adicionando novas páginas
1. Crie o componente da página em `src/pages/`
2. Adicione a rota em `src/App.jsx`
3. Adicione a URL da rota em `src/config/config.js`

### Adicionando novos serviços de API
1. Crie o serviço em `src/services/`
2. Importe e use nos componentes necessários

### Estilização
O projeto usa Tailwind CSS para estilização. Consulte a [documentação oficial](https://tailwindcss.com/) para mais informações.
