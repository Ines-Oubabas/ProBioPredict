import { getAccessToken } from './authApi'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
).replace(/\/+$/, '')

async function parseResponse(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function getAuthHeader() {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error('You must be logged in to subscribe to a plan.')
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

function errorFromResponse(statusCode, data, fallbackMessage) {
  const detail = data?.detail || data?.message
  const message =
    typeof detail === 'string' && detail.trim()
      ? detail.trim()
      : fallbackMessage

  const error = new Error(message)
  error.status = statusCode
  error.data = data

  throw error
}

export async function createCheckoutSession(plan) {
  if (!['pro', 'lab'].includes(plan)) {
    throw new Error('Only Pro and Lab plans can be purchased through Checkout.')
  }

  const response = await fetch(
    `${API_BASE_URL}/billing/create-checkout-session/`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan }),
    },
  )

  const data = await parseResponse(response)

  if (!response.ok) {
    errorFromResponse(
      response.status,
      data,
      'Unable to create the Stripe Checkout session.',
    )
  }

  if (!data?.checkout_url) {
    throw new Error('The backend did not return a Stripe Checkout URL.')
  }

  return data
}