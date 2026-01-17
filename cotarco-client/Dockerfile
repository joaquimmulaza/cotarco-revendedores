# Estágio de Build
# Usamos uma imagem Node.js oficial e específica (versão 20) para garantir consistência.
# Isso evita problemas onde "na minha máquina é Node 18, no servidor é 14".
FROM node:20-alpine as build

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências primeiro (para aproveitar o cache do Docker)
COPY package*.json ./

# Instala as dependências de forma limpa (ci é melhor que install para CI/CD)
RUN npm ci

# Copia o resto do código fonte
COPY . .

# Executa o build (gera a pasta 'dist')
RUN npm run build

# Estágio de Produção (Opcional, mas bom para testar localmente "como em produção")
# Usamos Nginx para servir os arquivos estáticos gerados
FROM nginx:alpine

# Copia os arquivos construídos do estágio anterior para a pasta do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expõe a porta 80
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]
