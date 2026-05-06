import { getAccessToken } from './authApi'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
).replace(/\/+$/, '')

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

  if (typeof data === 'string') {
    const msg = data.trim()
    return msg || null
  }

  if (typeof data?.detail === 'string' && data.detail.trim()) {
    return data.detail.trim()
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message.trim()
  }

  if (typeof data === 'object') {
    const formatted = []

    Object.values(data).forEach((value) => {
      const messages = toMessageList(value)
      if (messages.length > 0) {
        formatted.push(...messages)
      }
    })

    const unique = [...new Set(formatted.map((m) => m.trim()).filter(Boolean))]
    if (unique.length > 0) return unique.join(' ')
  }

  return null
}

function normalizeError(error, fallbackMessage = 'Something went wrong. Please try again.') {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error
  return fallbackMessage
}

async function parseResponse(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function uploadPredictionCsv({ csvFile, sequenceId = '' }) {
  if (!csvFile) {
    throw new Error('A CSV file is required.')
  }

  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('You must be logged in to submit a prediction file.')
  }

  const formData = new FormData()
  formData.append('dna_file', csvFile)

  const cleanedSequenceId = String(sequenceId || '').trim()
  if (cleanedSequenceId) {
    formData.append('sequence_id', cleanedSequenceId)
  }

  const response = await fetch(`${API_BASE_URL}/predictions/upload/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    const backendMessage = cleanBackendErrors(data)
    const error = new Error(
      backendMessage || `Prediction upload failed with status ${response.status}.`
    )
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function submitPredictionCsv(payload) {
  try {
    return await uploadPredictionCsv(payload)
  } catch (error) {
    throw new Error(normalizeError(error, 'Prediction submission failed.'))
  }
}
