# ТЗ: Модуль авторизации по методологии TDD

## Обзор

Реализовать систему авторизации для приложения "Watched" с ролевым доступом. Все списки должны быть защищены, но доступны для просмотра любому пользователю. Изменение списков разрешено только авторизованным пользователям согласно их ролям.

## Текущее состояние

- Все списки доступны для чтения и записи любому пользователю
- Отсутствует система авторизации
- Отсутствует управление пользователями и ролями

## Целевое состояние

- Авторизация по логину/паролю
- Ролевая система доступа (Администратор, Обычная, Гость)
- Защита списков от несанкционированного изменения
- Возможность регистрации новых пользователей
- Просмотр списков доступен всем

---

## Шаг 1: Создание сущности User и базовой модели

### Описание шага

Создать базовую модель пользователя с необходимыми полями и ролями.

### Требования

- Создать entity `User` со следующими полями:
  - `id` (guid, primary key)
  - `username` (string, optional, unique)
  - `email` (string, optional, unique)
  - `passwordHash` (string)
  - `name` (string)
  - `role` (enum: ADMIN, USER, GUEST)
  - `isActive` (boolean)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)
- **Swagger документация**: Использовать декораторы `@ApiProperty` и `@ApiPropertyOptional` для всех полей entity согласно руководству [SWAGGER_INTEGRATION_GUIDE.md](./SWAGGER_INTEGRATION_GUIDE.md)

### Тесты (TDD)

```typescript
describe('User Entity', () => {
  it('should create user with valid data', async () => {
    const user = new User()
    user.username = 'testuser'
    user.passwordHash = 'hashedpassword'
    user.name = 'Test User'
    user.role = UserRole.USER
    user.isActive = true

    await user.save()

    expect(user.id).toBeDefined()
    expect(user.createdAt).toBeDefined()
  })

  it('should create user without username', async () => {
    const user = new User()
    user.passwordHash = 'hashedpassword'
    user.name = 'Test User'
    user.role = UserRole.USER
    user.isActive = true
    // username не указан

    await user.save()

    expect(user.id).toBeDefined()
    expect(user.username).toBeNull()
  })

  it('should enforce unique username when provided', async () => {
    // Создать первого пользователя с username
    const user1 = await createTestUser('user1')
    user1.username = 'testuser'
    await user1.save()

    // Попытка создать второго с тем же username должна вызвать ошибку
    const user2 = await createTestUser('user2')
    user2.username = 'testuser'

    await expect(user2.save()).rejects.toThrow()
  })

  it('should allow optional email', async () => {
    const user = new User()
    user.username = 'testuser2'
    user.passwordHash = 'hashedpassword'
    user.name = 'Test User'
    user.role = UserRole.USER
    user.isActive = true
    // email не указан

    await user.save()

    expect(user.id).toBeDefined()
    expect(user.email).toBeNull()
  })

  it('should enforce unique email when provided', async () => {
    // Создать первого пользователя с email
    const user1 = await createTestUser('user1')
    user1.email = 'test@example.com'
    await user1.save()

    // Попытка создать второго с тем же email должна вызвать ошибку
    const user2 = await createTestUser('user2')
    user2.email = 'test@example.com'

    await expect(user2.save()).rejects.toThrow()
  })
})
```

### Критерии завершения

- [ ] Entity User создана
- [ ] Все поля определены с правильными типами
- [ ] Username является необязательным полем
- [ ] Валидация уникальности username работает (когда указан)
- [ ] Email является необязательным полем
- [ ] Валидация уникальности email работает (когда указан)
- [ ] **Swagger декораторы** добавлены ко всем полям entity согласно руководству
- [ ] Все тесты проходят

---

## Шаг 2: Создание сервиса аутентификации

### Описание шага

Реализовать базовый сервис для аутентификации пользователей с хешированием паролей.

### Требования

- Создать `AuthService` с методами:
  - `register(name, password, username?, email?)` - регистрация нового пользователя
  - `login(identifier, password)` - аутентификация (по username, email или name)
  - `hashPassword(password)` - хеширование пароля
  - `verifyPassword(password, hash)` - проверка пароля
- **Swagger документация**: Создать DTO классы с декораторами `@ApiProperty` и `@ApiPropertyOptional` для всех эндпоинтов авторизации согласно руководству [SWAGGER_INTEGRATION_GUIDE.md](./SWAGGER_INTEGRATION_GUIDE.md)

### Тесты (TDD)

