// frontend/src/pages/History.jsx

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPredictionHistory } from '../services/predictionApi'

const FILTERS = ['All', 'Probiotic', 'Non-probiotic']

function toHistoryRows(predictions) {
  const rows = []

  predictions.forEach((prediction) => {
    const dateLabel = prediction?.submitted_at
      ? new Date(prediction.submitted_at).toISOString().slice(0, 10)
      : '—'

    const results = Array.isArray(prediction?.results) ? prediction.results : []

    results.forEach((result, index) => {
      const predictedClass = String(result?.predicted_class || '').toLowerCase()
      const isProbiotic = predictedClass.includes('safe') || predictedClass.includes('probiotic')

      rows.push({
        id: `${prediction.id}-${result.id || index}`,
        sequence: result?.sequence_id || '—',
        result: isProbiotic ? 'Probiotic' : 'Non-probiotic',
        confidence:
          typeof result?.confidence === 'number'
            ? `${Math.round(result.confidence * 100)}%`
            : '—',
        date: dateLabel,
      })
    })
  })

  return rows
}

function History() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [historyRows, setHistoryRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadHistory() {
      setLoading(true)
      setError('')

      try {
        const response = await fetchPredictionHistory()
        const predictions = Array.isArray(response?.predictions) ? response.predictions : []
        const mapped = toHistoryRows(predictions)

        if (isMounted) {
          setHistoryRows(mapped)
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load prediction history.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [])

  const rows = useMemo(() => {
    if (activeFilter === 'All') return historyRows
    return historyRows.filter((r) => r.result === activeFilter)
  }, [activeFilter, historyRows])

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

        <article className="card card-soft section-space">
          <div className="table-head">
            <span>Sequence</span>
            <span>Result</span>
            <span>Confidence</span>
            <span>Date</span>
            <span>Action</span>
          </div>

          {loading ? <p className="muted">Loading history...</p> : null}
          {error ? (
            <p style={{ color: '#ffb4b4', marginTop: '0.5rem' }} role="alert" aria-live="assertive">
              {error}
            </p>
          ) : null}

          {!loading && !error && rows.length === 0 ? (
            <p className="muted">No predictions found yet. Submit a CSV file to start building your history.</p>
          ) : null}

          {!loading && !error && rows.length > 0 ? (
            <ul className="table-list">
              {rows.map((row) => (
                <li key={row.id}>
                  <span>{row.sequence}</span>
                  <span>
                    <span className={`badge-pill ${row.result === 'Probiotic' ? 'badge-probiotic' : 'badge-non'}`}>
                      {row.result}
                    </span>
                  </span>
                  <span>{row.confidence}</span>
                  <span>{row.date}</span>
                  <span>
                    <Link className="btn btn-ghost" to="/prediction-result">
                      View details
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </section>
    </section>
  )
}

export default History