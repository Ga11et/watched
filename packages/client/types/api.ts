/**
 * TypeScript интерфейсы для API ответов
 * @description Используется для типизации данных на фронтенде
 */

// Базовые интерфейсы
interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface User extends BaseEntity {
  username: string | null
  email: string | null
  name: string
  role: 'ADMIN' | 'USER' | 'GUEST'
  isActive: boolean
}

// Авторы
export interface Author extends BaseEntity {
  fullName: string
  photo?: string
  comment?: string
}

// Разработчики
export interface Developer extends BaseEntity {
  fullName: string
  photo?: string
  comment?: string
}

// Издатели
export interface Publisher extends BaseEntity {
  fullName: string
  photo?: string
  comment?: string
}

// Книги
export interface Book extends BaseEntity {
  title: string
  genre?: string
  publishYear?: number | string
  pageCount?: number | string
  comment?: string
  cover?: string
  authors?: Author[]
}

export interface UserBook extends BaseEntity {
  userId: string
  rating?: number | null
  readAt?: string | null
  comment?: string | null
  book: Book
}

export interface CreateBookDto {
  title: string
  authorId?: string
  genre?: string
  rating?: number
  readAt?: string
  publishYear?: number | string
  pageCount?: number | string
  comment?: string
  cover?: string
}

export interface BookStats {
  total: number
  thisMonth: number
  avgRating: number
}

// Фильмы
export interface Movie extends BaseEntity {
  title: string
  genre: string | null
  releaseYear: number | null
  poster: string | null
  directors: Director[]
}

export interface UserMovie extends BaseEntity {
  userId: string
  rating: number | null // 0-100
  watchedAt: string | null
  comment: string | null
  movie: Movie
}

export interface UserMovieStats {
  total: number
  thisMonth: number
  avgRating: number | null
}

export interface CreateUserMovieDto {
  title: string
  rating?: number | null
  watchedAt?: string | null
  comment?: string | null
}

export interface UpdateUserMovieDto {
  rating?: number | null
  watchedAt?: string | null
  comment?: string | null
}

export interface CreateMovieDto {
  title: string
  genre?: string
  directorIds?: string[]
  releaseYear?: number
}

export interface MovieStats {
  total: number
  thisMonth: number
  avgRating: number
}

// Игры
export interface Game extends BaseEntity {
  title: string
  completionDate?: string
  playTimeHours?: number
  comment?: string
  rating?: number // 0-100
  developers?: Developer[]
  publishers?: Publisher[]
}

export interface CreateGameDto {
  title: string
  completionDate?: string
  playTimeHours?: number
  comment?: string
  rating?: number
  developerIds?: string[]
  publisherIds?: string[]
}

export interface GameStats {
  total: number
  thisMonth: number
  avgRating: number
}

// Сериалы
export interface Series extends BaseEntity {
  title: string
  genre?: string
  rating?: number // 0-10
  watchedAt?: string
  comment?: string
  totalSeasons?: number
  watchedSeasons?: number
}

export interface CreateSeriesDto {
  title: string
  genre?: string
  rating?: number
  watchedAt?: string
  comment?: string
  totalSeasons?: number
  watchedSeasons?: number
}

export interface SeriesStats {
  total: number
  thisMonth: number
  avgRating: number
}

// Режиссёры
export interface Director extends BaseEntity {
  fullName: string
  photo: string | null
  comment: string | null
}

export interface CreateDirectorDto {
  name: string
  bio?: string
  birthYear?: number
  country?: string
}

export interface DirectorStats {
  total: number
}

// Google Books API
export interface GoogleBook {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    publishedDate?: string
    description?: string
    imageLinks?: {
      thumbnail?: string
    }
    pageCount?: number
    categories?: string[]
  }
}

// TMDB API
export interface TmdbMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string | null
  genre_ids: number[]
  overview: string | null
}

export interface TmdbPerson {
  id: number
  name: string
  profile_path: string | null
  birthday: string | null
  known_for_department: string | null
  popularity: number
}

export interface TmdbSeries {
  id: number
  name: string
  poster_path: string | null
  first_air_date: string | null
  genre_ids: number[]
  overview: string | null
  origin_country?: string[]
  number_of_seasons?: number
}

// API Responses
export interface ApiResponse<T> {
  data: T[]
  meta?: {
    total: number
    page: number
    limit: number
  }
}

export interface DashboardData {
  recentMovies: Movie[]
  recentGames: Game[]
  recentDirectors: Director[]
  recentSeries: Series[]
  recentBooks: Book[]
  stats: {
    movies: MovieStats
    games: GameStats
    directors: DirectorStats
    series: SeriesStats
    books: BookStats
  }
}

// Сортировка
export type SortOrder = 'ASC' | 'DESC'
export type SortableMovieFields = 'title' | 'genre' | 'releaseYear' | 'createdAt'
export type SortableGameFields = 'title' | 'rating' | 'completionDate' | 'createdAt'
export type SortableSeriesFields = 'title' | 'genre' | 'rating' | 'watchedAt' | 'createdAt'
export type SortableBookFields =
  | 'title'
  | 'author'
  | 'genre'
  | 'rating'
  | 'readAt'
  | 'publishYear'
  | 'createdAt'
