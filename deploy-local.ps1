# Script de Deploy Local Seguro (Cotarco)
# Este script substitui o GitHub Actions enquanto a conta estiver bloqueada.
# Ele usa o Docker Local para garantir que o build é limpo e seguro.

Write-Host "🚀 Iniciando Processo de Deploy Seguro..." -ForegroundColor Green

# --- Configuração ---
$ftpServer = Read-Host "Digite o Servidor FTP (ex: ftp.cotarco.com)"
$ftpUser = Read-Host "Digite o Usuário FTP"
$ftpPass = Read-Host "Digite a Senha FTP" -AsSecureString
$ftpPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($ftpPass))

# --- Frontend ---
# --- Frontend ---
Write-Host "`n📦 [1/4] Frontend: Construindo e Testando (Docker)..." -ForegroundColor Cyan

# Verificação de segurança: a pasta existe?
if (-not (Test-Path "./cotarco-client")) {
    Write-Error "Erro: A pasta './cotarco-client' nao foi encontrada no diretorio atual."
    exit 1
}

# Executa o build (Usando caminho absoluto para evitar erro de contexto no Docker)
$frontendPath = Resolve-Path "./cotarco-client"
docker build -t cotarco-client-build $frontendPath

if ($LASTEXITCODE -ne 0) { 
    Write-Warning "Falha no Build do Frontend (Codigo: $LASTEXITCODE)"
    exit 1 
}

# Verifica se a imagem foi realmente criada
$imageExists = docker images -q cotarco-client-build
if (-not $imageExists) { throw "A imagem 'cotarco-client-build' não foi encontrada após o build." }

Write-Host "📂 [2/4] Frontend: Extraindo arquivos..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "./deploy_output/distribuidores" | Out-Null
# Cria container temporário para copiar os arquivos
$id = docker create cotarco-client-build
# ATENÇÃO: No Dockerfile, o estágio final é Nginx, então os arquivos estão em /usr/share/nginx/html
docker cp "$id`:/usr/share/nginx/html/." "./deploy_output/distribuidores"
docker rm -v $id

# --- Backend ---
Write-Host "`n🐘 [3/4] API: Testando e Preparando (Docker)..." -ForegroundColor Cyan

# 1. Compilar Imagem de Base
docker build -t cotarco-api-base ./cotarco-api

# 2. Rodar Testes (Montando o código local)
# Usamos -v ${PWD}/cotarco-api:/var/www para que o container veja o código
docker run --rm -v "${PWD}/cotarco-api:/var/www" cotarco-api-base bash -c "cp .env.example .env && php artisan key:generate && php artisan test"
if ($LASTEXITCODE -ne 0) { Write-Error "❌ TESTES DA API FALHARAM! Abortando deploy."; exit }

Write-Host "🛠️  [3.5/4] API: Gerando pacote de produção..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "./deploy_output/api" | Out-Null
# Copia todo o código fonte para o output primeiro
Copy-Item -Path "./cotarco-api/*" -Destination "./deploy_output/api" -Recurse -Force

# Agora usamos o Docker para rodar o 'composer install --no-dev' DENTRO da pasta de output
# Isso garante que a pasta vendor seja gerada pelo Linux (compatível com cPanel) e não pelo Windows
docker run --rm -v "${PWD}/deploy_output/api:/var/www" cotarco-api-base composer install --prefer-dist --no-progress --no-interaction --no-dev --optimize-autoloader

Write-Host "🧹 Limpando arquivos desnecessários..."
Remove-Item -Path "./deploy_output/api/tests" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "./deploy_output/api/.git" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "./deploy_output/api/.env" -Force -ErrorAction SilentlyContinue # Remove .env local por segurança

Write-Host "`n📦 [4/4] Compactando arquivos para upload rápido..." -ForegroundColor Cyan

# Define os caminhos dos arquivos ZIP
$zipFrontend = "./deploy_output/distribuidores.zip"
$zipBackend = "./deploy_output/api.zip"

# Remove pacotes antigos se existirem
if (Test-Path $zipFrontend) { Remove-Item $zipFrontend }
if (Test-Path $zipBackend) { Remove-Item $zipBackend }

# Compacta o Frontend
Write-Host "Zippando Frontend..."
Compress-Archive -Path "./deploy_output/distribuidores/*" -DestinationPath $zipFrontend -Force

# Compacta a API
Write-Host "Zippando API (isso pode levar um minuto)..."
Compress-Archive -Path "./deploy_output/api/*" -DestinationPath $zipBackend -Force

Write-Host "✅ Arquivos compactados com sucesso!" -ForegroundColor Green

Write-Host "`n✅ BUILD E TESTES CONCLUÍDOS COM SUCESSO!" -ForegroundColor Green
Write-Host "Os arquivos seguros para produção estão na pasta: .\deploy_output\distribuidores"
Write-Host "Infelizmente, para fazer o upload automático via script local precisaríamos instalar ferramentas de FTP extras (como WinSCP)."
Write-Host "👉 1. Arraste 'deploy_output/distribuidores' para 'public_html/distribuidores'."
Write-Host "👉 2. Arraste 'deploy_output/api' para 'public_html/api' (Pode demorar um pouco pois contém milhares de arquivos vendor)."

Pause
