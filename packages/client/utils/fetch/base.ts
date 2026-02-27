export interface RequestOptions {
  headers?: RequestOptionsHeaders
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET'
  body?: string | object | FormData
  query?: RequestOptionsQuery
}
export type RequestOptionsQuery = Record<string, unknown> | undefined
export type RequestOptionsHeaders = Record<string, string>

export async function _fetch<T>(req: string, opts: RequestOptions = {}) {
  const { token } = useAuth()

  const headers: RequestOptionsHeaders = {
    ...opts.headers,
  }

  if (token.value) {
    headers['Authorization'] = `Bearer ${token.value}`
  }

  return $fetch<T>(req, {
    ...opts,
    headers,
  })
}
