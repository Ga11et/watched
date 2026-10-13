import type { Book, SortOrder } from '~/types/api'

export type BookListParams = {
  sortBy?: string
  sortOrder?: SortOrder
  authorId?: string
  search?: string
  limit?: number
}

export const useBooks = () => {
  const { request } = useApiRequest()

  const list = (params?: BookListParams) => request<Book[]>('/books', { params })

  const search = (query: string, limit: number) => list({ search: query, limit })

  const get = (id: string) => request<Book>(`/books/${encodeURIComponent(id)}`)

  const create = (body: FormData) => request<Book>('/books', { method: 'POST', body })

  const update = (id: string, body: FormData) =>
    request<Book>(`/books/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body,
    })

  const remove = async (id: string): Promise<void> => {
    await request(`/books/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  return { list, search, get, create, update, remove }
}
