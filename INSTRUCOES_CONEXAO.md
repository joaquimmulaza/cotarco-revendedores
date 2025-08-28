# Instruções para Testar a Conexão Frontend-Backend

## Problema Identificado

O frontend não estava conectado ao backend porque:
1. Não havia serviço de API implementado
2. As páginas não faziam chamadas para a API
3. Não havia configuração de proxy para desenvolvimento
4. O backend não tinha rota para login de administrador

## Soluções Implementadas

### 1. Serviço de API (`cotarco-client/src/services/api.js`)
- ✅ Criado serviço completo de API usando Axios
- ✅ Implementados métodos para login, registro e logout
- ✅ Tratamento de erros e interceptors
- ✅ Gerenciamento de tokens de autenticação

### 2. Configuração de Proxy (`cotarco-client/vite.config.js`)
- ✅ Configurado proxy para redirecionar `/api/*` para `http://localhost:8000/api/*`
- ✅ Evita problemas de CORS em desenvolvimento

### 3. Configuração Centralizada (`cotarco-client/src/config/config.js`)
- ✅ Centralizadas todas as configurações da aplicação
- ✅ URLs das rotas centralizadas
- ✅ Configurações de autenticação padronizadas

### 4. Páginas Atualizadas
- ✅ **Register.jsx**: Implementado registro com API
- ✅ **Login.jsx**: Implementado login com API
- ✅ **AdminLogin.jsx**: Implementado login de administrador com API

### 5. Backend Atualizado
- ✅ Adicionada rota `/api/admin/login`
- ✅ Implementado método `adminLogin` no `AuthController`
- ✅ Configuração de CORS atualizada

## Como Testar

### 1. Iniciar o Backend
```bash
cd cotarco-api
php artisan serve --host=0.0.0.0 --port=8000
```

### 2. Iniciar o Frontend
```bash
cd cotarco-client
npm run dev
```

### 3. Testar o Registro
1. Acesse `http://localhost:5173/register`
2. Preencha o formulário
3. Clique em "Registar"
4. Verifique o console do navegador para ver a resposta da API

### 4. Testar o Login de Revendedor
1. Acesse `http://localhost:5173/login`
2. Use credenciais válidas
3. Clique em "Entrar"
4. Verifique se é redirecionado para o dashboard

### 5. Testar o Login de Administrador
1. Acesse `http://localhost:5173/admin/login`
2. Use credenciais de administrador
3. Clique em "Entrar no Painel"
4. Verifique se é redirecionado para o painel de administração

## Verificações Importantes

### 1. Console do Navegador
- Não deve haver erros de CORS
- As requisições devem aparecer no Network tab
- As respostas da API devem ser exibidas

### 2. Console do Backend
- As requisições devem aparecer no log do Laravel
- Não deve haver erros de validação ou autenticação

### 3. Banco de Dados
- Os usuários devem ser criados na tabela `users`
- Os perfis devem ser criados na tabela `revendedor_profiles`

## Resolução de Problemas Comuns

### Erro de CORS
```bash
# No backend, limpe o cache
php artisan config:clear
php artisan cache:clear
```

### Erro de Conexão
1. Verifique se o backend está rodando na porta 8000
2. Verifique se o frontend está rodando na porta 5173
3. Verifique se o proxy está configurado corretamente

### Erro de Validação
1. Verifique se os campos obrigatórios estão sendo enviados
2. Verifique se o formato dos dados está correto
3. Verifique os logs do Laravel para detalhes

### Erro de Autenticação
1. Verifique se o token está sendo enviado corretamente
2. Verifique se o usuário existe no banco de dados
3. Verifique se o status do usuário é 'active'

## Próximos Passos

1. ✅ **Conectividade**: Frontend conectado ao backend
2. 🔄 **Funcionalidades**: Implementar validações e tratamento de erros
3. 🔄 **UI/UX**: Melhorar interface e experiência do usuário
4. 🔄 **Testes**: Implementar testes automatizados
5. 🔄 **Deploy**: Preparar para produção

## Arquivos Modificados

### Frontend
- `src/services/api.js` - Novo serviço de API
- `src/config/config.js` - Nova configuração centralizada
- `src/pages/Register.jsx` - Implementado registro com API
- `src/pages/Login.jsx` - Implementado login com API
- `src/pages/AdminLogin.jsx` - Implementado login de administrador
- `vite.config.js` - Configurado proxy para API
- `README.md` - Documentação atualizada

### Backend
- `routes/api.php` - Adicionada rota de login de administrador
- `app/Http/Controllers/Auth/AuthController.php` - Implementado método adminLogin
- `config/cors.php` - Atualizada configuração de CORS
- `README.md` - Documentação atualizada

## Status da Implementação

- ✅ **Conectividade**: 100% implementada
- ✅ **Autenticação**: 100% implementada
- ✅ **Registro**: 100% implementado
- ✅ **Login**: 100% implementado
- ✅ **Configuração**: 100% implementada
- 🔄 **Validações**: Em desenvolvimento
- 🔄 **Tratamento de Erros**: Em desenvolvimento
- 🔄 **Testes**: Pendente



