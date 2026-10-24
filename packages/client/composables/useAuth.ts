import type { User } from '~/types/api'

interface AuthResponse {
  token: string
  user: User
}

interface RegisterPayload {
  name: string
  username?: string
  email?: string
  password: string
}

interface LoginPayload {
  identifier: string
  password: string
}

const AUTH_TOKEN_COOKIE = 'watched.auth.token'
export const SESSION_EXPIRED_REASON = 'session-expired'
export const SESSION_EXPIRED_MESSAGE = 'Сессия завершена. Войдите снова'

export const loginRoute = (redirect: string, reason?: string) => {
  const query = new URLSearchParams()

  if (reason) {
    query.set('reason', reason)
  }

  if (redirect.startsWith('/') && !redirect.startsWith('/login')) {
    query.set('redirect', redirect)
  }

  const search = query.toString()

  return search ? `/login?${search}` : '/login'
}

export const useAuth = () => {
  const { request } = useApiRequest()
  const tokenCookie = useCookie<string | null>(AUTH_TOKEN_COOKIE, {
    sameSite: 'lax',
    path: '/',
    default: () => null,
  })

  const token = useState<string | null>('auth:token', () => tokenCookie.value ?? null)
  const user = useState<User | null>('auth:user', () => null)
  const initialized = useState<boolean>('auth:initialized', () => false)

  const persistToken = () => {
    tokenCookie.value = token.value
  }

  const logout = () => {
    token.value = null
    user.value = null
    persistToken()
    initialized.value = true
  }

  // Очищает сессию по 401 защищённого запроса. Возвращает false, если очищать уже нечего.
  const expireSession = () => {
    if (!token.value && !user.value) {
      return false
    }

    logout()

    return true
  }

  // Сеть и 5xx оставляют токен и не завершают инициализацию, чтобы проверку можно было повторить.
  const initFromStorage = async () => {
    if (initialized.value) {
      return
    }

    token.value = tokenCookie.value ?? null

    if (!token.value) {
      user.value = null
      initialized.value = true
      return
    }

    try {
      const me = await request<User>('/auth/me')

      user.value = me
      initialized.value = true
    } catch (error: unknown) {
      if (getApiErrorStatus(error) !== 401) {
        throw error
      }
    }
  }

  const setSession = (payload: AuthResponse) => {
    token.value = payload.token
    user.value = payload.user
    persistToken()
    initialized.value = true
  }

  const login = async (payload: LoginPayload) => {
    const response = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: payload,
    })

    setSession(response)
    return response
  }

  const register = async (payload: RegisterPayload) => {
    const response = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
    })

    setSession(response)
    return response
  }

  const loginAsGuest = () => {
    token.value = null
    user.value = {
      id: 'guest',
      username: 'guest',
      email: null,
      name: 'Guest',
      role: 'GUEST',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    persistToken()
    initialized.value = true
  }

  const authHeaders = computed<Record<string, string>>(() => {
    const headers: Record<string, string> = {}

    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`
    }

    return headers
  })

  const isAuthenticated = computed(() => Boolean(user.value))
  const isGuest = computed(() => user.value?.role === 'GUEST')

  return {
    token,
    user,
    isAuthenticated,
    isGuest,
    authHeaders,
    initFromStorage,
    expireSession,
    login,
    register,
    loginAsGuest,
    logout,
  }
}
