import type { Series, SeriesStats, SortOrder } from '~/types/api'

export type SeriesListParams = {
  sortBy?: string
  sortOrder?: SortOrder
}

export const useSeries = () => {
  const { request } = useApiRequest()

  const list = (params?: SeriesListParams) => request<Series[]>('/series', { params })

  const get = (id: string) => request<Series>(`/series/${encodeURIComponent(id)}`)

  const create = (body: FormData) => request<Series>('/series', { method: 'POST', body })

  const update = (id: string, body: FormData) =>
    request<Series>(`/series/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body,
    })

  const remove = async (id: string): Promise<void> => {
    await request(`/series/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  const stats = () => request<SeriesStats>('/series/stats')

  return { list, get, create, update, remove, stats }
}
