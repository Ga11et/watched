import type { UpdateUserDto, User, UserDeletionSummary } from '~/types/api'

export const useUsers = () => {
  const { request } = useApiRequest()

  const list = () => request<User[]>('/users')

  const get = (identifier: string) => request<User>(`/users/${encodeURIComponent(identifier)}`)

  const update = (id: string, patch: UpdateUserDto) =>
    request<User>(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch })

  const remove = (identifier: string) =>
    request(`/users/${encodeURIComponent(identifier)}`, { method: 'DELETE' })

  const getDeletionSummary = (identifier: string) =>
    request<UserDeletionSummary>(`/users/${encodeURIComponent(identifier)}/deletion-summary`)

  return { list, get, update, remove, getDeletionSummary }
}
