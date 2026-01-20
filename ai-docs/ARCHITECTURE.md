# Архитектура проекта Watched

## Обзор

Приложение для отслеживания просмотренного и прочитанного контента (фильмы, игры, сериалы, книги) с монолитной архитектурой.

## Структура

```
watched/
├── packages/
│   ├── api/                 # NestJS Backend
│   │   ├── src/
│   │   │   ├── movies/      # Модуль фильмов
│   │   │   ├── games/       # Модуль игр
│   │   │   ├── series/      # Модуль сериалов
│   │   │   ├── books/       # Модуль книг
│   │   │   ├── directors/   # Модуль режиссёров
│   │   │   └── app.module.ts
│   │   └── uploads/         # Загруженные файлы
│   └── client/              # Nuxt 3 Frontend
│       ├── pages/           # Страницы маршрутизации
│       ├── components/      # Vue компоненты
│       └── nuxt.config.ts
└── docker-compose.yml
```

## Потоки данных

### 1. Создание фильма

```
Client (form) → API POST /movies → Service.validate() → Database.save() → Response
```

### 2. Поиск через TMDB

```
Client (search) → TMDB API → Client cache → Form population
```

### 3. Загрузка дашборда

```
Client → API (8 parallel requests) → Aggregate → Display
```

### 4. Поиск книг через Google Books API

```
Client (search) → Google Books API → Client cache → Form population
```

## Ключевые зависимости

- **Backend**: NestJS, TypeORM, PostgreSQL, Multer
- **Frontend**: Nuxt 3, Vue 3, TailwindCSS, Axios
- **External**: TMDB API, Google Books API

## Правила именования

- Таблицы: множественное число (movies, games, series, books)
- Эндпоинты: /movies, /games, /series, /books
- Компоненты: PascalCase (MovieCard, TmdbSearch)
- Файлы: kebab-case (create-movie.dto.ts)

## Валидация

- Рейтинги: 0-100 для фильмов/игр/книг, 0-10 для сериалов
- Даты: ISO 8601 формат
- UUID: v4 для всех ID

## Безопасность

- CORS настроен для localhost:33000
- Файловые загрузки в /uploads
- Env переменные для API ключей
