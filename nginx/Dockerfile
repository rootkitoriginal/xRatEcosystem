FROM nginx:alpine

# Instalar ferramentas necessárias para usar o envsubst
RUN apk add --no-cache bash

# Copiar configuração como template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Script de inicialização para substituir variáveis de ambiente
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Definir script de entrada
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