```typescript
describe('AuthService', () => {
  describe('register', () => {
    it('should register new user successfully', async () => {
      const userData = {
        name: 'New User',
        password: 'password123',
        username: 'newuser',
      }

      const user = await authService.register(userData)

      expect(user.id).toBeDefined()
      expect(user.passwordHash).not.toBe(userData.password)
      expect(user.role).toBe(UserRole.USER)
    })

    it('should register user without username', async () => {
      const userData = {
        name: 'New User',
        password: 'password123',
      }

      const user = await authService.register(userData)

      expect(user.id).toBeDefined()
      expect(user.username).toBeNull()
      expect(user.passwordHash).not.toBe(userData.password)
      expect(user.role).toBe(UserRole.USER)
    })

    it('should throw error for duplicate username', async () => {
      await authService.register({
        name: 'Test User 1',
        password: 'password123',
        username: 'testuser',
      })

      await expect(
        authService.register({
          name: 'Test User 2',
          password: 'password456',
          username: 'testuser',
        }),
      ).rejects.toThrow('Username already exists')
    })
  })

  describe('login', () => {
    it('should authenticate user with username', async () => {
      const user = await authService.register({
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      })

      const result = await authService.login('testuser', 'password123')

      expect(result.user.id).toBe(user.id)
      expect(result.token).toBeDefined()
    })

    it('should authenticate user with name when no username', async () => {
      const user = await authService.register({
        name: 'Test User',
        password: 'password123',
      })

      const result = await authService.login('Test User', 'password123')

      expect(result.user.id).toBe(user.id)
      expect(result.token).toBeDefined()
    })

    it('should throw error for invalid password', async () => {
      await authService.register({
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      })

      await expect(authService.login('testuser', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials',
      )
    })

    it('should throw error for non-existent user', async () => {
      await expect(authService.login('nonexistent', 'password')).rejects.toThrow('User not found')
    })
  })

  describe('password hashing', () => {
    it('should hash password consistently', async () => {
      const password = 'testpassword'
      const hash1 = await authService.hashPassword(password)
      const hash2 = await authService.hashPassword(password)

      expect(hash1).not.toBe(password)
      expect(hash2).not.toBe(password)
      expect(hash1).not.toBe(hash2)
    })

    it('should verify password correctly', async () => {
      const password = 'testpassword'
      const hash = await authService.hashPassword(password)

      expect(await authService.verifyPassword(password, hash)).toBe(true)
      expect(await authService.verifyPassword('wrongpassword', hash)).toBe(false)
    })
  })
})
```

### Критерии завершения

- [ ] AuthService создан
- [ ] Метод register работает с валидацией
- [ ] Метод login проверяет учетные данные
- [ ] Пароли хешируются bcrypt
- [ ] Все тесты проходят

---

## Шаг 3: Создание JWT токенов и middleware

### Описание шага

Реализовать систему JWT токенов для аутентификации и middleware для защиты эндпоинтов.

### Требования

- Создать `JwtService` с методами:
  - `generateToken(user)` - создание JWT токена
  - `verifyToken(token)` - верификация токена
  - `extractTokenFromHeader(request)` - извлечение токена из заголовка

### Описание работы JwtService

#### **generateToken(user)**

Создает JWT токен на основе данных пользователя:

- **Payload содержит:**
  - `userId` - ID пользователя
  - `username` - username пользователя (если есть)
  - `name` - имя пользователя
  - `role` - роль пользователя (ADMIN, USER, GUEST)
  - `iat` - время создания токена
  - `exp` - время истечения токена (по умолчанию 24 часа)
- **Секретный ключ** используется из переменных окружения
- **Алгоритм шифрования** - HS256
- **Возвращает** строку токена

#### **verifyToken(token)**

Проверяет валидность JWT токена:

- **Проверяет подпись** с помощью секретного ключа
- **Проверяет срок действия** - токен не должен быть просрочен
- **Извлекает payload** и возвращает декодированные данные
- **Выбрасывает ошибки:**
  - `Invalid token` - если подпись неверна или токен malformed
  - `Token expired` - если срок действия истек
- **Возвращает** объект с данными пользователя из payload

#### **extractTokenFromHeader(request)**

Извлекает токен из HTTP заголовка:

- **Ищет заголовок** `Authorization`
- **Проверяет формат** - должен быть `Bearer <token>`
- **Извлекает токен** из строки после `Bearer `
- **Возвращает** токен как строку или `null` если заголовок отсутствует или неверный формат
- **Используется** в middleware для автоматического извлечения токена

#### **Настройки и конфигурация**

- **Секретный ключ** - `JWT_SECRET` из переменных окружения
- **Время жизни** - `JWT_EXPIRES_IN` (по умолчанию 24ч)
- **Алгоритм** - `JWT_ALGORITHM` (по умолчанию HS256)

#### **Пример использования**

```typescript
// Создание токена
const user = { id: '123', username: 'testuser', name: 'Test', role: 'USER' }
const token = jwtService.generateToken(user)
// Возвращает: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// Верификация токена
const decoded = jwtService.verifyToken(token)
// Возвращает: { userId: '123', username: 'testuser', name: 'Test', role: 'USER', iat: 1234567890, exp: 1234654290 }

// Извлечение из заголовка
const token = jwtService.extractTokenFromHeader(request)
// Для заголовка "Bearer eyJhbGciOiJIUzI1NiIs..." возвращает токен
```

- Создать `AuthMiddleware` для защиты эндпоинтов:
  - Проверка наличия и валидности токена
  - Добавление пользователя в request объект
  - Обработка ошибок аутентификации

### Тесты (TDD)

