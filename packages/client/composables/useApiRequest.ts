export interface RequestOptions {
  headers?: RequestOptionsHeaders
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET'
  body?: string | object | FormData
  params?: RequestOptionsQuery
}
export type RequestOptionsQuery = Record<string, unknown> | undefined
export type RequestOptionsHeaders = Record<string, string>

export const useApiRequest = () => {
  const nuxtApp = useNuxtApp()

  // TODO: Принимать только путь, выбирать baseURL здесь и убрать apiBase из всех вызовов _fetch.
  const _fetch = async <T>(path: string, opts: RequestOptions = {}) => {
    const { token } = useAuth()
    const config = useRuntimeConfig()
    const baseURL = import.meta.server ? config.apiBase : config.public.apiBase

    if (!path.startsWith('/') || path.startsWith('//')) {
      throw new Error('_fetch accepts only internal API paths')
    }

    const headers: RequestOptionsHeaders = {
      ...opts.headers,
    }

    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    return $fetch<T>(path, {
      ...opts,
      baseURL,
      headers,
    })
  }

  const request = <T>(path: string, options?: RequestOptions) =>
    nuxtApp.runWithContext(() => _fetch<T>(path, options))

  return { _fetch, request }
}
