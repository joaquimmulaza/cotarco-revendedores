# Cotarco API - Backend

Backend Laravel para o sistema de parceiros Cotarco.

## Configuração

### Pré-requisitos
- PHP 8.1 ou superior
- Composer
- SQLite (ou MySQL/PostgreSQL)

### Instalação de dependências
```bash
composer install
```

### Configuração do ambiente
1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Gere a chave da aplicação:
```bash
php artisan key:generate
```

3. Configure o banco de dados no arquivo `.env`:
```env
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

4. Execute as migrações:
```bash
php artisan migrate
```

5. Execute os seeders para criar dados iniciais:
```bash
php artisan db:seed
```

## Execução

### Desenvolvimento
```bash
php artisan serve --host=0.0.0.0 --port=8000
```

A API estará disponível em `http://localhost:8000`

### Produção
Para produção, configure um servidor web (Apache/Nginx) apontando para o diretório `public/`.

## Rotas da API

### Autenticação
- `POST /api/register` - Registro de revendedores
- `POST /api/login` - Login de revendedores
- `POST /api/admin/login` - Login de administradores
- `POST /api/logout` - Logout (requer autenticação)

### Administração
- `GET /api/admin/revendedores/pending` - Listar revendedores pendentes
- `POST /api/admin/revendedores/{user}/approve` - Aprovar revendedor
- `POST /api/admin/revendedores/{user}/reject` - Rejeitar revendedor

## Configuração de CORS

O backend está configurado para aceitar requisições do frontend. A configuração está em `config/cors.php`:

```php
'allowed_origins' => ['http://localhost:3000', 'http://localhost:5173'],
'supports_credentials' => true,
```

## Autenticação

O sistema usa Laravel Sanctum para autenticação via tokens. Os tokens são retornados após login bem-sucedido e devem ser incluídos no header `Authorization: Bearer {token}` das requisições autenticadas.

## Estrutura do projeto

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   │   ├── AuthController.php
│   │   │   └── RegisterController.php
│   │   └── Admin/
│   │       └── AdminController.php
│   └── Middleware/
├── Models/
│   ├── User.php
│   └── RevendedorProfile.php
├── Mail/
│   ├── RevendedorApproved.php
│   └── RevendedorRejected.php
└── Providers/
    └── AppServiceProvider.php
```

## Funcionalidades implementadas

- ✅ Sistema de autenticação com Sanctum
- ✅ Registro de revendedores
- ✅ Login de revendedores e administradores
- ✅ Sistema de aprovação de revendedores
- ✅ Envio de emails de notificação
- ✅ Validação de dados
- ✅ Tratamento de erros
- ✅ Configuração de CORS

## Resolução de problemas

### Erro de chave da aplicação
Se receber erro sobre chave da aplicação, execute:
```bash
php artisan key:generate
```

### Erro de banco de dados
1. Verifique se o arquivo `.env` está configurado corretamente
2. Execute as migrações: `php artisan migrate:fresh`
3. Execute os seeders: `php artisan db:seed`

### Erro de CORS
1. Verifique se o frontend está rodando na porta configurada
2. Verifique a configuração em `config/cors.php`
3. Limpe o cache: `php artisan config:clear`

### Erro de permissões
1. Verifique se o diretório `storage/` tem permissões de escrita
2. Execute: `chmod -R 775 storage/ bootstrap/cache/`

## Desenvolvimento

### Adicionando novas rotas
1. Adicione a rota em `routes/api.php`
2. Crie o controller correspondente
3. Implemente a lógica de negócio

### Adicionando novos modelos
1. Crie o modelo em `app/Models/`
2. Crie a migração: `php artisan make:migration create_table_name`
3. Execute a migração: `php artisan migrate`

### Testes
Execute os testes com:
```bash
php artisan test
```

## Logs

Os logs da aplicação estão em `storage/logs/laravel.log`. Para desenvolvimento, configure `APP_DEBUG=true` no arquivo `.env`.
