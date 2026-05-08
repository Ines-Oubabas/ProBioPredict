import { Link } from 'react-router-dom'
import { dashboardStats, recentHistory, systemStatus } from '../data/mockData'
import { IconBolt, IconChart, IconShield } from '../components/Icons'

function toneClass(tone) {
  if (tone === 'active') return 'tone-active'
  if (tone === 'healthy') return 'tone-healthy'
  return 'tone-pending'
}

function resultBadgeClass(result) {
  const normalized = (result || '').toLowerCase()
  if (normalized.includes('non')) return 'result-status-badge result-status-non'
  return 'result-status-badge result-status-probiotic'
}

function parseConfidence(value) {
  const n = Number(String(value || '').replace('%', '').trim())
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0
}

function Dashboard() {
  const latestHistory = recentHistory?.[0] ?? {
    sequence: 'N/A',
    result: 'Pending',
    confidence: '0%',
    date: '—',
  }

  const confidenceValue = parseConfidence(latestHistory.confidence)

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
            <li>
              <span className="status-dot" />
              Mock pipeline active
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

      <section className="dashboard-stat-strip-premium section-space" aria-label="Workspace metrics">
        <article className="stat-chip dashboard-kpi-chip">
          <div className="kpi-icon">
            <IconChart className="icon" />
          </div>
          <div className="kpi-meta">
            <small>Predictions this month</small>
            <strong>{dashboardStats?.[0]?.value ?? '0'}</strong>
            <span>Current usage</span>
          </div>
        </article>

        <article className="stat-chip dashboard-kpi-chip">
          <div className="kpi-icon">
            <IconBolt className="icon" />
          </div>
          <div className="kpi-meta">
            <small>Latest classification</small>
            <strong>{latestHistory.result}</strong>
            <span>Last prediction</span>
          </div>
        </article>

        <article className="stat-chip dashboard-kpi-chip">
          <div className="kpi-icon">
            <IconShield className="icon" />
          </div>
          <div className="kpi-meta">
            <small>Workspace status</small>
            <strong>{dashboardStats?.[2]?.value ?? 'Healthy'}</strong>
            <span>System check</span>
          </div>
        </article>
      </section>

      <section className="dashboard-layout section-space">
        <div className="dashboard-main-col">
          <article className="panel dashboard-primary-surface dashboard-prediction-card">
            <div className="dashboard-section-head">
              <h2>Latest prediction</h2>
              <span className={resultBadgeClass(latestHistory.result)}>{latestHistory.result}</span>
            </div>

            <div className="prediction-main-grid">
              <div className="prediction-main-content">
                <p className="result-label">{latestHistory.sequence}</p>

                <p>
                  Classification: <strong>{latestHistory.result}</strong>
                </p>
                <p>
                  Confidence: <strong>{latestHistory.confidence}</strong>
                </p>
                <p className="muted">Generated on {latestHistory.date}</p>

                <div className="confidence-track" aria-label="Prediction confidence">
                  <div className="confidence-fill" style={{ width: `${confidenceValue}%` }} />
                </div>

                <div className="dashboard-prediction-actions">
                  <Link className="btn btn-ghost" to="/prediction-result">
                    View latest result
                  </Link>
                  <Link className="btn btn-accent" to="/prediction">
                    Start new prediction
                  </Link>
                </div>
              </div>

              <div className="prediction-score-panel">
                <small>Confidence score</small>
                <strong>{latestHistory.confidence}</strong>
                <p className="muted">Prediction quality indicator from current mock pipeline.</p>
              </div>
            </div>
          </article>

          <article className="panel dashboard-history-premium">
            <div className="dashboard-section-head">
              <h2>Recent history</h2>
              <Link className="btn btn-ghost" to="/history">
                Open full history
              </Link>
            </div>

            <div className="table-head">
              <span>Sequence</span>
              <span>Result</span>
              <span>Confidence</span>
              <span>Date</span>
            </div>

            <ul className="table-list">
              {recentHistory.map((row) => (
                <li key={`${row.sequence}-${row.date}`}>
                  <span>{row.sequence}</span>
                  <span>
                    <span className={resultBadgeClass(row.result)}>{row.result}</span>
                  </span>
                  <span>{row.confidence}</span>
                  <span>{row.date}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <aside className="dashboard-side-col">
          <article className="panel dashboard-secondary-surface dashboard-quick-actions">
            <h3>Quick actions</h3>
            <p className="muted">Shortcuts for your most frequent tasks.</p>

            <div className="dashboard-action-list">
              <Link className="btn btn-accent" to="/prediction">
                Start prediction
              </Link>
              <Link className="btn btn-ghost" to="/history">
                Open history
              </Link>
              <Link className="btn btn-ghost" to="/prediction-result">
                View latest result
              </Link>
            </div>
          </article>

          <article className="panel dashboard-secondary-surface dashboard-system">
            <h3>Workspace status</h3>
            <p className="muted">Current service health.</p>

            <ul className="status-list dashboard-status-list">
              {systemStatus.map((s) => (
                <li key={s.key} className="dashboard-status-row">
                  <span>{s.key}</span>
                  <span className={`status-pill ${toneClass(s.tone)}`}>{s.value}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel dashboard-secondary-surface dashboard-ml-status">
            <h3>ML integration status</h3>
            <p className="status-pill tone-pending">Planned milestone</p>
            <p className="muted">
              The production ML model will be integrated later. Current outputs rely on a validated mock prediction
              pipeline for product workflow testing.
            </p>
          </article>
        </aside>
      </section>
    </section>
  )
}

export default Dashboard