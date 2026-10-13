import type { Game, GameStats, SortOrder } from '~/types/api'

export type GameListParams = {
  sortBy?: string
  sortOrder?: SortOrder
  limit?: number
}

export const useGames = () => {
  const { request } = useApiRequest()

  const list = (params?: GameListParams) => request<Game[]>('/games', { params })

  const get = (id: string) => request<Game>(`/games/${encodeURIComponent(id)}`)

  const create = (body: FormData) => request<Game>('/games', { method: 'POST', body })

  const update = (id: string, body: FormData) =>
    request<Game>(`/games/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body,
    })

  const remove = async (id: string): Promise<void> => {
    await request(`/games/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  const stats = () => request<GameStats>('/games/stats')

  return { list, get, create, update, remove, stats }
}
