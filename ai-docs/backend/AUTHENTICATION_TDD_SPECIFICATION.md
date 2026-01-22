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
  - `id` (string, primary key)
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
- [ ] Все тесты проходят

---

## Шаг 4: Защита эндпоинтов создания/обновления/удаления

### Описание шага

Добавить защиту для всех эндпоинтов, которые изменяют данные (POST, PUT, DELETE).

### Требования

- Защитить следующие эндпоинты AuthMiddleware:
  - **Пользовательские списки (требуют авторизации):**
    - `POST /user-books` - добавление книги в список пользователя
    - `PUT /user-books/:id` - обновление записи о книге пользователя
    - `DELETE /user-books/:id` - удаление книги из списка пользователя
    - `POST /user-movies` - добавление фильма в список пользователя
    - `PUT /user-movies/:id` - обновление записи о фильме пользователя
    - `DELETE /user-movies/:id` - удаление фильма из списка пользователя
    - `POST /user-series` - добавление сериала в список пользователя
    - `PUT /user-series/:id` - обновление записи о сериале пользователя
    - `DELETE /user-series/:id` - удаление сериала из списка пользователя
    - `POST /user-games` - добавление игры в список пользователя
    - `PUT /user-games/:id` - обновление записи об игре пользователя
    - `DELETE /user-games/:id` - удаление игры из списка пользователя
    - `POST /user-authors` - добавление автора в список пользователя
    - `PUT /user-authors/:id` - обновление записи об авторе пользователя
    - `DELETE /user-authors/:id` - удаление автора из списка пользователя
    - `POST /user-directors` - добавление режиссера в список пользователя
    - `PUT /user-directors/:id` - обновление записи о режиссере пользователя
    - `DELETE /user-directors/:id` - удаление режиссера из списка пользователя
  - **Административные эндпоинты (только для ADMIN):**
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

```typescript
describe('Protected Endpoints', () => {
  describe('Books endpoints', () => {
    it('should reject POST /books without token', async () => {
      const response = await request(app).post('/books').send(createBookData()).expect(401)

      expect(response.body.message).toBe('Authorization token required')
    })

    it('should reject PUT /books/:id without token', async () => {
      const book = await createTestBook()

      const response = await request(app)
        .put(`/books/${book.id}`)
        .send(updateBookData())
        .expect(401)

      expect(response.body.message).toBe('Authorization token required')
    })

    it('should reject DELETE /books/:id without token', async () => {
      const book = await createTestBook()

      const response = await request(app).delete(`/books/${book.id}`).expect(401)

      expect(response.body.message).toBe('Authorization token required')
    })

    it('should allow POST /books with valid token', async () => {
      const user = await createTestUser()
      const token = jwtService.generateToken(user)

      const response = await request(app)
        .post('/books')
        .set('Authorization', `Bearer ${token}`)
        .send(createBookData())
        .expect(201)

      expect(response.body.title).toBe(createBookData().title)
    })
  })

  // Аналогичные тесты для movies, series, games, authors, directors
})
```

### Критерии завершения

- [ ] Все изменяющие эндпоинты защищены
- [ ] Запросы без токена возвращают 401
- [ ] Запросы с валидным токеном проходят
- [ ] Все тесты проходят

---

## Шаг 5: Реализация прав доступа на основе ролей

### Описание шага

Реализовать проверку прав доступа в зависимости от роли пользователя.

### Требования

- Создать `RolesGuard` для проверки ролей:
  - Администратор может изменять любые списки
  - Обычный пользователь может изменять только свои списки
  - Гость не может изменять никакие списки

- Реализовать гибридную структуру списков:
  - **Основные таблицы-справочники** (доступны всем для чтения):
    - `books` (id, title, author, genre, publishedYear, pages, createdAt, updatedAt)
    - `movies` (id, title, genre, releaseYear, duration, createdAt, updatedAt)
    - `series` (id, title, genre, releaseYear, seasons, createdAt, updatedAt)
    - `games` (id, title, genre, releaseYear, platform, createdAt, updatedAt)
    - `authors` (id, fullName, birthYear, country, photo, bio, createdAt, updatedAt)
    - `directors` (id, fullName, birthYear, country, photo, bio, createdAt, updatedAt)
  - **Пользовательские таблицы** (заищенные по userId):
    - `user_books` (id, userId, bookId, rating, readAt, notes, poster, createdAt, updatedAt)
    - `user_movies` (id, userId, movieId, rating, watchedAt, notes, poster, createdAt, updatedAt)
    - `user_series` (id, userId, seriesId, rating, watchedAt, seasonsWatched, notes, poster, createdAt, updatedAt)
    - `user_games` (id, userId, gameId, rating, playedHours, playedAt, notes, poster, createdAt, updatedAt)
    - `user_authors` (id, userId, authorId, notes, createdAt, updatedAt)
    - `user_directors` (id, userId, directorId, notes, createdAt, updatedAt)

