const API_BASE_URL = 'http://127.0.0.1:8000/api/auth'

const STORAGE_KEYS = {
  access: 'pbp_access_token',
  refresh: 'pbp_refresh_token',
  user: 'pbp_user',
}

function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeError(error, fallbackMessage = 'Something went wrong. Please try again.') {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return fallbackMessage
}

function flattenBackendErrors(data) {
  if (!data) return null

  if (typeof data.detail === 'string') {
    return data.detail
  }

  if (typeof data.message === 'string') {
    return data.message
  }

  if (typeof data === 'string') {
    return data
  }

  if (typeof data === 'object') {
    const messages = []

    Object.entries(data).forEach(([field, value]) => {
      if (Array.isArray(value)) {
        messages.push(`${field}: ${value.join(' ')}`)
      } else if (typeof value === 'string') {
        messages.push(`${field}: ${value}`)
      } else if (value && typeof value === 'object') {
        messages.push(`${field}: ${JSON.stringify(value)}`)
      }
    })

    if (messages.length > 0) {
      return messages.join(' | ')
    }
  }

  return null
}

async function request(url, options = {}) {
  const response = await fetch(url, options)

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const backendMessage = flattenBackendErrors(data)
    throw new Error(backendMessage || `Request failed with status ${response.status}.`)
  }

  return data
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(STORAGE_KEYS.access, access)
  if (refresh) localStorage.setItem(STORAGE_KEYS.refresh, refresh)
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
}

export function setCurrentUser(user) {
  if (!user) return
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
}

export function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.user)
  if (!raw) return null
  return safeJsonParse(raw, null)
}

export function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.user)
}

export function logout() {
  clearTokens()
  clearCurrentUser()
}

export async function register(payload) {
  try {
    const data = await request(`${API_BASE_URL}/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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

export async function getMe() {
  const access = getAccessToken()
  if (!access) {
    throw new Error('No access token found.')
  }

  try {
    const data = await request(`${API_BASE_URL}/me/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access}`,
      },
    })

    if (data) {
      setCurrentUser(data)
    }

    return data
  } catch (error) {
    // Si token expiré/invalide, on nettoie la session locale
    logout()
    throw new Error(normalizeError(error, 'Session expired. Please login again.'))
  }
}