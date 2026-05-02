import { Link } from 'react-router-dom'
import { dashboardStats, quickActions, recentHistory, systemStatus } from '../data/mockData'
import { IconBolt, IconChart, IconShield } from '../components/Icons'

function toneClass(tone) {
  if (tone === 'active') return 'tone-active'
  if (tone === 'healthy') return 'tone-healthy'
  return 'tone-pending'
}

function Dashboard() {
  return (
    <section className="page-bg-dashboard page-shell">
      <section className="panel">
        <h1>Dashboard</h1>
        <p>Get a fast overview of activity, status, and recent prediction outcomes.</p>

        <div className="kpi-grid section-space">
          <article className="kpi-card card card-elevated">
            <IconChart className="icon" />
            <small>{dashboardStats[0].label}</small>
            <strong>{dashboardStats[0].value}</strong>
          </article>

          <article className="kpi-card card card-elevated">
            <IconBolt className="icon" />
            <small>{dashboardStats[1].label}</small>
            <strong>{dashboardStats[1].value}</strong>
          </article>

          <article className="kpi-card card card-elevated">
            <IconShield className="icon" />
            <small>{dashboardStats[2].label}</small>
            <strong>{dashboardStats[2].value}</strong>
          </article>
        </div>
      </section>

      <section className="panel section-space dashboard-three">
        <article className="card card-soft">
          <h3>Quick actions</h3>
          <ul className="simple-list">
            {quickActions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <div className="form-actions">
            <Link className="btn btn-accent" to="/prediction">
              Start prediction
            </Link>
            <Link className="btn btn-ghost" to="/history">
              Open history
            </Link>
          </div>
        </article>

        <article className="card card-soft">
          <h3>System status</h3>
          <ul className="status-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {systemStatus.map((s) => (
              <li
                key={s.key}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem' }}
              >
                <span>{s.key}</span>
                <span className={`status-pill ${toneClass(s.tone)}`}>{s.value}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card card-accent-left">
          <h3>ML integration status</h3>
          <p className="status-pill tone-pending">Pending</p>
          <p>Advanced model connection is planned for the next product milestone.</p>
        </article>
      </section>

      <section className="panel section-space dashboard-main-grid">
        <article className="card card-feature">
          <h3>Latest prediction</h3>
          <p className="result-label">L. casei A17</p>
          <p>
            Classification: <strong>Probiotic</strong>
          </p>
          <p>
            Confidence: <strong>92%</strong>
          </p>
          <Link className="btn btn-accent" to="/prediction-result">
            View full result
          </Link>
        </article>

        <article className="card card-soft">
          <h3>Recent history</h3>
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
                <span>{row.result}</span>
                <span>{row.confidence}</span>
                <span>{row.date}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </section>
  )
}

export default Dashboard