#!/bin/sh
# ============================================================
# RDO Digital - Backup automático do banco de dados
# Uso: agende via cron, ex.:  0 2 * * *  /app/scripts/backup.sh
# ============================================================
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/rdo_digital_$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "▶ Gerando backup em $FILE ..."
pg_dump "$DATABASE_URL" | gzip > "$FILE"

echo "▶ Removendo backups com mais de $RETENTION_DAYS dias..."
find "$BACKUP_DIR" -name 'rdo_digital_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

echo "✅ Backup concluído: $FILE"
