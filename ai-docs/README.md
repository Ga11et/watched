# AI Agent Documentation

## Назначение

Эта папка содержит всю документацию и контекст, необходимый для AI агента при работе с проектом Watched.

## Структура документации

```
ai-docs/
├── README.md                      # Этот файл - обзор документации
├── agent-context.md               # 🎯 Краткий контекст для агента (ПЕРВЫЙ ФАЙЛ)
├── ARCHITECTURE.md                # 🏛️ Полная архитектура проекта
├── backend/                       # 📁 Документация по бэкенду
│   └── BACKEND_DEVELOPMENT_WORKFLOW.md  # 🛠️ Полный гайд по разработке на бэкенде
└── frontend/                      # 📁 Документация по фронтенду
    ├── FRONTEND_COMPONENT_GUIDELINES.md    # 🧩 Рекомендации по компонентам
    ├── FRONTEND_DASHBOARD_GUIDE.md         # 📊 Гайд по дашбордам
    ├── FRONTEND_ENTITY_CREATE_GUIDE.md     # ➕ Создание сущностей
    ├── FRONTEND_ENTITY_DETAIL_GUIDE.md     # 👀 Детальный просмотр сущностей
    ├── FRONTEND_ENTITY_EDIT_GUIDE.md       # ✏️ Редактирование сущностей
    └── FRONTEND_ENTITY_LIST_GUIDE.md       # 📋 Списки сущностей
```

## Как использовать эту документацию

### Для быстрого старта

1. Прочитать `agent-context.md` - основная информация о проекте
2. Изучить `ARCHITECTURE.md` - для понимания общей архитектуры
3. Выбрать нужный раздел (backend/frontend) в зависимости от задачи

### Для конкретных задач

- **🛠️ Бэкенд разработка**: `backend/BACKEND_DEVELOPMENT_WORKFLOW.md`
- **🧩 Frontend компоненты**: `frontend/FRONTEND_COMPONENT_GUIDELINES.md`
- **� Дашборды**: `frontend/FRONTEND_DASHBOARD_GUIDE.md`
- **➕ Создание сущностей**: `frontend/FRONTEND_ENTITY_CREATE_GUIDE.md`
- **👀 Детальный просмотр**: `frontend/FRONTEND_ENTITY_DETAIL_GUIDE.md`
- **✏️ Редактирование**: `frontend/FRONTEND_ENTITY_EDIT_GUIDE.md`
- **� Списки сущностей**: `frontend/FRONTEND_ENTITY_LIST_GUIDE.md`
- **🏗️ Архитектура**: `ARCHITECTURE.md`

### Для агента

При начале работы с проектом всегда:

1. Читать `agent-context.md` первым
2. Использовать соответствующие гайды из backend/ или frontend/
3. Следовать рекомендациям из `FRONTEND_COMPONENT_GUIDELINES.md` для UI работы

## Принципы документации

- **Актуальность**: Документация всегда должна быть актуальной
- **Простота**: Чёткие и краткие объяснения
- **Примеры**: Конкретные примеры кода
- **Структура**: Логическая организация информации

## Обновление документации

При изменении проекта:

1. Обновить соответствующие файлы документации в backend/ или frontend/
2. Проверить актуальность `ARCHITECTURE.md` при изменении архитектуры
3. Обновить `agent-context.md` при изменении ключевых концепций проекта
