# Balisha — публикация сайта

Проект Cloudflare Pages `balisha` подключён к GitHub-репозиторию `niibet34-sys/Balisha`.

- Ветка публикации: `main`
- Команда сборки: `npm run build`
- Папка результата: `dist`
- Статические файлы, доступные для редактирования: `site/`
- Предварительный адрес Pages: https://balisha.pages.dev
- Ранее опубликованный Worker: https://balisha-preview.niibet34.workers.dev

При изменении ветки `main` Cloudflare Pages должен автоматически собирать новую версию.

Основной домен `balisha.ru` уже добавлен как DNS-зона Cloudflare, но пока ожидает делегирования NS у регистратора. После активации зоны подключаем домен к Pages, и только тогда заменяем старую Worker-маршрутизацию, избегая простоя.

На страницах Pages Functions middleware устанавливает `X-Robots-Tag: noindex, nofollow` для временных хостов `*.pages.dev`. Основной адрес, после подключения, предназначен для индексации Яндексом и Google.
