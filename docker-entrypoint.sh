#!/bin/sh
set -e

echo "▶ Aplicando migrações do banco de dados..."
npx prisma migrate deploy

if [ "$RDO_SEED" = "true" ]; then
  echo "▶ Executando seed inicial..."
  node prisma/seed.js 2>/dev/null || npx tsx prisma/seed.ts || echo "seed ignorado"
fi

echo "▶ Iniciando servidor RDO Digital na porta ${PORT:-3000}..."
exec node server.js