```typescript
describe('JwtService', () => {
  describe('generateToken', () => {
    it('should generate valid JWT token', async () => {
      const user = await createTestUser()
      const token = jwtService.generateToken(user)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })

    it('should include user data in token payload', async () => {
      const user = await createTestUser()
      const token = jwtService.generateToken(user)
      const decoded = jwtService.verifyToken(token)

      expect(decoded.userId).toBe(user.id)
      expect(decoded.username).toBe(user.username)
      expect(decoded.role).toBe(user.role)
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const user = await createTestUser()
      const token = jwtService.generateToken(user)
      const decoded = jwtService.verifyToken(token)

      expect(decoded.userId).toBe(user.id)
    })

    it('should throw error for invalid token', () => {
      expect(() => jwtService.verifyToken('invalid-token')).toThrow('Invalid token')
    })

    it('should throw error for expired token', async () => {
      const user = await createTestUser()
      const expiredToken = jwtService.generateToken(user, { expiresIn: '-1h' })

      expect(() => jwtService.verifyToken(expiredToken)).toThrow('Token expired')
    })
  })
})

describe('AuthMiddleware', () => {
  it('should pass request with valid token', async () => {
    const user = await createTestUser()
    const token = jwtService.generateToken(user)
    const request = {
      headers: { authorization: `Bearer ${token}` },
    }

    const result = await authMiddleware.use(request as any)

    expect(result.user.id).toBe(user.id)
  })

  it('should throw error for missing token', async () => {
    const request = { headers: {} }

    await expect(authMiddleware.use(request as any)).rejects.toThrow('Authorization token required')
  })

  it('should throw error for invalid token', async () => {
    const request = {
      headers: { authorization: 'Bearer invalid-token' },
    }

    await expect(authMiddleware.use(request as any)).rejects.toThrow('Invalid token')
  })
})
```

### Критерии завершения

- [ ] JwtService создан и работает
- [ ] Токены содержат необходимые данные пользователя
- [ ] AuthMiddleware проверяет токены
- [ ] Middleware добавляет пользователя в request
- [ ] Нет проблем связанных с утечкой секретных ключей и безопасностью
- [ ] Все тесты проходят

---

## Шаг 4: Защита эндпоинтов создания/обновления/удаления

### Описание шага

Добавить защиту для всех эндпоинтов, которые изменяют данные (POST, PUT, DELETE).

### Требования

- Матрица доступа к эндпоинтам:
  - **Пути, защищенные авторизацией (JWT): `user-*`**
    - `GET /user-books` - получение книг текущего пользователя
    - `GET /user-movies` - получение фильмов текущего пользователя
    - `GET /user-series` - получение сериалов текущего пользователя
    - `GET /user-games` - получение игр текущего пользователя
    - `GET /user-authors` - получение авторов текущего пользователя
    - `GET /user-directors` - получение режиссеров текущего пользователя
    - `POST /user-books` - добавление книги в список текущего пользователя
    - `PUT /user-books/:id` - обновление записи о книге текущего пользователя
    - `DELETE /user-books/:id` - удаление книги из списка текущего пользователя
    - `POST /user-movies` - добавление фильма в список текущего пользователя
    - `PUT /user-movies/:id` - обновление записи о фильме текущего пользователя
    - `DELETE /user-movies/:id` - удаление фильма из списка текущего пользователя
    - `POST /user-series` - добавление сериала в список текущего пользователя
    - `PUT /user-series/:id` - обновление записи о сериале текущего пользователя
    - `DELETE /user-series/:id` - удаление сериала из списка текущего пользователя
    - `POST /user-games` - добавление игры в список текущего пользователя
    - `PUT /user-games/:id` - обновление записи об игре текущего пользователя
    - `DELETE /user-games/:id` - удаление игры из списка текущего пользователя
    - `POST /user-authors` - добавление автора в список текущего пользователя
    - `PUT /user-authors/:id` - обновление записи об авторе текущего пользователя
    - `DELETE /user-authors/:id` - удаление автора из списка текущего пользователя
    - `POST /user-directors` - добавление режиссера в список текущего пользователя
    - `PUT /user-directors/:id` - обновление записи о режиссере текущего пользователя
    - `DELETE /user-directors/:id` - удаление режиссера из списка текущего пользователя
  - **Пути без авторизации (публичные): `user/:guid/*`**
    - `GET /user/:guid/books` - получение книг указанного пользователя
    - `GET /user/:guid/movies` - получение фильмов указанного пользователя
    - `GET /user/:guid/series` - получение сериалов указанного пользователя
    - `GET /user/:guid/games` - получение игр указанного пользователя
    - `GET /user/:guid/authors` - получение авторов указанного пользователя
    - `GET /user/:guid/directors` - получение режиссеров указанного пользователя
  - **Пути, защищенные админским доступом: `/entity` (только для ADMIN)**
    - `POST /books` - создание книги в справочнике
    - `PUT /books/:id` - обновление книги в справочнике
    - `DELETE /books/:id` - удаление книги из справочника
    - `POST /movies` - создание фильма в справочнике
    - `PUT /movies/:id` - обновление фильма в справочнике
    - `DELETE /movies/:id` - удаление фильма из справочника
    - `POST /series` - создание сериала в справочнике
    - `PUT /series/:id` - обновление сериала в справочнике
    - `DELETE /series/:id` - удаление сериала из справочника
    - `POST /games` - создание игры в справочнике
    - `PUT /games/:id` - обновление игры в справочнике
    - `DELETE /games/:id` - удаление игры из справочнике
    - `POST /authors` - создание автора в справочнике
    - `PUT /authors/:id` - обновление автора в справочнике
    - `DELETE /authors/:id` - удаление автора из справочника
    - `POST /directors` - создание режиссера в справочнике
    - `PUT /directors/:id` - обновление режиссера в справочнике
    - `DELETE /directors/:id` - удаление режиссера из справочника
  - **Открытые эндпоинты (доступны всем):**
    - `GET /books` - получение списка всех книг
    - `GET /books/:id` - получение информации о книге
    - `GET /movies` - получение списка всех фильмов
    - `GET /movies/:id` - получение информации о фильме
    - `GET /series` - получение списка всех сериалов
    - `GET /series/:id` - получение информации о сериале
    - `GET /games` - получение списка всех игр
    - `GET /games/:id` - получение информации об игре
    - `GET /authors` - получение списка всех авторов
    - `GET /authors/:id` - получение информации об авторе
    - `GET /directors` - получение списка всех режиссеров
    - `GET /directors/:id` - получение информации о режиссере

