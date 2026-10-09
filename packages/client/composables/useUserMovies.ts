import type { CreateUserMovieDto, UpdateUserMovieDto, UserMovie, UserMovieStats } from '~/types/api'

export const useUserMovies = () => {
  const { request } = useApiRequest()

  const list = () => request<UserMovie[]>('/user-movies')

  const get = (id: string) => request<UserMovie>(`/user-movies/${encodeURIComponent(id)}`)

  const create = (body: CreateUserMovieDto) =>
    request<UserMovie>('/user-movies', { method: 'POST', body })

  const update = (id: string, body: UpdateUserMovieDto) =>
    request<UserMovie>(`/user-movies/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body,
    })

  const remove = (id: string) =>
    request<{ id: string }>(`/user-movies/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })

  const stats = () => request<UserMovieStats>('/user-movies/stats')

  return { list, get, create, update, remove, stats }
}
