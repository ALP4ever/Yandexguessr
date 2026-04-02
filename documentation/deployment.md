# Запуск и деплой

## Переменные окружения

Основная runtime-переменная:

```env
VITE_YANDEX_MAPS_API_KEY=your-yandex-maps-api-key
```

Пример лежит в `.env.example`.

## Порядок получения API-ключа

Приложение пытается получить ключ в таком порядке:

1. `import.meta.env.VITE_YANDEX_MAPS_API_KEY`
2. HTTP-запрос к `api-key.txt`

Fallback URL формируются из:

- `new URL("api-key.txt", document.baseURI)`
- `${window.location.origin}/api-key.txt`

Если ни один источник не возвращает значение, инициализация приложения завершается ошибкой.

## Локальный запуск

### Вариант 1: через `.env`

Создайте `.env` в корне проекта:

```env
VITE_YANDEX_MAPS_API_KEY=your-real-key
```

Затем выполните:

```bash
npm ci
npm run dev
```

### Вариант 2: через `api-key.txt`

Положите строку с ключом в файл:

```text
api-key.txt
```

Это удобно, если:

- вы хотите использовать тот же механизм получения ключа и локально, и в production
- вам удобнее отдавать ключ как статический файл

## Интеграция с Vite

В `vite.config.ts` определен кастомный плагин `api-key-bridge`.

### Что делает плагин

Во время разработки:

- поднимает endpoint `/api-key.txt` через middleware Vite
- читает локальный файл `api-key.txt`

Во время сборки:

- читает `api-key.txt`
- эмитит его как статический asset в build output

За счет этого `api-key.txt` доступен единообразно и в dev, и в production без отдельного бэкенда.

## Сборка проекта

Стандартная production-сборка:

```bash
npm run build
```

Результат:

- статический бандл в `dist/`
- сгенерированный `api-key.txt` в выходной директории, если исходный файл существует и читается

## Docker-деплой

В репозитории есть multi-stage `Dockerfile`.

### Stage 1: build

Базовый образ:

- `node:20-alpine`

Шаги:

1. установка зависимостей через `npm ci`
2. копирование файлов проекта
3. прием `ARG VITE_YANDEX_MAPS_API_KEY`
4. дублирование значения в `ENV VITE_YANDEX_MAPS_API_KEY`
5. создание `api-key.txt`, если файла нет
6. запись build-arg в `api-key.txt`, если он передан
7. запуск `npm run build`

### Stage 2: runtime

Базовый образ:

- `nginx:1.27-alpine`

Шаги:

1. копирование `dist/` в `/usr/share/nginx/html`
2. открытие порта `3000`
3. при старте контейнера опциональная запись `VITE_YANDEX_MAPS_API_KEY` в `/usr/share/nginx/html/api-key.txt`
4. запуск nginx в foreground

## Пример Docker build

```bash
docker build -t yandexguessr --build-arg VITE_YANDEX_MAPS_API_KEY=your-real-key .
```

## Пример Docker run

```bash
docker run --rm -p 3000:3000 yandexguessr
```

Если нужен runtime-ввод ключа вместо build-time:

```bash
docker run --rm -p 3000:3000 -e VITE_YANDEX_MAPS_API_KEY=your-real-key yandexguessr
```

## Особенности статического хостинга

Приложение может работать на статическом хостинге, если:

- статические файлы отдаются корректно
- браузер может загрузить скрипт Yandex Maps
- `api-key.txt` доступен с того же origin, если env-переменная не используется

Подходящие варианты:

- Nginx
- container hosting
- object storage со статической раздачей

## Заметки по безопасности

Так как приложение полностью клиентское, API-ключ Yandex Maps в любом случае попадает в браузер.

Это означает:

- ключ должен рассматриваться как client-side credential
- по возможности нужно включать ограничения на стороне Yandex
- server-only секреты нельзя хранить таким способом

## Практические рекомендации

- ограничьте ключ по доменам, если это поддерживается для вашего типа ключа
- не коммитьте реальные ключи в `.env` и `api-key.txt`
- добавьте CI-проверку сборки, когда появится pipeline
- при необходимости добавьте собственный Nginx config для кэша, заголовков и SPA-маршрутизации

## Чеклист перед выкладкой

- API-ключ доступен через env или `api-key.txt`
- `npm run build` проходит успешно
- в `dist/` присутствуют статические файлы приложения
- `api-key.txt` действительно попадает в выдачу, если env не используется
- браузер может загрузить `https://api-maps.yandex.ru/2.1/?lang=ru_RU`
- целевой хост не блокирует загрузку ресурсов Yandex Maps
