import type { Publisher, SortOrder } from '~/types/api'

export type PublisherListParams = {
  sortBy?: string
  sortOrder?: SortOrder
  limit?: number
}

export const usePublishers = () => {
  const { request } = useApiRequest()

  const list = (params?: PublisherListParams) => request<Publisher[]>('/publishers', { params })

  const search = (query: string) =>
    request<Publisher[]>('/publishers/search', { params: { q: query } })

  const get = (id: string) => request<Publisher>(`/publishers/${encodeURIComponent(id)}`)

  const create = (body: FormData) => request<Publisher>('/publishers', { method: 'POST', body })

  const update = (id: string, body: FormData) =>
    request<Publisher>(`/publishers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body,
    })

  const remove = async (id: string): Promise<void> => {
    await request(`/publishers/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  return { list, search, get, create, update, remove }
}
