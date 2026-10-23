import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deletePrediction, fetchPredictionHistory, pinPrediction } from '../services/predictionApi'

const FILTERS = ['All', 'Probiotic', 'Non-probiotic']

function isResultObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeLabel(predictedClass) {
  const lower = String(predictedClass || '').trim().toLowerCase()

  if (
    lower.includes('non-probiotic') ||
    lower.includes('non probiotic') ||
    lower.includes('nonprobiotic')
  ) {
    return 'Non-probiotic'
  }

  if (lower.includes('probiotic') || lower.includes('safe')) {
    return 'Probiotic'
  }

  return null
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toISOString().slice(0, 10)
}

function formatConfidence(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return `${Math.round(value * 100)}%`
}

function buildDownloadPayload(prediction) {
  const result = prediction.result

  return {
    exported_at: new Date().toISOString(),
    source: 'ProBioPredict',
    summary: {
      prediction_id: prediction.id,
      rows_received: prediction.row_count,
      columns: ['sequence_id', 'truncated_dna'],
      model_mode: prediction.model_mode,
      file_name: prediction.file_name,
      status: prediction.status,
      submitted_at: prediction.submitted_at,
      is_pinned: prediction.is_pinned,
    },
    result: {
      id: result.id,
      sequence_id: result.sequence_id,
      predicted_class: result.predicted_class,
      confidence: result.confidence,
      created_at: result.created_at,
    },
    message: 'Prediction loaded from history.',
  }
}

function downloadJson(filename, payload) {
  const blob = new Blob(
    [JSON.stringify(payload, null, 2)],
    { type: 'application/json;charset=utf-8' }
  )
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function noResultMessage(prediction) {
  if (prediction.status === 'failed') {
    return 'This prediction failed. No result is available.'
  }

  if (prediction.status === 'pending') {
    return 'This prediction is pending. No result is available yet.'
  }

  return 'No result is available for this prediction.'
}

function History() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionState, setActionState] = useState({
    pinId: null,
    deleteId: null,
  })

  useEffect(() => {
    let mounted = true

    async function loadHistory() {
      setLoading(true)
      setError('')

      try {
        const response = await fetchPredictionHistory()
        if (!mounted) return

        setPredictions(
          Array.isArray(response?.predictions) ? response.predictions : []
        )
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'Failed to load prediction history.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadHistory()

    return () => {
      mounted = false
    }
  }, [])

  const filteredPredictions = useMemo(() => {
    if (activeFilter === 'All') return predictions

    return predictions.filter((prediction) => (
      isResultObject(prediction.result) &&
      normalizeLabel(prediction.result.predicted_class) === activeFilter
    ))
  }, [predictions, activeFilter])

  async function handleTogglePin(prediction) {
    if (!prediction || actionState.pinId || actionState.deleteId) return

    setActionState((prev) => ({ ...prev, pinId: prediction.id }))
    setError('')

    try {
      await pinPrediction(prediction.id, !prediction.is_pinned)

      setPredictions((prev) => (
        prev
          .map((item) => (
            item.id === prediction.id
              ? { ...item, is_pinned: !prediction.is_pinned }
              : item
          ))
          .sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
            return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
          })
      ))
    } catch (e) {
      setError(e?.message || 'Pin action failed.')
    } finally {
      setActionState((prev) => ({ ...prev, pinId: null }))
    }
  }

  async function handleDelete(prediction) {
    if (!prediction || actionState.pinId || actionState.deleteId) return

    const confirmed = window.confirm(
      `Delete ${prediction.display_label || `Prediction #${prediction.id}`}?`
    )
    if (!confirmed) return

    setActionState((prev) => ({ ...prev, deleteId: prediction.id }))
    setError('')

    try {
      await deletePrediction(prediction.id)
      setPredictions((prev) => (
        prev.filter((item) => item.id !== prediction.id)
      ))
    } catch (e) {
      setError(e?.message || 'Delete action failed.')
    } finally {
      setActionState((prev) => ({ ...prev, deleteId: null }))
    }
  }

  function handleDownload(prediction) {
    if (!isResultObject(prediction?.result)) return

    const payload = buildDownloadPayload(prediction)
    const filename = `probio-predict-result-${prediction.id}.json`
    downloadJson(filename, payload)
  }

  const actionInProgress = Boolean(actionState.pinId || actionState.deleteId)

  return (
    <section className="page-shell">
      <section className="panel">
        <h1>Prediction history</h1>
        <p>Review previous analyses in an organized product-style history.</p>

        <div className="filter-row">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`btn ${activeFilter === filter ? 'btn-accent' : 'btn-ghost'}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {loading ? <p className="muted">Loading history...</p> : null}
        {error ? (
          <p role="alert" style={{ color: '#ffb4b4' }}>{error}</p>
        ) : null}

        {!loading && !error && filteredPredictions.length === 0 ? (
          <p className="muted">
            {predictions.length === 0
              ? 'No predictions found yet. Submit a CSV file containing one DNA sequence to start building your history.'
              : 'No predictions match this filter.'}
          </p>
        ) : null}

        {!loading && !error && filteredPredictions.map((prediction) => {
          const result = isResultObject(prediction.result)
            ? prediction.result
            : null
          const label = result
            ? normalizeLabel(result.predicted_class)
            : null

          const badgeClass = label === 'Probiotic'
            ? 'badge-pill badge-probiotic'
            : label === 'Non-probiotic'
              ? 'badge-pill badge-non'
              : 'badge-pill'

          return (
            <article
              key={prediction.id}
              className="card card-soft section-space"
            >
              <div className="history-header">
                <div>
                  <p>
                    <strong>
                      {prediction.display_label || `Prediction #${prediction.id}`}
                    </strong>
                    {' · '}
                    {prediction.file_name}
                    {prediction.is_pinned ? (
                      <span
                        className="badge-pinned"
                        style={{ marginLeft: '0.55rem' }}
                      >
                        Pinned
                      </span>
                    ) : null}
                  </p>

                  <p className="muted">
                    {formatDate(prediction.submitted_at)}
                    {' · '}
                    {prediction.row_count}
                    {' '}
                    {prediction.row_count === 1 ? 'sequence' : 'sequences'}
                    {' · '}
                    {prediction.status}
                  </p>
                </div>

                <div className="history-actions">
                  <Link
                    to={`/prediction-result/${prediction.id}`}
                    className="btn btn-ghost"
                  >
                    View result
                  </Link>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleDownload(prediction)}
                    disabled={!result}
                  >
                    Download
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleTogglePin(prediction)}
                    disabled={actionInProgress}
                  >
                    {actionState.pinId === prediction.id
                      ? 'Saving...'
                      : prediction.is_pinned ? 'Unpin' : 'Pin'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDelete(prediction)}
                    disabled={actionInProgress}
                  >
                    {actionState.deleteId === prediction.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </div>
              </div>

              {result ? (
                <ul className="table-list">
                  <li>
                    <span>{result.sequence_id || '—'}</span>
                    <span>
                      <span className={badgeClass}>
                        {label || result.predicted_class || 'Unknown'}
                      </span>
                    </span>
                    <span>{formatConfidence(result.confidence)}</span>
                    <span>{formatDate(prediction.submitted_at)}</span>
                  </li>
                </ul>
              ) : (
                <p className="muted" role="status">
                  {noResultMessage(prediction)}
                </p>
              )}
            </article>
          )
        })}
      </section>
    </section>
  )
}

export default History