### Тесты (TDD)

- Проверки для путей `user-*` (JWT-защищенные):
  - Запрос без токена к `GET /user-*` возвращает `401`.
  - Запрос без токена к `POST /user-*` возвращает `401`.
  - Запрос без токена к `PUT /user-*/:id` возвращает `401`.
  - Запрос без токена к `DELETE /user-*/:id` возвращает `401`.
  - Запрос с пустым заголовком `Authorization: Bearer` к `user-*` возвращает `401`.
  - Запрос с некорректной схемой (`Authorization: Basic ...`) к `user-*` возвращает `401`.
  - Запрос с валидным JWT к `GET /user-*` возвращает `200` и только списки текущего пользователя.
  - Запрос с валидным JWT к `POST /user-*` возвращает `201` и создаёт запись в списке текущего пользователя.
  - Запрос с валидным JWT к `PUT /user-*/:id` возвращает `200` и обновляет запись текущего пользователя.
  - Запрос с валидным JWT к `DELETE /user-*/:id` возвращает `200/204` и удаляет запись текущего пользователя.
  - Повторный `DELETE /user-*/:id` уже удаленной записи возвращает `404`.
  - `PUT /user-*/:id` с несуществующим `id` возвращает `404`.
  - `PUT /user-*/:id` с невалидным форматом `id` возвращает `400`.
  - `POST /user-*` c невалидным телом запроса возвращает `400`.
  - `POST /user-*` c дублирующей записью для текущего пользователя возвращает `409`.
  - Запрос с невалидным JWT к `user-*` возвращает `403`.
  - Запрос с просроченным JWT к `user-*` возвращает `403`.
  - JWT одного пользователя не дает доступа к данным другого пользователя в `PUT/DELETE` и возвращает `403`.

- Проверки для публичных путей `user/:guid/*`:
  - Запрос без токена к `GET /user/:guid/*` возвращает `200`.
  - Запрос с токеном к `GET /user/:guid/*` также возвращает `200`.
  - `GET /user/:guid/*` возвращает данные именно пользователя из `:guid`.
  - `GET /user/:guid/*` с несуществующим `guid` возвращает `404`.
  - `GET /user/:guid/*` с невалидным форматом `guid` возвращает `400`.
  - `GET /user/:guid/*` не должен возвращать приватные поля (`passwordHash`, email, служебные токены).
  - `GET /user/:guid/*` для пользователя без записей возвращает `200` и пустой массив.

- Проверки для admin-only путей `/entity`:
  - Запрос без токена к `POST /books|movies|series|games|authors|directors` возвращает `401`.
  - Запрос без токена к `PUT /entity/:id` возвращает `401`.
  - Запрос без токена к `DELETE /entity/:id` возвращает `401`.
  - Запрос с валидным JWT обычного пользователя к `/entity` возвращает `403`.
  - Запрос с невалидным JWT к `/entity` возвращает `403`.
  - Запрос с просроченным JWT к `/entity` возвращает `403`.
  - Запрос с валидным JWT администратора к `POST /entity` возвращает `201`.
  - Запрос с валидным JWT администратора к `PUT /entity/:id` возвращает `200`.
  - Запрос с валидным JWT администратора к `DELETE /entity/:id` возвращает `200/204`.
  - `POST /entity` с невалидным телом запроса возвращает `400`.
  - `POST /entity` с нарушением уникальности возвращает `409`.
  - `PUT /entity/:id` с несуществующим `id` возвращает `404`.
  - `DELETE /entity/:id` с несуществующим `id` возвращает `404`.

- Проверки открытых справочных GET-путей (`/books`, `/movies`, `/series`, `/games`, `/authors`, `/directors`):
  - `GET /entity` доступен без токена и возвращает `200`.
  - `GET /entity/:id` доступен без токена и возвращает `200` или `404` для несуществующей сущности.
  - Наличие невалидного/просроченного токена не влияет на доступ к открытым `GET /entity`.
  - `GET /entity/:id` с невалидным форматом `id` возвращает `400`.
  - Открытые `GET /entity` не возвращают служебные/приватные поля.
  - Параметры фильтрации/сортировки/пагинации валидируются; некорректные параметры возвращают `400`.

