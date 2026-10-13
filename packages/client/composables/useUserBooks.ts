import type { UpdateUserBookDto, UserBook, UserBookStats } from '~/types/api'

export const useUserBooks = () => {
  const { request } = useApiRequest()

  const list = () => request<UserBook[]>('/user-books')

  const get = (id: string) => request<UserBook>(`/user-books/${encodeURIComponent(id)}`)

  const create = (body: FormData) => request<UserBook>('/user-books', { method: 'POST', body })

  const update = (id: string, body: UpdateUserBookDto) =>
    request<UserBook>(`/user-books/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body,
    })

  const remove = (id: string) =>
    request<{ id: string }>(`/user-books/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })

  const stats = () => request<UserBookStats>('/user-books/stats')

  return { list, get, create, update, remove, stats }
}
