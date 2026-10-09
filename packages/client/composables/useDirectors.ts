import type { Director, SortOrder } from '~/types/api'

export type DirectorListParams = {
  sortBy?: string
  sortOrder?: SortOrder
}

export const useDirectors = () => {
  const { request } = useApiRequest()

  const list = (params?: DirectorListParams) => request<Director[]>('/directors', { params })

  const get = (id: string) => request<Director>(`/directors/${encodeURIComponent(id)}`)

  const create = (body: FormData) => request<Director>('/directors', { method: 'POST', body })

  const update = (id: string, body: FormData) =>
    request<Director>(`/directors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body,
    })

  const remove = async (id: string): Promise<void> => {
    await request(`/directors/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  return { list, get, create, update, remove }
}
