import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deletePrediction, fetchPredictionHistory, pinPrediction } from '../services/predictionApi'

const FILTERS = ['All', 'Probiotic', 'Non-probiotic']

function normalizeLabel(predictedClass) {
  const lower = String(predictedClass || '').toLowerCase()
  // D'abord vérifier 'non-probiotic'
  if (lower === 'non-probiotic' || lower.includes('non-probiotic') || lower === 'non probiotic') {
    return 'Non-probiotic'
  }
  // Ensuite vérifier 'probiotic'
  if (lower === 'probiotic' || lower.includes('probiotic') || lower.includes('safe')) {
    return 'Probiotic'
  }
  return 'Non-probiotic'
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toISOString().slice(0, 10)
}

function buildDownloadPayload(prediction) {
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
    results: (prediction.results || []).map((r) => ({
      sequence_id: r.sequence_id,
      predicted_class: r.predicted_class,
      confidence: r.confidence,
    })),
    message: 'Prediction loaded from history.',
  }
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function History() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionState, setActionState] = useState({
    pinId: null,
    deleteId: null,
  })

  async function loadHistory() {
    setLoading(true)
    setError('')
    try {
      const response = await fetchPredictionHistory()
      const predictions = Array.isArray(response?.predictions) ? response.predictions : []
      setGroups(predictions)
    } catch (e) {
      setError(e?.message || 'Failed to load prediction history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const filteredGroups = useMemo(() => {
    if (activeFilter === 'All') return groups
    return groups
      .map((prediction) => ({
        ...prediction,
        results: (prediction.results || []).filter((r) => normalizeLabel(r.predicted_class) === activeFilter),
      }))
      .filter((p) => p.results.length > 0)
  }, [groups, activeFilter])

  async function handleTogglePin(prediction) {
    if (!prediction || actionState.pinId || actionState.deleteId) return
    setActionState((prev) => ({ ...prev, pinId: prediction.id }))
    setError('')
    try {
      await pinPrediction(prediction.id, !prediction.is_pinned)
      setGroups((prev) =>
        prev
          .map((item) => (item.id === prediction.id ? { ...item, is_pinned: !item.is_pinned } : item))
          .sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
            return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
          })
      )
    } catch (e) {
      setError(e?.message || 'Pin action failed.')
    } finally {
      setActionState((prev) => ({ ...prev, pinId: null }))
    }
  }

  async function handleDelete(prediction) {
    if (!prediction || actionState.pinId || actionState.deleteId) return
    const confirmed = window.confirm(`Delete ${prediction.display_label || `Prediction #${prediction.id}`}?`)
    if (!confirmed) return

    setActionState((prev) => ({ ...prev, deleteId: prediction.id }))
    setError('')
    try {
      await deletePrediction(prediction.id)
      setGroups((prev) => prev.filter((item) => item.id !== prediction.id))
    } catch (e) {
      setError(e?.message || 'Delete action failed.')
    } finally {
      setActionState((prev) => ({ ...prev, deleteId: null }))
    }
  }

  function handleDownload(prediction) {
    const payload = buildDownloadPayload(prediction)
    const filename = `probio-predict-result-${prediction.id}.json`
    downloadJson(filename, payload)
  }

  return (
    <section className="page-shell">
      <section className="panel">
        <h1>Prediction history</h1>
        <p>Review previous analyses in an organized product-style history.</p>

        <div className="filter-row">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`btn ${activeFilter === f ? 'btn-accent' : 'btn-ghost'}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? <p className="muted">Loading history...</p> : null}
        {error ? <p role="alert" style={{ color: '#ffb4b4' }}>{error}</p> : null}

        {!loading && !error && filteredGroups.length === 0 ? (
          <p className="muted">No predictions found yet. Submit a CSV file to start building your history.</p>
        ) : null}

        {!loading && !error && filteredGroups.map((prediction) => (
          <article key={prediction.id} className="card card-soft section-space">
            <div className="history-header">
              <div>
                <p>
                  <strong>{prediction.display_label || `Prediction #${prediction.id}`}</strong> · {prediction.file_name}
                  {prediction.is_pinned ? <span className="badge-pinned" style={{ marginLeft: '0.55rem' }}>Pinned</span> : null}
                </p>
                <p className="muted">
                  {formatDate(prediction.submitted_at)} · {prediction.row_count} rows · {prediction.status}
                </p>
              </div>

              <div className="history-actions">
                <Link to={`/prediction-result/${prediction.id}`} className="btn btn-ghost">
                  View result
                </Link>

                <button type="button" className="btn btn-ghost" onClick={() => handleDownload(prediction)}>
                  Download
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => handleTogglePin(prediction)}
                  disabled={actionState.pinId === prediction.id || actionState.deleteId === prediction.id}
                >
                  {actionState.pinId === prediction.id ? 'Saving...' : prediction.is_pinned ? 'Unpin' : 'Pin'}
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDelete(prediction)}
                  disabled={actionState.deleteId === prediction.id || actionState.pinId === prediction.id}
                >
                  {actionState.deleteId === prediction.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            <ul className="table-list">
              {(prediction.results || []).map((result) => {
                const label = normalizeLabel(result.predicted_class)
                return (
                  <li key={result.id}>
                    <span>{result.sequence_id}</span>
                    <span>
                      <span className={`badge-pill ${label === 'Probiotic' ? 'badge-probiotic' : 'badge-non'}`}>
                        {label}
                      </span>
                    </span>
                    <span>{`${Math.round((result.confidence || 0) * 100)}%`}</span>
                    <span>{formatDate(prediction.submitted_at)}</span>
                  </li>
                )
              })}
            </ul>
          </article>
        ))}
      </section>
    </section>
  )
}

export default History