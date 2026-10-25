import type { UpdateUserDto, User } from '~/types/api'

export const useUsers = () => {
  const { request } = useApiRequest()

  const list = () => request<User[]>('/users')

  const get = (identifier: string) => request<User>(`/users/${encodeURIComponent(identifier)}`)

  const update = (id: string, patch: UpdateUserDto) =>
    request<User>(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch })

  return { list, get, update }
}
