#!/usr/bin/env bash
# PROTOCOL — резервное копирование базы PocketBase.
# Кладёт архив pb_data в /opt/backups и хранит последние 14 копий.
#
# Установка на сервере:
#   cp deploy/backup-pb.sh /opt/backup-pb.sh && chmod +x /opt/backup-pb.sh
# Ежедневный бэкап в 03:30 (crontab -e):
#   30 3 * * * /opt/backup-pb.sh >> /var/log/pb-backup.log 2>&1

set -euo pipefail

PB_DATA="/root/pb_data"       # где лежит база (см. WorkingDirectory сервиса)
DEST="/opt/backups"
KEEP=14

mkdir -p "$DEST"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$DEST/pb_data-$STAMP.tar.gz"

# консистентный бэкап: на время архивирования останавливаем сервис
systemctl stop pocketbase
tar -czf "$ARCHIVE" -C "$(dirname "$PB_DATA")" "$(basename "$PB_DATA")"
systemctl start pocketbase

echo "backup: $ARCHIVE"

# чистим старые копии, оставляем последние $KEEP
ls -1t "$DEST"/pb_data-*.tar.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f
