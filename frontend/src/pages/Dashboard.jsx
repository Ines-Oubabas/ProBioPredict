import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboardSummary } from '../services/predictionApi'
import { IconBolt, IconChart, IconShield } from '../components/Icons'

function resultBadgeClass(result) {
  const normalized = (result || '').toLowerCase()
  if (normalized.includes('non')) return 'result-status-badge result-status-non'
  return 'result-status-badge result-status-probiotic'
}

function toPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${Math.round(Math.max(0, Math.min(1, n)) * 100)}%`
}

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    let mounted = true
    async function run() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchDashboardSummary()
        if (mounted) setSummary(data)
      } catch (e) {
        if (mounted) setError(e?.message || 'Failed to load dashboard.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [])

  const plan = summary?.plan || { name: 'Free', limit: 3, used: 0, remaining: 3 }
  const latestPrediction = summary?.latest_prediction
  const latestResult = summary?.latest_result
  const recentHistory = Array.isArray(summary?.recent_history) ? summary.recent_history : []

  const usagePercent = useMemo(() => {
    if (!plan?.limit) return 0
    return Math.min(100, Math.round((plan.used / plan.limit) * 100))
  }, [plan])

  return (
    <section className="page-bg-dashboard page-shell dashboard-workspace">
      <header className="panel dashboard-header-premium">
        <div className="dashboard-header-main">
          <p className="hero-kicker">Workspace</p>
          <h1>Dashboard</h1>
          <p>Monitor activity, review outputs, and launch prediction tasks from one operational biotech workspace.</p>
        </div>

        <aside className="dashboard-system-ready">
          <p className="dashboard-system-ready-title">System ready</p>
          <ul className="system-ready-list">
            <li><span className="status-dot" />Mock pipeline active</li>
            <li><span className="status-dot" />Data secured</li>
          </ul>
          <div className="dashboard-header-actions">
            <Link className="btn btn-accent" to="/prediction">Start prediction</Link>
            <Link className="btn btn-ghost" to="/history">Open history</Link>
          </div>
        </aside>
      </header>

      {loading ? <p className="muted">Loading dashboard...</p> : null}
      {error ? <p role="alert" style={{ color: '#ffb4b4' }}>{error}</p> : null}

      {!loading && !error && (
        <>
          <section className="dashboard-stat-strip-premium section-space" aria-label="Workspace metrics">
            <article className="stat-chip dashboard-kpi-chip">
              <div className="kpi-icon"><IconChart className="icon" /></div>
              <div className="kpi-meta">
                <small>Predictions used</small>
                <strong>{plan.used} / {plan.limit}</strong>
                <span>Free plan usage</span>
              </div>
            </article>

            <article className="stat-chip dashboard-kpi-chip">
              <div className="kpi-icon"><IconBolt className="icon" /></div>
              <div className="kpi-meta">
                <small>Latest classification</small>
                <strong>{latestResult?.result_label || 'No prediction yet'}</strong>
                <span>Last prediction</span>
              </div>
            </article>

            <article className="stat-chip dashboard-kpi-chip">
              <div className="kpi-icon"><IconShield className="icon" /></div>
              <div className="kpi-meta">
                <small>Workspace status</small>
                <strong>Healthy</strong>
                <span>System check</span>
              </div>
            </article>
          </section>

          <article className="panel dashboard-primary-surface dashboard-prediction-card section-space">
            <div className="dashboard-section-head">
              <h2>Latest prediction</h2>
              <span className={resultBadgeClass(latestResult?.result_label || 'Probiotic')}>
                {latestResult?.result_label || 'Pending'}
              </span>
            </div>

            {!latestPrediction ? (
              <p className="muted">No prediction yet. Upload your first CSV to see real metrics here.</p>
            ) : (
              <>
                <p><strong>File:</strong> {latestPrediction.file_name}</p>
                <p><strong>Status:</strong> {latestPrediction.status}</p>
                <p><strong>Rows:</strong> {latestPrediction.row_count}</p>
                <p><strong>Latest sequence:</strong> {latestResult?.sequence_id || '—'}</p>
                <p><strong>Confidence:</strong> {toPercent(latestResult?.confidence)}</p>
              </>
            )}

            <div className="confidence-track" aria-label="Plan usage">
              <div className="confidence-fill" style={{ width: `${usagePercent}%` }} />
            </div>
            <p className="muted">Free plan remaining: {plan.remaining}</p>
          </article>

          <article className="panel dashboard-history-premium section-space">
            <div className="dashboard-section-head">
              <h2>Recent history</h2>
              <Link className="btn btn-ghost" to="/history">Open full history</Link>
            </div>

            {recentHistory.length === 0 ? (
              <p className="muted">No recent history yet.</p>
            ) : (
              <ul className="table-list">
                {recentHistory.map((row, idx) => (
                  <li key={`${row.prediction_id}-${row.sequence_id}-${idx}`}>
                    <span>{row.sequence_id}</span>
                    <span><span className={resultBadgeClass(row.result_label)}>{row.result_label}</span></span>
                    <span>{toPercent(row.confidence)}</span>
                    <span>{new Date(row.submitted_at).toISOString().slice(0, 10)}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </>
      )}
    </section>
  )
}

export default Dashboard