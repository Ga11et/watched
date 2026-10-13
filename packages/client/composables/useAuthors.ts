import type { Author, SortOrder } from '~/types/api'

export type AuthorListParams = {
  sortBy?: string
  sortOrder?: SortOrder
  limit?: number
}

export const useAuthors = () => {
  const { request } = useApiRequest()

  const list = (params?: AuthorListParams) => request<Author[]>('/authors', { params })

  const search = (query: string) => request<Author[]>('/authors/search', { params: { q: query } })

  const get = (id: string) => request<Author>(`/authors/${encodeURIComponent(id)}`)

  const create = (body: FormData) => request<Author>('/authors', { method: 'POST', body })

  const update = (id: string, body: FormData) =>
    request<Author>(`/authors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body,
    })

  const remove = async (id: string): Promise<void> => {
    await request(`/authors/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  return { list, search, get, create, update, remove }
}