- Параметризация тестов:
  - Все проверки выполняются одинаково для `books`, `movies`, `series`, `games`, `authors`, `directors`.

### Критерии завершения

- [x] Все эндпоинты защищены
- [x] Запросы без токена возвращают 401
- [x] Запросы с валидным токеном проходят
- [x] Запросы с невалидным токеном возвращают 403
- [x] Все тесты проходят

---

## Шаг 5: Реализация прав доступа на основе ролей

## Сделать дамп до реализации этого шага!!

### Описание шага

Создать новые таблицы, с учетом ролей пользователей.

### Требования

- На базе уже реализованной и проверенной в шаге 4 матрицы доступа внедрить `RolesGuard`, который централизует проверки ролей и ownership для новых таблиц:
  - Для `POST|PUT|DELETE /books|movies|series|games|authors|directors` доступ только у `ADMIN`.
  - Для `GET /books|movies|series|games|authors|directors` и `GET /:entity/:id` доступ открыт для всех.
  - Для `GET|POST|PUT|DELETE /user-*` требуется валидный JWT (`USER` или `ADMIN`).
  - Для `GET /user/:guid/*` доступ открыт для всех (без JWT).
  - Для операций изменения `/user/:guid/*`:
    - `ADMIN` может изменять записи любого пользователя;
    - `USER` может изменять только собственные записи (`resource.userId === request.user.id`);
    - `GUEST` не может изменять записи.

- Реализовать гибридную структуру списков (актуальные сущности) (все таблицы новые, старые таблицы не трогать!):
  - **Основные таблицы-справочники** (каталог, доступ на чтение открыт):
    - `books` (id, title, cover, genres, publishYear, pageCount, authors[], createdAt, updatedAt)
    - `movies` (id, title, cover, genres, releaseYear, directors[], createdAt, updatedAt)
    - `series` (id, title, cover, genres, country, totalSeasons, createdAt, updatedAt)
    - `games` (id, title, cover, publishers[], developers[], createdAt, updatedAt)
    - `authors` (id, fullName, photo, createdAt, updatedAt)
    - `directors` (id, fullName, photo, createdAt, updatedAt)
    - `publishers` (id, fullName, photo, createdAt, updatedAt)
    - `developers` (id, fullName, photo, createdAt, updatedAt)
  - **Пользовательские таблицы** (защищены по `userId` и проверяются `RolesGuard`):
    - `user_books` (id, userId, bookId, rating, readAt, comment, createdAt, updatedAt)
    - `user_movies` (id, userId, movieId, rating, watchedAt, comment, createdAt, updatedAt)
    - `user_series` (id, userId, seriesId, rating, watchedAt, seasonsWatched, comment, createdAt, updatedAt)
    - `user_games` (id, userId, gameId, rating, playedHours, playedAt, comment, createdAt, updatedAt)
  - **Системные/связующие сущности**:
    - `users` (id, username, email, passwordHash, name, role, isActive, createdAt, updatedAt)
    - `game_publishers` (gameId, publisherId)
    - `game_developers` (gameId, developerId)
    - `movie_directors` (movieId, directorId)
    - `book_authors` (bookId, authorId)

### Тесты

> Ниже перечислены тесты только для новой логики шага 5 (RolesGuard, ownership, новые таблицы и связи).  
> Сценарии из шага 4 (401/403 для отсутствующего/невалидного токена, базовая защита эндпоинтов, публичность GET) повторно не покрывать.

1. **Миграции и структура БД (новые таблицы, старые не изменены)**
   - Проверить, что перед миграцией сохраняется дамп БД (файл создан, не пустой, содержит схему/данные).
   - Проверить, что после миграции существуют все новые таблицы: `user_books`, `user_movies`, `user_series`, `user_games`, `game_publishers`, `game_developers`, `movie_directors`, `book_authors`.
   - Проверить, что старые таблицы не изменили структуру (набор колонок и типы остались прежними).
   - Проверить наличие ожидаемых индексов и уникальных ограничений в связующих таблицах (нельзя создать дублирующую пару связей).
   - Проверить корректные foreign key constraints для всех новых таблиц и связь с `users`/каталогом.

2. **Применение RolesGuard (интеграция, без повтора auth-проверок шага 4)**
   - Проверить, что `RolesGuard` реально подключен к маршрутам изменения пользовательских таблиц.
   - Проверить, что guard вызывается до слоя сервиса и блокирует неразрешенные операции до изменения БД.
   - Проверить, что решение guard основано на роли + ownership, а не только на роли.

3. **RBAC + ownership: позитивные сценарии**
   - `ADMIN` успешно изменяет/удаляет запись любого пользователя в каждой таблице `user_*`.
   - `USER` успешно изменяет/удаляет только свою запись в каждой таблице `user_*`.
   - Проверить, что после успешного изменения обновляются только разрешенные поля и `updatedAt`.

4. **RBAC + ownership: негативные сценарии**
   - `USER` получает `403` при попытке изменить/удалить чужую запись (для каждой таблицы `user_*`).
   - `GUEST` получает `403` при любой попытке изменения/удаления записей `user_*`.
   - Проверить, что при `403` данные в БД не меняются (включая `updatedAt`).
   - Проверить, что ошибка отказа доступа единообразна по формату/коду для всех `user_*` таблиц.

