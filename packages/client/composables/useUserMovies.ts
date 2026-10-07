import type { CreateUserMovieDto, UpdateUserMovieDto, UserMovie } from '~/types/api'

export const useUserMovies = () => {
  const config = useRuntimeConfig()
  const nuxtApp = useNuxtApp()

  const request = <T>(path: string) =>
    nuxtApp.runWithContext(() => _fetch<T>(`${config.public.apiBase}${path}`))

  const list = () => request<UserMovie[]>('/user-movies')

  const get = async (id: string): Promise<UserMovie | null> => {
    try {
      return await request<UserMovie | null>(`/user-movies/${encodeURIComponent(id)}`)
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
        return null
      }
      throw error
    }
  }

  const create = (body: CreateUserMovieDto) =>
    nuxtApp.runWithContext(() =>
      _fetch<UserMovie>(`${config.public.apiBase}/user-movies`, { method: 'POST', body }),
    )

  const update = (id: string, body: UpdateUserMovieDto) =>
    nuxtApp.runWithContext(() =>
      _fetch<UserMovie>(`${config.public.apiBase}/user-movies/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body,
      }),
    )

  const remove = (id: string) =>
    nuxtApp.runWithContext(() =>
      _fetch<{ id: string }>(`${config.public.apiBase}/user-movies/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    )

  return { list, get, create, update, remove }
}
