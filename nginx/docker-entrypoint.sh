#!/bin/bash
set -e

# Definir valores padrão para variáveis de ambiente se não foram fornecidas
: ${NGINX_HOST:=localhost}
: ${BACKEND_HOST:=backend:3000}
: ${FRONTEND_HOST:=frontend:5173}

echo "Configurando Nginx com:"
echo "NGINX_HOST=$NGINX_HOST"
echo "BACKEND_HOST=$BACKEND_HOST"
echo "FRONTEND_HOST=$FRONTEND_HOST"

# Substituir variáveis no template
envsubst '${NGINX_HOST} ${BACKEND_HOST} ${FRONTEND_HOST}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Iniciar o nginx com os argumentos fornecidos
exec "$@"