5. **Edge-cases ownership и идентификаторов**
   - Запись существует, но принадлежит другому пользователю с тем же role-level (USER→USER): строго `403`.
   - Запись удалена между чтением и обновлением (race): ожидаем корректный ответ (`404` или доменно-оговоренный), без утечки чужих данных.
   - Попытка работать с несуществующим `id` записи в `user_*`: корректный отказ без побочных эффектов.
   - Попытка подмены `userId` в payload при update: `userId` игнорируется/блокируется, ownership не ломается.
   - Проверить, что нельзя «перевесить» запись на другого пользователя через update.

6. **Валидация и целостность данных пользовательских таблиц**
   - Граничные значения `rating` (минимум/максимум) проходят, выход за диапазон — ошибка валидации.
   - Поля даты (`readAt`, `watchedAt`, `playedAt`) принимают валидный формат, невалидный формат отклоняется.
   - Поле `comment`: пустая строка, `null`, очень длинная строка, спецсимволы/emoji — поведение фиксируется и валидируется.
   - Частичный update не затирает не переданные поля.
   - Создание записи с несуществующим `bookId/movieId/seriesId/gameId` отклоняется FK-ошибкой/доменной ошибкой.

7. **Связующие таблицы (many-to-many) и edge-cases**
   - Добавление валидной связи в `game_publishers`, `game_developers`, `movie_director`, `book_author` успешно.
   - Повторное добавление той же пары (`gameId+publisherId` и т.д.) отклоняется как дубликат.
   - Добавление связи с несуществующей сущностью (невалидный FK) отклоняется.
   - Удаление родительской сущности корректно обрабатывает связующие записи согласно выбранной стратегии (`RESTRICT`/`CASCADE`).
   - Проверить отсутствие «висячих» связей после удаления/rollback операций.

8. **Кросс-табличная консистентность RBAC**
   - Один и тот же сценарий ownership даёт одинаковый результат в `user_books`, `user_movies`, `user_series`, `user_games`.
   - Ошибки и успешные ответы унифицированы между таблицами (коды, структура ответа, сообщения).
   - Проверить, что изменения в одной таблице не дают несанкционированного эффекта в других таблицах.

9. **Конкурентные сценарии**
   - Два одновременных update одной и той же user-записи разными пользователями: разрешенный проходит, запрещенный блокируется.
   - Одновременные update одной записи от `ADMIN` и владельца: поведение детерминировано (last-write-wins/optimistic lock — по принятому правилу).
   - Повторный запрос (retry) не создает дубликатов связей и не нарушает целостность.

10. **Регрессионные тесты на конфликт со шагом 4**

- Проверить, что внедрение `RolesGuard` не меняет уже зафиксированное в шаге 4 поведение маршрутов.
- Проверить, что публичные read-сценарии и базовые auth-статусы продолжают работать как раньше (минимальный smoke, без дублирования полного набора шага 4).

### Критерии завершения

- [ ] До начала реализации шага создан и сохранен дамп БД
- [ ] Старые таблицы не изменены; создан только новый набор таблиц по спецификации шага 5
- [ ] Созданы новые справочники и пользовательские таблицы с актуальными полями
- [ ] Созданы связующие таблицы `game_publishers`, `game_developers`, `movie_director`, `book_author`
- [ ] `RolesGuard` централизованно применяет матрицу доступа шага 4 к новым таблицам
- [ ] `ADMIN` может изменять любые элементы в пользовательских таблицах
- [ ] `USER` может изменять только свои элементы (`resource.userId === request.user.id`)
- [ ] `GUEST` не может изменять элементы в пользовательских таблицах
- [ ] Тесты шага 5 (RBAC + ownership для новых таблиц) проходят

---

## Шаг 6: Реализация эндпоинтов для управления пользователями

### Описание шага

Создать эндпоинты для регистрации, входа, получения списка пользователей.

### Требования

- Создать эндпоинты:
  - `POST /auth/register` - регистрация нового пользователя
  - `POST /auth/login` - вход пользователя
  - `GET /users` - получение списка активных пользователей (доступно всем)
  - `GET /auth/me` - получение информации о текущем пользователе
- **Swagger документация**: Добавить декораторы `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBody`, `@ApiParam` для всех эндпоинтов авторизации согласно руководству [SWAGGER_INTEGRATION_GUIDE.md](./SWAGGER_INTEGRATION_GUIDE.md)

### Тесты (TDD)

