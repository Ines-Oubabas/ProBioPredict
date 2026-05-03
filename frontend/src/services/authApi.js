const API_BASE_URL = 'http://127.0.0.1:8000/api/auth'
const TOKEN_REFRESH_CANDIDATES = [
  `${API_BASE_URL}/token/refresh/`,
  'http://127.0.0.1:8000/api/token/refresh/',
]

const STORAGE_KEYS = {
  access: 'pbp_access_token',
  refresh: 'pbp_refresh_token',
  user: 'pbp_user',
}

const AUTH_EVENT = 'pbp-auth-changed'

const FIELD_LABELS = {
  detail: '',
  non_field_errors: '',
  email: '',
  password: '',
  password_confirm: '',
  full_name: '',
  username: '',
}

function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeError(error, fallbackMessage = 'Something went wrong. Please try again.') {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error
  return fallbackMessage
}

function toMessageList(value) {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => toMessageList(item))
      .map((msg) => String(msg).trim())
      .filter(Boolean)
  }

  if (typeof value === 'object') {
    return Object.values(value)
      .flatMap((item) => toMessageList(item))
      .map((msg) => String(msg).trim())
      .filter(Boolean)
  }

  return [String(value).trim()].filter(Boolean)
}

function cleanBackendErrors(data) {
  if (!data) return null

  // Cas simple: backend renvoie déjà une string "propre"
  if (typeof data === 'string') {
    const msg = data.trim()
    return msg || null
  }

  // Cas classique DRF: { detail: "..." }
  if (typeof data?.detail === 'string' && data.detail.trim()) {
    return data.detail.trim()
  }

  // Cas alternatif: { message: "..." }
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message.trim()
  }

  // Cas objet de champs: { email: ["..."], password_confirm: ["..."] }
  if (typeof data === 'object') {
    const formatted = []

    Object.entries(data).forEach(([field, value]) => {
      const messages = toMessageList(value)
      if (messages.length === 0) return

      const fieldLabel = FIELD_LABELS[field]

      // Si label vide => on n'affiche pas "detail:", "email:", etc.
      if (fieldLabel === '') {
        formatted.push(...messages)
      } else {
        formatted.push(...messages.map((msg) => `${fieldLabel}: ${msg}`))
      }
    })

    // Dédupliquer sans casser l'ordre
    const unique = [...new Set(formatted.map((m) => m.trim()).filter(Boolean))]

    if (unique.length > 0) {
      return unique.join(' ')
    }
  }

  return null
}

function emitAuthChanged() {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT))
}

async function parseResponse(response) {
  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }
  return data
}

async function request(url, options = {}) {
  const response = await fetch(url, options)
  const data = await parseResponse(response)

  if (!response.ok) {
    const backendMessage = cleanBackendErrors(data)
    const error = new Error(backendMessage || `Request failed with status ${response.status}.`)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(STORAGE_KEYS.access, access)
  if (refresh) localStorage.setItem(STORAGE_KEYS.refresh, refresh)
  emitAuthChanged()
}

export function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.access)
}

export function getRefreshToken() {
  return localStorage.getItem(STORAGE_KEYS.refresh)
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.access)
  localStorage.removeItem(STORAGE_KEYS.refresh)
  emitAuthChanged()
}

export function setCurrentUser(user) {
  if (!user) return
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
  emitAuthChanged()
}

export function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.user)
  if (!raw) return null
  return safeJsonParse(raw, null)
}

export function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.user)
  emitAuthChanged()
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.access)
  localStorage.removeItem(STORAGE_KEYS.refresh)
  localStorage.removeItem(STORAGE_KEYS.user)
  emitAuthChanged()
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

async function tryRefreshWithUrl(url, refreshToken) {
  return request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  })
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) {
    throw new Error('No refresh token found.')
  }

  let lastError = null

  for (const endpoint of TOKEN_REFRESH_CANDIDATES) {
    try {
      const data = await tryRefreshWithUrl(endpoint, refresh)

      if (!data?.access) {
        throw new Error('Refresh endpoint response is missing access token.')
      }

      setTokens({ access: data.access, refresh: data.refresh || refresh })
      return data.access
    } catch (error) {
      lastError = error
    }
  }

  logout()
  throw new Error(normalizeError(lastError, 'Session expired. Please login again.'))
}

export async function register(payload) {
  try {
    const data = await request(`${API_BASE_URL}/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (data?.access && data?.refresh) {
      setTokens({ access: data.access, refresh: data.refresh })
    }

    if (data?.user) {
      setCurrentUser(data.user)
    }

    return data
  } catch (error) {
    throw new Error(normalizeError(error, 'Registration failed.'))
  }
}

export async function login(payload) {
  try {
    const data = await request(`${API_BASE_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (data?.access && data?.refresh) {
      setTokens({ access: data.access, refresh: data.refresh })
    }

    if (data?.user) {
      setCurrentUser(data.user)
    }

    return data
  } catch (error) {
    throw new Error(normalizeError(error, 'Login failed.'))
  }
}

async function getMeWithToken(accessToken) {
  return request(`${API_BASE_URL}/me/`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function getMe({ autoRefresh = true } = {}) {
  const access = getAccessToken()
  if (!access) throw new Error('No access token found.')

  try {
    const data = await getMeWithToken(access)
    if (data) setCurrentUser(data)
    return data
  } catch (error) {
    if (autoRefresh && error?.status === 401) {
      const newAccess = await refreshAccessToken()
      const data = await getMeWithToken(newAccess)
      if (data) setCurrentUser(data)
      return data
    }

    if (error?.status === 401 || error?.status === 403) {
      logout()
      throw new Error('Session expired. Please login again.')
    }

    throw new Error(normalizeError(error, 'Unable to fetch current user.'))
  }
}

export async function ensureValidSession() {
  if (!getAccessToken()) return null
  try {
    return await getMe({ autoRefresh: true })
  } catch {
    return null
  }
}

export function subscribeAuthChanges(callback) {
  if (typeof callback !== 'function') return () => {}

  const handler = () => callback({
    isAuthenticated: isAuthenticated(),
    user: getCurrentUser(),
  })

  window.addEventListener(AUTH_EVENT, handler)
  window.addEventListener('storage', handler)

  return () => {
    window.removeEventListener(AUTH_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}