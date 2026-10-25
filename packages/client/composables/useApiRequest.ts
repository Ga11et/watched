export interface RequestOptions {
  headers?: RequestOptionsHeaders
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET'
  body?: string | object | FormData
  params?: RequestOptionsQuery
}
export type RequestOptionsQuery = Record<string, unknown> | undefined
export type RequestOptionsHeaders = Record<string, string>

// Вход и регистрация публичны: их 401 остаются ошибками формы и не завершают сессию.
const PUBLIC_PATHS = ['/auth/login', '/auth/register']

export const useApiRequest = () => {
  const nuxtApp = useNuxtApp()

  // Принимать только путь; baseURL выбирается здесь, а вызовы выполняются через request.
  const _fetch = async <T>(path: string, opts: RequestOptions = {}) => {
    const auth = useAuth()
    const route = useRoute()
    const config = useRuntimeConfig()
    const baseURL = import.meta.server ? config.apiBase : config.public.apiBase

    if (!path.startsWith('/') || path.startsWith('//')) {
      throw new Error('_fetch accepts only internal API paths')
    }

    const headers: RequestOptionsHeaders = {
      ...opts.headers,
    }

    if (auth.token.value) {
      headers['Authorization'] = `Bearer ${auth.token.value}`
    }

    const isProtected = !PUBLIC_PATHS.includes(path)

    try {
      return await $fetch<T>(path, {
        ...opts,
        baseURL,
        headers,
      })
    } catch (error: unknown) {
      // 401 защищённого запроса очищает токен и требует перезахода.
      // В middleware navigateTo не выполняет переход: редирект делает само middleware.
      if (isProtected && getApiErrorStatus(error) === 401 && auth.expireSession()) {
        await nuxtApp.runWithContext(() =>
          navigateTo(loginRoute(route.fullPath, SESSION_EXPIRED_REASON)),
        )
      }

      throw error
    }
  }

  const request = <T>(path: string, options?: RequestOptions) =>
    nuxtApp.runWithContext(() => _fetch<T>(path, options))

  return { request }
}