```typescript
describe('Auth Endpoints', () => {
  describe('POST /auth/register', () => {
    it('should register new user successfully', async () => {
      const userData = {
        name: 'New User',
        password: 'password123',
        username: 'newuser',
      }

      const response = await request(app).post('/auth/register').send(userData).expect(201)

      expect(response.body.user.name).toBe(userData.name)
      expect(response.body.user.passwordHash).toBeUndefined()
      expect(response.body.token).toBeDefined()
    })

    it('should register user without username', async () => {
      const userData = {
        name: 'New User',
        password: 'password123',
      }

      const response = await request(app).post('/auth/register').send(userData).expect(201)

      expect(response.body.user.name).toBe(userData.name)
      expect(response.body.user.username).toBeNull()
      expect(response.body.user.passwordHash).toBeUndefined()
      expect(response.body.token).toBeDefined()
    })

    it('should reject registration with duplicate username', async () => {
      await createTestUser({ username: 'existing' })

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'New User',
          password: 'password123',
          username: 'existing',
        })
        .expect(400)

      expect(response.body.message).toBe('Username already exists')
    })
  })

  describe('POST /auth/login', () => {
    it('should login user with username', async () => {
      const user = await createTestUser({
        name: 'Test User',
        username: 'testuser',
        password: 'password123',
      })

      const response = await request(app)
        .post('/auth/login')
        .send({
          identifier: 'testuser',
          password: 'password123',
        })
        .expect(200)

      expect(response.body.user.id).toBe(user.id)
      expect(response.body.token).toBeDefined()
    })

    it('should login user with name when no username', async () => {
      const user = await createTestUser({
        name: 'Test User',
        password: 'password123',
      })

      const response = await request(app)
        .post('/auth/login')
        .send({
          identifier: 'Test User',
          password: 'password123',
        })
        .expect(200)

      expect(response.body.user.id).toBe(user.id)
      expect(response.body.token).toBeDefined()
    })

    it('should reject login with invalid credentials', async () => {
      await createTestUser({
        name: 'Test User',
        username: 'testuser',
        password: 'password123',
      })

      const response = await request(app)
        .post('/auth/login')
        .send({
          identifier: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401)

      expect(response.body.message).toBe('Invalid credentials')
    })

    it('should reject login for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          identifier: 'nonexistent',
          password: 'password',
        })
        .expect(401)

      expect(response.body.message).toBe('User not found')
    })
  })

  describe('GET /users', () => {
    it('should return list of active users without authentication', async () => {
      await createTestUser({ username: 'user1', isActive: true })
      await createTestUser({ username: 'user2', isActive: true })
      await createTestUser({ username: 'inactive', isActive: false })

      const response = await request(app).get('/users').expect(200)

      expect(response.body.users).toHaveLength(2)
      expect(response.body.users.map((u) => u.username)).toContain('user1')
      expect(response.body.users.map((u) => u.username)).toContain('user2')
      expect(response.body.users.map((u) => u.username)).not.toContain('inactive')
    })
  })

  describe('GET /auth/me', () => {
    it('should return current user info', async () => {
      const user = await createTestUser()
      const token = jwtService.generateToken(user)

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.id).toBe(user.id)
      expect(response.body.username).toBe(user.username)
      expect(response.body.passwordHash).toBeUndefined()
    })

    it('should reject request without token', async () => {
      const response = await request(app).get('/auth/me').expect(401)

      expect(response.body.message).toBe('Authorization token required')
    })
  })
})
```

### Критерии завершения

- [ ] Эндпоинт регистрации работает
- [ ] Эндпоинт входа работает
- [ ] Список пользователей доступен без авторизации
- [ ] Информация о текущем пользователе доступна с токеном
- [ ] Пароли не возвращаются в ответах
- [ ] **Swagger декораторы** добавлены ко всем эндпоинтам авторизации согласно руководству
- [ ] Все тесты проходят

---

## Шаг 8: Интеграционное тестирование всего модуля

### Описание шага

Провести комплексное тестирование всей системы авторизации.

### Требования

- Протестировать полный цикл:
  - Регистрация → Вход → Создание контента → Проверка прав доступа
  - Разные роли и их права
  - Обработка ошибок
  - Просмотр контента без авторизации

### Тесты (TDD)