### Примеры запросов:

#### **Получение всех книг пользователя:**

```sql
SELECT b.*, ub.rating, ub.readAt, ub.notes, ub.poster
FROM books b
JOIN user_books ub ON b.id = ub.bookId
WHERE ub.userId = :userId
ORDER BY ub.readAt DESC
```

#### **Поиск по всем книгам (с проверкой доступа):**

```sql
SELECT b.*, ub.rating, ub.readAt, ub.poster
FROM books b
LEFT JOIN user_books ub ON b.id = ub.bookId AND ub.userId = :userId
WHERE b.title LIKE :searchQuery
ORDER BY b.title
```

#### **Добавление книги в список пользователя:**

```sql
INSERT INTO user_books (userId, bookId, rating, readAt, notes, poster)
VALUES (:userId, :bookId, :rating, :readAt, :notes, :poster)
```

#### **Получение сериалов пользователя с прогрессом:**

```sql
SELECT s.*, us.rating, us.watchedAt, us.seasonsWatched, us.notes, us.poster,
       (us.seasonsWatched / s.seasons * 100) as progressPercent
FROM series s
JOIN user_series us ON s.id = us.seriesId
WHERE us.userId = :userId
ORDER BY us.watchedAt DESC
```

#### **Получение всех игр пользователя с временем игры:**

```sql
SELECT g.*, ug.rating, ug.playedAt, ug.playedHours, ug.notes, ug.poster
FROM games g
JOIN user_games ug ON g.id = ug.gameId
WHERE ug.userId = :userId
ORDER BY ug.playedAt DESC
```

#### **Получение игр с наибольшим временем игры:**

```sql
SELECT g.title, ug.playedHours, ug.rating, ug.notes
FROM games g
JOIN user_games ug ON g.id = ug.gameId
WHERE ug.userId = :userId
ORDER BY ug.playedHours DESC
```

#### **Добавление игры в список пользователя:**

```sql
INSERT INTO user_games (userId, gameId, rating, playedHours, playedAt, notes, poster)
VALUES (:userId, :gameId, :rating, :playedHours, :playedAt, :notes, :poster)
```

#### **Обновление времени игры:**

```sql
UPDATE user_games
SET playedHours = playedHours + :additionalHours,
    playedAt = CURRENT_TIMESTAMP
WHERE userId = :userId AND gameId = :gameId
```

### Тесты (TDD)

```typescript
describe('Role-based Access Control', () => {
  describe('Admin role', () => {
    it("should allow admin to modify any user's items", async () => {
      const admin = await createTestUser({ role: UserRole.ADMIN })
      const user = await createTestUser({ role: UserRole.USER })
      const book = await createTestBook()
      const userBook = await createUserBook(user.id, book.id)
      const adminToken = jwtService.generateToken(admin)

      const response = await request(app)
        .put(`/user-books/${userBook.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rating: 10 })
        .expect(200)

      expect(response.body.rating).toBe(10)
    })
  })

  describe('User role', () => {
    it('should allow user to modify own items', async () => {
      const user = await createTestUser({ role: UserRole.USER })
      const book = await createTestBook()
      const userBook = await createUserBook(user.id, book.id)
      const token = jwtService.generateToken(user)

      const response = await request(app)
        .put(`/user-books/${userBook.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 8 })
        .expect(200)

      expect(response.body.rating).toBe(8)
    })

    it("should reject user modifying other user's items", async () => {
      const user1 = await createTestUser({ role: UserRole.USER })
      const user2 = await createTestUser({ role: UserRole.USER })
      const book = await createTestBook()
      const user2Book = await createUserBook(user2.id, book.id)
      const user1Token = jwtService.generateToken(user1)

      const response = await request(app)
        .put(`/user-books/${user2Book.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ rating: 9 })
        .expect(403)

      expect(response.body.message).toBe('Access denied')
    })
  })

  describe('Guest role', () => {
    it('should reject guest modifying any items', async () => {
      const guest = await createTestUser({ role: UserRole.GUEST })
      const book = await createTestBook()
      const guestBook = await createUserBook(guest.id, book.id)
      const guestToken = jwtService.generateToken(guest)

      const response = await request(app)
        .put(`/user-books/${guestBook.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ rating: 7 })
        .expect(403)

      expect(response.body.message).toBe('Access denied')
    })
  })
})
```

### Критерии завершения

- [ ] RolesGuard реализован
- [ ] Гибридная структура таблиц создана (справочники + пользовательские таблицы), обновлены
- [ ] Администратор может изменять любые элементы в пользовательских таблицах
- [ ] Обычный пользователь может изменять только свои элементы в пользовательских таблицах
- [ ] Гость не может изменять никакие элементы в пользовательских таблицах
- [ ] Все тесты проходят

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
