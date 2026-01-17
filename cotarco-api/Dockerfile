# Usamos PHP 8.3 para igualar a produção do cPanel
FROM php:8.3-fpm

# Instala dependências do sistema e extensões PHP necessárias para Laravel
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Instala o Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Define o diretório de trabalho
WORKDIR /var/www

# Essa imagem serve principalmente para garantir que o ambiente
# onde rodamos os testes (no GitHub Actions) é igual à produção (PHP 8.2).
