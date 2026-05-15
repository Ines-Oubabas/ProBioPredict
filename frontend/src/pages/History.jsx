import { useEffect, useMemo, useState } from 'react'
import { fetchPredictionHistory } from '../services/predictionApi'

const FILTERS = ['All', 'Probiotic', 'Non-probiotic']

function normalizeLabel(predictedClass) {
  const lower = String(predictedClass || '').toLowerCase()
  return lower.includes('safe') || lower.includes('probiotic') ? 'Probiotic' : 'Non-probiotic'
}

function History() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const response = await fetchPredictionHistory()
        const predictions = Array.isArray(response?.predictions) ? response.predictions : []
        if (mounted) setGroups(predictions)
      } catch (e) {
        if (mounted) setError(e?.message || 'Failed to load prediction history.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
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
            <p><strong>Prediction #{prediction.id}</strong> · {prediction.file_name}</p>
            <p className="muted">
              {new Date(prediction.submitted_at).toISOString().slice(0, 10)} · {prediction.row_count} rows · {prediction.status}
            </p>

            <ul className="table-list">
              {prediction.results.map((result) => {
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
                    <span>{new Date(prediction.submitted_at).toISOString().slice(0, 10)}</span>
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