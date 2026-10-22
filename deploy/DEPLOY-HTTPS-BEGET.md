# PROTOCOL LMS → HTTPS на Beget VPS

Цель: сайт открывается по `https://ваш-домен` с зелёным замком, PocketBase работает
на том же домене (через nginx), поэтому нет ни CORS, ни «mixed content».

Схема: браузер → **nginx (HTTPS, 443)** → отдаёт статику фронтенда, а запросы
`/api/` и `/_/` проксирует в **PocketBase (127.0.0.1:8090)**.

Ниже — по шагам. Всё выполняется по SSH под root. Замените `lms.example.ru`
на свой домен, а IP — на IP вашего VPS.

---

## 1. Домен → VPS (DNS в панели Beget)

1. В панели Beget откройте раздел **DNS** вашего домена.
2. Добавьте/проверьте A-запись:
   - `lms.example.ru` (или `@` для корня) → **IP вашего VPS**.
3. Подождите обновления DNS (обычно минуты, максимум пара часов). Проверка:
   ```bash
   ping lms.example.ru      # должен отвечать IP вашего VPS
   ```

## 2. Установка nginx и certbot на VPS

```bash
apt update
apt install -y nginx certbot python3-certbot-nginx
```

## 3. PocketBase как сервис

```bash
mkdir -p /opt/pocketbase
# загрузите сюда бинарник pocketbase + папки pb_migrations, pb_hooks, pb_data
# (перенесите с вашего текущего сервера или скачайте pocketbase заново и примените миграции)

# юнит из репозитория:
cp deploy/pocketbase.service /etc/systemd/system/pocketbase.service
chown -R www-data:www-data /opt/pocketbase
systemctl daemon-reload
systemctl enable --now pocketbase
systemctl status pocketbase          # active (running)
```

PocketBase теперь слушает только `127.0.0.1:8090` — наружу его отдаст nginx.

## 4. Сборка и загрузка фронтенда

На своём компьютере (в проекте) укажите адрес бэкенда = **сам домен** и соберите:

```bash
# .env в корне проекта
VITE_POCKETBASE_URL=https://lms.example.ru
```
```bash
npm install
npm run build          # получится папка dist/
```

Загрузите содержимое `dist/` на VPS в `/var/www/protocol-lms/dist`
(через scp/SFTP/панель):

```bash
# пример через scp с локальной машины
scp -r dist/* root@IP_VPS:/var/www/protocol-lms/dist/
```

> Почему `VITE_POCKETBASE_URL = https://lms.example.ru`, а не `:8090`?
> Потому что фронт и API теперь на одном домене: SDK PocketBase будет обращаться
> к `https://lms.example.ru/api/...`, а nginx перенаправит это в PocketBase.
> Так исчезают и «mixed content», и CORS.

## 5. Конфиг nginx

```bash
cp deploy/nginx-protocol-lms.conf /etc/nginx/sites-available/protocol-lms.conf
# ВАЖНО: замените в файле lms.example.ru на ваш домен
ln -s /etc/nginx/sites-available/protocol-lms.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default     # убрать заглушку nginx (по желанию)
nginx -t                                    # syntax is ok
systemctl reload nginx
```

Сейчас сайт уже открывается по `http://lms.example.ru` (без замка). Дальше — HTTPS.

## 6. Бесплатный HTTPS-сертификат (Let's Encrypt)

```bash
certbot --nginx -d lms.example.ru
```

Certbot сам:
- получит сертификат,
- впишет в конфиг nginx блок `listen 443 ssl` и пути к сертификату,
- предложит включить редирект с HTTP на HTTPS — **выберите «2» (Redirect)**.

Проверка автопродления (сертификат живёт 90 дней, продлевается сам):
```bash
certbot renew --dry-run
```

## 7. Настройка PocketBase под прокси

В админке `https://lms.example.ru/_/` → **Settings → Application**:
- **Application URL**: `https://lms.example.ru`

(Опционально, для корректного определения IP за прокси —
Settings → указать доверенный заголовок `X-Forwarded-For`.)

## Готово

Откройте `https://lms.example.ru` — замок должен быть зелёным, вход, курсы,
сдача файлов и проверка работают на HTTPS.

---

## Частые проблемы

- **Замок серый / «небезопасно»** — где-то в коде остался `http://…:8090`.
  Проверьте `.env` (`VITE_POCKETBASE_URL=https://lms.example.ru`) и **пересоберите**
  фронт (`npm run build`), заново залейте `dist/`.
- **Файлы не загружаются (413)** — увеличьте `client_max_body_size` в конфиге nginx
  (уже стоит 40M) и `reload nginx`.
- **Realtime/подписки не приходят** — проверьте, что в `location /api/` стоит
  `proxy_buffering off;` (уже есть в конфиге).
- **502 Bad Gateway** — не запущен PocketBase: `systemctl status pocketbase`,
  `journalctl -u pocketbase -f`.
- **certbot: «DNS problem»** — A-запись ещё не обновилась или указывает не на этот VPS.

---

## Альтернатива без nginx (проще, но с нюансом)

PocketBase умеет сам раздавать статику из папки `pb_public/` и получать
Let's Encrypt автоматически:

```bash
# положить собранный dist в pb_public
cp -r dist/* /opt/pocketbase/pb_public/
# запуск со встроенным HTTPS (порты 80/443 должны быть свободны)
/opt/pocketbase/pocketbase serve --http=0.0.0.0:80 --https=0.0.0.0:443
```
При этом `VITE_POCKETBASE_URL` тоже = `https://lms.example.ru`.
Минус: для «глубоких» ссылок SPA (например `/app/courses`) может понадобиться
fallback на `index.html` — nginx-вариант из основной инструкции надёжнее.
