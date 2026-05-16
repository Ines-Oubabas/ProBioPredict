import { getAccessToken } from './authApi'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '')

async function parseResponse(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function getAuthHeader() {
  const accessToken = getAccessToken()
  if (!accessToken) throw new Error('You must be logged in to perform this action.')
  return { Authorization: `Bearer ${accessToken}` }
}

function errorFromResponse(statusCode, data, fallback) {
  const detail = data?.detail || data?.message
  const msg = typeof detail === 'string' && detail.trim() ? detail.trim() : fallback
  const error = new Error(msg)
  error.status = statusCode
  error.data = data
  return error
}

export async function uploadPredictionCsv({ csvFile }) {
  if (!csvFile) throw new Error('A CSV file is required.')

  const formData = new FormData()
  formData.append('dna_file', csvFile)

  const response = await fetch(`${API_BASE_URL}/predictions/upload/`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
  })
  const data = await parseResponse(response)
  if (!response.ok) throw errorFromResponse(response.status, data, 'Prediction upload failed.')
  return data
}

/* IMPORTANT: garder cet export */
export async function submitPredictionCsv(payload) {
  return uploadPredictionCsv(payload)
}

export async function fetchPredictionHistory() {
  const response = await fetch(`${API_BASE_URL}/predictions/history/`, {
    method: 'GET',
    headers: getAuthHeader(),
  })
  const data = await parseResponse(response)
  if (!response.ok) throw errorFromResponse(response.status, data, 'History request failed.')
  return data
}

export async function pinPrediction(predictionId, isPinned) {
  const response = await fetch(`${API_BASE_URL}/predictions/${predictionId}/pin/`, {
    method: 'PATCH',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_pinned: Boolean(isPinned) }),
  })
  const data = await parseResponse(response)
  if (!response.ok) throw errorFromResponse(response.status, data, 'Pin action failed.')
  return data
}

export async function deletePrediction(predictionId) {
  const response = await fetch(`${API_BASE_URL}/predictions/${predictionId}/delete/`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  })
  const data = await parseResponse(response)
  if (!response.ok) throw errorFromResponse(response.status, data, 'Delete action failed.')
  return data
}

export async function fetchDashboardSummary() {
  const response = await fetch(`${API_BASE_URL}/predictions/dashboard-summary/`, {
    method: 'GET',
    headers: getAuthHeader(),
  })
  const data = await parseResponse(response)
  if (!response.ok) throw errorFromResponse(response.status, data, 'Dashboard summary request failed.')
  return data
}

export async function sendPredictionResultByEmail({
  summary,
  results,
  submittedFileName = null,
  submittedSequenceId = null,
}) {
  const response = await fetch(`${API_BASE_URL}/predictions/send-result-email/`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: summary || {},
      results: Array.isArray(results) ? results : [],
      submittedFileName,
      submittedSequenceId,
    }),
  })
  const data = await parseResponse(response)
  if (!response.ok) throw errorFromResponse(response.status, data, 'Send email failed.')
  return data
}