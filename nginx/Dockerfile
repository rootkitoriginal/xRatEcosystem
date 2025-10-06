FROM nginx:alpine

# Instalar ferramentas necessárias para usar o envsubst e openssl
RUN apk add --no-cache bash openssl

# Gerar certificados auto-assinados para HTTPS
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -newkey rsa:4096 -keyout /etc/nginx/ssl/key.pem -out /etc/nginx/ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=172.28.1.50"

# Copiar configuração como template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Script de inicialização para substituir variáveis de ambiente
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Definir script de entrada
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
