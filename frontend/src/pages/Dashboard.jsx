import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboardSummary } from '../services/predictionApi'
import { IconBolt, IconChart, IconShield } from '../components/Icons'

function resultBadgeClass(result) {
  const normalized = (result || '').toLowerCase()

  if (normalized.includes('non')) {
    return 'result-status-badge result-status-non'
  }

  return 'result-status-badge result-status-probiotic'
}

function toPercent(value) {
  const n = Number(value)

  if (!Number.isFinite(n)) return '—'

  return `${Math.round(Math.max(0, Math.min(1, n)) * 100)}%`
}

function getPlanDisplayName(plan) {
  if (!plan) return 'Free'
  return plan.name || 'Free'
}

function getPlanStatusLabel(plan) {
  const status = plan?.status || 'free'

  const labels = {
    free: 'Free',
    incomplete: 'Payment pending',
    active: 'Active',
    trialing: 'Trialing',
    past_due: 'Past due',
    canceled: 'Canceled',
    unpaid: 'Unpaid',
  }

  return labels[status] || status
}

function getUsageLabel(plan) {
  if (plan?.is_unlimited) {
    return `${plan?.used ?? 0} / Unlimited`
  }

  return `${plan?.used ?? 0} / ${plan?.limit ?? 0}`
}

function getRemainingLabel(plan) {
  if (plan?.is_unlimited) {
    return 'Unlimited'
  }

  return String(plan?.remaining ?? 0)
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

        if (mounted) {
          setSummary(data)
        }
      } catch (requestError) {
        if (mounted) {
          setError(
            requestError?.message || 'Failed to load dashboard.',
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      mounted = false
    }
  }, [])

  const plan = summary?.plan || {
    key: 'free',
    name: 'Free',
    status: 'free',
    is_premium: false,
    limit: 3,
    used: 0,
    remaining: 3,
    is_unlimited: false,
  }

  const latestPrediction = summary?.latest_prediction
  const latestResult = summary?.latest_result
  const recentHistory = Array.isArray(summary?.recent_history)
    ? summary.recent_history
    : []

  const usagePercent = useMemo(() => {
    if (plan?.is_unlimited) return 0

    const limit = Number(plan?.limit)
    const used = Number(plan?.used)

    if (!Number.isFinite(limit) || limit <= 0) return 0
    if (!Number.isFinite(used)) return 0

    return Math.min(100, Math.round((used / limit) * 100))
  }, [plan])

  const showUpgradeLink = !plan?.is_premium

  return (
    <section className="page-bg-dashboard page-shell dashboard-workspace">
      <header className="panel dashboard-header-premium">
        <div className="dashboard-header-main">
          <p className="hero-kicker">Workspace</p>
          <h1>Dashboard</h1>
          <p>
            Monitor activity, review outputs, and launch prediction tasks from
            one operational biotech workspace.
          </p>
        </div>

        <aside className="dashboard-system-ready">
          <p className="dashboard-system-ready-title">System ready</p>

          <ul className="system-ready-list">
            <li>
              <span className="status-dot" />
              Prediction pipeline active
            </li>
            <li>
              <span className="status-dot" />
              Data secured
            </li>
          </ul>

          <div className="dashboard-header-actions">
            <Link className="btn btn-accent" to="/prediction">
              Start prediction
            </Link>

            <Link className="btn btn-ghost" to="/history">
              Open history
            </Link>
          </div>
        </aside>
      </header>

      {loading ? <p className="muted">Loading dashboard...</p> : null}

      {error ? (
        <p role="alert" style={{ color: '#ffb4b4' }}>
          {error}
        </p>
      ) : null}

      {!loading && !error && (
        <>
          <section
            className="dashboard-stat-strip-premium section-space"
            aria-label="Workspace metrics"
          >
            <article className="stat-chip dashboard-kpi-chip">
              <div className="kpi-icon">
                <IconChart className="icon" />
              </div>

              <div className="kpi-meta">
                <small>Predictions used</small>
                <strong>{getUsageLabel(plan)}</strong>
                <span>
                  {getPlanDisplayName(plan)} plan
                  {plan?.is_unlimited ? ' · Unlimited usage' : ' usage'}
                </span>
              </div>
            </article>

            <article className="stat-chip dashboard-kpi-chip">
              <div className="kpi-icon">
                <IconBolt className="icon" />
              </div>

              <div className="kpi-meta">
                <small>Latest classification</small>
                <strong>
                  {latestResult?.result_label || 'No prediction yet'}
                </strong>
                <span>Last prediction</span>
              </div>
            </article>

            <article className="stat-chip dashboard-kpi-chip">
              <div className="kpi-icon">
                <IconShield className="icon" />
              </div>

              <div className="kpi-meta">
                <small>Subscription status</small>
                <strong>{getPlanStatusLabel(plan)}</strong>
                <span>
                  {plan?.is_premium
                    ? `${getPlanDisplayName(plan)} access active`
                    : `${getPlanDisplayName(plan)} plan`}
                </span>
              </div>
            </article>
          </section>

          <article className="panel dashboard-primary-surface dashboard-prediction-card section-space">
            <div className="dashboard-section-head">
              <h2>Latest prediction</h2>

              <span
                className={resultBadgeClass(
                  latestResult?.result_label || 'Probiotic',
                )}
              >
                {latestResult?.result_label || 'Pending'}
              </span>
            </div>

            {!latestPrediction ? (
              <p className="muted">
                No prediction yet. Upload your first CSV to see real metrics
                here.
              </p>
            ) : (
              <>
                <p>
                  <strong>File:</strong> {latestPrediction.file_name}
                </p>
                <p>
                  <strong>Status:</strong> {latestPrediction.status}
                </p>
                <p>
                  <strong>Rows:</strong> {latestPrediction.row_count}
                </p>
                <p>
                  <strong>Latest sequence:</strong>{' '}
                  {latestResult?.sequence_id || '—'}
                </p>
                <p>
                  <strong>Confidence:</strong>{' '}
                  {toPercent(latestResult?.confidence)}
                </p>
              </>
            )}

            <div className="confidence-track" aria-label="Plan usage">
              <div
                className="confidence-fill"
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            <p className="muted">
              {plan?.is_unlimited
                ? `${getPlanDisplayName(plan)} plan: unlimited predictions`
                : `${getPlanDisplayName(plan)} plan remaining: ${getRemainingLabel(plan)}`}
            </p>

            {showUpgradeLink ? (
              <Link className="btn btn-ghost" to="/premium">
                Upgrade plan
              </Link>
            ) : null}
          </article>

          <article className="panel dashboard-history-premium section-space">
            <div className="dashboard-section-head">
              <h2>Recent history</h2>

              <Link className="btn btn-ghost" to="/history">
                Open full history
              </Link>
            </div>

            {recentHistory.length === 0 ? (
              <p className="muted">No recent history yet.</p>
            ) : (
              <ul className="table-list">
                {recentHistory.map((row, index) => (
                  <li
                    key={`${row.prediction_id}-${row.sequence_id}-${index}`}
                  >
                    <span>{row.sequence_id}</span>

                    <span>
                      <span className={resultBadgeClass(row.result_label)}>
                        {row.result_label}
                      </span>
                    </span>

                    <span>{toPercent(row.confidence)}</span>

                    <span>
                      {new Date(row.submitted_at).toISOString().slice(0, 10)}
                    </span>
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