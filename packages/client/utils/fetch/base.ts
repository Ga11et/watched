export interface RequestOptions {
  headers?: RequestOptionsHeaders
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET'
  body?: string | object | FormData
  params?: RequestOptionsQuery
}
export type RequestOptionsQuery = Record<string, unknown> | undefined
export type RequestOptionsHeaders = Record<string, string>

// TODO: Принимать только путь, выбирать baseURL здесь и убрать apiBase из всех вызовов _fetch.
export async function _fetch<T>(req: string, opts: RequestOptions = {}) {
  const { token } = useAuth()
  const config = useRuntimeConfig()
  const url = import.meta.server
    ? `${config.apiBase}${req.slice(config.public.apiBase.length)}`
    : req

  const headers: RequestOptionsHeaders = {
    ...opts.headers,
  }

  if (token.value) {
    headers['Authorization'] = `Bearer ${token.value}`
  }

  return $fetch<T>(url, {
    ...opts,
    headers,
  })
}