```typescript
describe('Authorization Integration Tests', () => {
  describe('Complete user flow', () => {
    it('should allow full workflow for regular user', async () => {
      // Регистрация
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          password: 'password123',
          username: 'testuser',
        })
        .expect(201)

      const token = registerResponse.body.token

      // Создание книги в справочнике (только для ADMIN)
      const bookResponse = await request(app)
        .post('/books')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          genre: 'Fiction',
          publishedYear: 2023,
          pages: 300,
        })
        .expect(201)

      // Добавление книги в список пользователя
      const userBookResponse = await request(app)
        .post('/user-books')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookId: bookResponse.body.id,
          rating: 8,
          readAt: new Date().toISOString(),
          notes: 'Great book!',
          poster: 'https://example.com/book-cover.jpg',
        })
        .expect(201)

      // Обновление записи о книге пользователя
      await request(app)
        .put(`/user-books/${userBookResponse.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 9, notes: 'Updated review' })
        .expect(200)

      // Удаление книги из списка пользователя
      await request(app)
        .delete(`/user-books/${userBookResponse.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      // Создание игры в справочнике (только для ADMIN)
      const gameResponse = await request(app)
        .post('/games')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Game',
          genre: 'RPG',
          releaseYear: 2023,
          platform: 'PC',
        })
        .expect(201)

      // Добавление игры в список пользователя
      const userGameResponse = await request(app)
        .post('/user-games')
        .set('Authorization', `Bearer ${token}`)
        .send({
          gameId: gameResponse.body.id,
          rating: 9,
          playedHours: 25.5,
          playedAt: new Date().toISOString(),
          notes: 'Amazing RPG!',
          poster: 'https://example.com/game-cover.jpg',
        })
        .expect(201)

      // Обновление времени игры
      await request(app)
        .put(`/user-games/${userGameResponse.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ playedHours: 32.0, notes: 'Completed main story' })
        .expect(200)
    })

    it('should prevent unauthorized access', async () => {
      const user = await createTestUser({ role: UserRole.USER })
      const admin = await createTestUser({ role: UserRole.ADMIN })
      const userToken = jwtService.generateToken(user)
      const adminToken = jwtService.generateToken(admin)

      // Пользователь пытается изменить чужую запись в списке
      const adminBook = await createTestBook()
      const adminUserBook = await createUserBook(admin.id, adminBook.id)

      await request(app)
        .put(`/user-books/${adminUserBook.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 10 })
        .expect(403)

      // Администратор может изменить любую запись в списке
      await request(app)
        .put(`/user-books/${adminUserBook.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rating: 10 })
        .expect(200)
    })

    it('should allow viewing content without authentication', async () => {
      await createTestBook({ title: 'Public Book 1' })
      await createTestBook({ title: 'Public Book 2' })

      const response = await request(app).get('/books').expect(200)

      expect(response.body).toHaveLength(2)
      expect(response.body.map((b) => b.title)).toContain('Public Book 1')
      expect(response.body.map((b) => b.title)).toContain('Public Book 2')
    })
  })

  describe('Role-based access integration', () => {
    it('should enforce guest restrictions', async () => {
      const guest = await createTestUser({ role: UserRole.GUEST })
      const book = await createTestBook()
      const guestToken = jwtService.generateToken(guest)

      // Гость не может создавать записи в пользовательских списках
      await request(app)
        .post('/user-books')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookId: book.id,
          rating: 7,
        })
        .expect(403)

      // Гость не может обновлять записи в пользовательских списках
      const userBook = await createUserBook(guest.id, book.id)
      await request(app)
        .put(`/user-books/${userBook.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ rating: 8 })
        .expect(403)

      // Гость не может удалять записи из пользовательских списков
      await request(app)
        .delete(`/user-books/${userBook.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403)

      // Гость не может создавать записи в игровых списках
      const game = await createTestGame()
      await request(app)
        .post('/user-games')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          gameId: game.id,
          rating: 7,
          playedHours: 10,
        })
        .expect(403)

      // Гость не может обновлять записи в игровых списках
      const userGame = await createUserGame(guest.id, game.id)
      await request(app)
        .put(`/user-games/${userGame.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ playedHours: 15 })
        .expect(403)

      // Гость не может удалять записи из игровых списков
      await request(app)
        .delete(`/user-games/${userGame.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403)
    })
  })
})
```

### Критерии завершения

- [ ] Все интеграционные тесты проходят
- [ ] Полный цикл работы пользователя работает
- [ ] Права доступа работают корректно
- [ ] Просмотр контента доступен без авторизации
- [ ] Обработка ошибок работает корректно

---

## Итоговые критерии завершения модуля

### Функциональные требования

- [ ] Пользователи могут регистрироваться в системе
- [ ] Пользователи могут входить по логину/паролю
- [ ] Система поддерживает 3 роли: Администратор, Обычная, Гость
- [ ] Все справочники доступны для просмотра без авторизации
- [ ] Изменение пользовательских списков требует авторизации
- [ ] Администратор может изменять любые пользовательские списки
- [ ] Обычный пользователь может изменять только свои списки
- [ ] Гость не может изменять никакие пользовательские списки
- [ ] Список активных пользователей доступен всем
- [ ] Гибридная структура баз данных реализована

### Технические требования

- [ ] Пароли хешируются bcrypt
- [ ] Используются JWT токены для аутентификации
- [ ] Токены имеют срок действия
- [ ] Все эндпоинты защищены авторизацией
- [ ] Логирование действий пользователей
- [ ] Обработка ошибок авторизации
- [ ] Гибридная структура таблиц (справочники + пользовательские таблицы)

### Тестовые требования

- [ ] Unit тесты для всех сервисов
- [ ] Интеграционные тесты для эндпоинтов
- [ ] Тесты для ролевой модели доступа
- [ ] Тесты для JWT сервиса
- [ ] Покрытие кода тестами не менее 80%

### Документационные требования

- [ ] API документация обновлена
- [ ] Инструкция по развертыванию
- [ ] Руководство по использованию
- [ ] Схема базы данных обновлена
- [ ] Описание гибридной архитектуры
- [ ] **Swagger документация**: Все эндпоинты авторизации полностью задокументированы согласно руководству [SWAGGER_INTEGRATION_GUIDE.md](./SWAGGER_INTEGRATION_GUIDE.md)

---

## Примечания

1. **Порядок выполнения**: Шаги должны выполняться последовательно. Каждый следующий шаг начинается только после успешного завершения предыдущего.

2. **Тестирование**: Каждый шаг включает TDD подход - сначала пишутся тесты, затем реализация.

3. **Безопасность**: Особое внимание уделить безопасности паролей и токенов.

4. **Производительность**: Учесть производительность при проверке прав доступа.

5. **Масштабируемость**: Архитектура должна поддерживать расширение системы ролей в будущем.

6. **Обратная совместимость**: Учесть существующие данные при миграции базы данных.
