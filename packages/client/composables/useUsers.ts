import type { User } from '~/types/api'

export const useUsers = () => {
  const { request } = useApiRequest()

  const list = () => request<User[]>('/users')

  const get = (identifier: string) => request<User>(`/users/${encodeURIComponent(identifier)}`)

  return { list, get }
}
