import { getAccessToken, logout, refreshAccessToken } from './authApi'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
).replace(/\/+$/, '')

const FIELD_LABELS = {
  full_name: 'Full name',
  email: 'Professional email',
  topic: 'Topic',
  subject: 'Subject',
  message: 'Message',
}

async function parseResponse(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function toMessages(value) {
  if (Array.isArray(value)) return value.flatMap(toMessages)

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(toMessages)
  }

  return typeof value === 'string' && value.trim()
    ? [value.trim()]
    : []
}

function errorFromResponse(statusCode, data) {
  let message = ''

  if (typeof data?.detail === 'string') {
    message = data.detail.trim()
  } else if (data && typeof data === 'object') {
    message = Object.entries(data)
      .flatMap(([field, value]) => {
        const label = FIELD_LABELS[field]
        return toMessages(value).map((text) => (
          label ? `${label}: ${text}` : text
        ))
      })
      .join('\n')
  }

  if (!message) {
    message = statusCode === 429
      ? 'Too many messages. Please wait before trying again.'
      : 'Unable to record your message. Please try again later.'
  }

  const error = new Error(message)
  error.status = statusCode
  error.data = data
  return error
}

function sessionExpiredError() {
  const error = new Error(
    'Your session has expired. Your entries have been kept. '
    + 'Please submit again as a visitor or sign in again.',
  )
  error.status = 401
  return error
}

async function postContact(payload, accessToken) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/contact/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {}),
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(
      'Unable to confirm whether your message was recorded because of a network error. '
      + 'Your entries have been kept. Please check your connection before trying again.',
    )
  }

  const data = await parseResponse(response)
  return { response, data }
}

export async function submitContactMessage({
  fullName,
  email,
  topic,
  subject,
  message,
}) {
  const payload = {
    full_name: fullName.trim(),
    email: email.trim(),
    topic: topic.trim(),
    subject: subject.trim(),
    message: message.trim(),
  }

  const accessToken = getAccessToken()
  let result = await postContact(payload, accessToken)

  if (result.response.status === 401 && accessToken) {
    let refreshedToken

    try {
      refreshedToken = await refreshAccessToken()
    } catch {
      logout()
      throw sessionExpiredError()
    }

    if (!refreshedToken) {
      logout()
      throw sessionExpiredError()
    }

    // Only one retry of the Contact request, after refreshing the token.
    result = await postContact(payload, refreshedToken)
  }

  const { response, data } = result

  if (response.status === 401) {
    logout()
    throw sessionExpiredError()
  }

  if (response.status !== 201) {
    throw errorFromResponse(response.status, data)
  }

  const hasValidConfirmation = (
    Number.isInteger(data?.id)
    && data.id > 0
    && typeof data?.created_at === 'string'
    && !Number.isNaN(new Date(data.created_at).getTime())
  )

  if (!hasValidConfirmation) {
    throw new Error(
      'The server accepted your message, but its confirmation could not be read. '
      + 'Your entries have been kept. Please avoid submitting the same message again immediately.',
    )
  }

  return data
}