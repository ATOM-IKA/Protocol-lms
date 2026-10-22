# PROTOCOL LMS — ЭТАП 1: Фундамент (TypeScript)

Новый проект на TypeScript на базе вашего PROTOCOL. Единая ло-фай тема, готовая архитектура, провайдеры и типизированный клиент PocketBase.

## Что уже есть

- **TypeScript strict** (без `any`), React 19, Vite 7
- **Архитектура Feature-Sliced**: `app / pages / widgets / features / entities / shared`
- **Ло-фай дизайн-система** — одна спокойная тема (крем/графит/шалфей), без переключателя тем, CSS-токены в `src/styles/index.css`
- **React Query** (серверное состояние) + **Zustand** (клиентское) + **ErrorBoundary**
- **i18n** (i18next): русский основной, английский — переключаемый, файлы в `src/shared/i18n/locales`
- **Типизированный клиент PocketBase** (`src/shared/api/pocketbase.ts`) — сессия только в `pb.authStore`, без данных пользователя в localStorage
- **UI-примитив** `Button`, утилита `cn`, демо-лендинг в ло-фай стиле
- **Качество**: ESLint (flat, TS) + Prettier + правила `no-explicit-any`, `no-console`

## Запуск локально

```bash
npm install
cp .env.example .env      # укажите VITE_POCKETBASE_URL
npm run dev               # http://localhost:5173
```

Проверки:

```bash
npm run build   # tsc -b + vite build (0 ошибок TS)
npm run lint    # ESLint (0 ошибок)
```

> Примечание: в среде Cowork реестр npm заблокирован политикой безопасности,
> поэтому `npm install` и сборку нужно запустить у себя локально.

## Структура

```
src/
├── app/            App, AppRouter (lazy), providers (Query, i18n, ErrorBoundary)
├── pages/          LandingPage (демо ло-фай), LoginPage (заглушка)
├── widgets/        (следующие этапы: Header, Footer, MobileMenu)
├── features/       (следующие этапы: auth, courses, progress, xp-system, admin)
├── entities/       user/types.ts — типы записей PocketBase
├── shared/
│   ├── api/        pocketbase.ts — типизированный клиент
│   ├── config/     env.ts — валидация переменных окружения
│   ├── i18n/       config.ts + locales/ru.json, en.json
│   ├── lib/        cn.ts
│   ├── store/      uiStore.ts (Zustand)
│   └── ui/         Button/
└── styles/         index.css — ло-фай токены (@theme)
```

## Дальше (после вашего «ОК»)

ЭТАП 2 — виджеты и страницы (Header, каталог курсов, страница курса) в ло-фай стиле и функционал (курсы, прогресс, XP), затем — безопасность (порядок по вашему решению).
