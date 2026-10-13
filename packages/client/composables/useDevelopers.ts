import type { Developer, SortOrder } from '~/types/api'

export type DeveloperListParams = {
  sortBy?: string
  sortOrder?: SortOrder
  limit?: number
}

export const useDevelopers = () => {
  const { request } = useApiRequest()

  const list = (params?: DeveloperListParams) => request<Developer[]>('/developers', { params })

  const search = (query: string) =>
    request<Developer[]>('/developers/search', { params: { q: query } })

  const get = (id: string) => request<Developer>(`/developers/${encodeURIComponent(id)}`)

  const create = (body: FormData) => request<Developer>('/developers', { method: 'POST', body })

  const update = (id: string, body: FormData) =>
    request<Developer>(`/developers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body,
    })

  const remove = async (id: string): Promise<void> => {
    await request(`/developers/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  return { list, search, get, create, update, remove }
}
