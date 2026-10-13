import type { Movie, SortOrder } from '~/types/api'

export type MovieListParams = {
  sortBy?: string
  sortOrder?: SortOrder
  directorId?: string
}

export const useMovies = () => {
  const { request } = useApiRequest()

  const list = (params?: MovieListParams) => request<Movie[]>('/movies', { params })

  const get = (id: string) => request<Movie>(`/movies/${encodeURIComponent(id)}`)

  const create = (body: FormData) => request<Movie>('/movies', { method: 'POST', body })

  const update = (id: string, body: FormData) =>
    request<Movie>(`/movies/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body,
    })

  const remove = async (id: string): Promise<void> => {
    await request(`/movies/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  return { list, get, create, update, remove }
}
