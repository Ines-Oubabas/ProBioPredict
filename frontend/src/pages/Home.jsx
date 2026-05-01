import { Link } from 'react-router-dom'
import {
  dashboardStats,
  heroIndicators,
  modules,
  recentHistory,
  whyProBioPredict,
  workflowSteps,
} from '../data/mockData'
import { IconChart, IconLock, IconShield, IconSpark } from '../components/Icons'

function Home() {
  return (
    <>
      <section className="hero-landing page-shell">
        <div className="hero-overlay" />
        <div className="hero-content-wrap centered-hero">
          <p className="hero-kicker">Biotech prediction platform</p>
          <h1 className="hero-title">Turn genomic data into confident probiotic insights</h1>
          <p className="hero-subtitle">
            A modern workspace to submit sequences, understand results quickly, and follow your progress.
          </p>

          <div className="hero-indicators">
            {heroIndicators.map((label) => (
              <span key={label} className="chip">{label}</span>
            ))}
          </div>

          <div className="hero-actions">
            <Link className="btn btn-accent" to="/prediction">Start prediction</Link>
            <a className="btn btn-ghost" href="#why">Learn more</a>
          </div>
        </div>
      </section>

      <section className="panel section-space page-shell">
        <h2 className="section-title">Why ProBioPredict?</h2>
        <div className="cards-grid cards-grid-3">
          {whyProBioPredict.map((item) => (
            <article className="card card-soft" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <p className="cred-line">Designed for students, researchers, and biotech projects.</p>
      </section>

      <section className="panel section-space page-shell">
        <h2 className="section-title">How it works</h2>
        <div className="timeline-wrap">
          {workflowSteps.map((step) => (
            <article className="timeline-step" key={step.id}>
              <span className="timeline-index">{step.id}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel section-space break-panel page-shell">
        <p className="break-kicker">Insight bridge</p>
        <h2 className="section-title">From raw data to intelligent insights</h2>
      </section>

      <section className="panel section-space page-shell">
        <h2 className="section-title">Platform modules</h2>
        <div className="feature-mosaic">
          <article className="feature-main">
            <span className="feature-icon-box"><IconShield /></span>
            <h3>Secure workspace</h3>
            <p>Keep your workflow private, organized, and accessible only to the right people.</p>
          </article>

          {modules.slice(1).map((mod) => (
            <article className="feature-side" key={mod.name}>
              <h3>{mod.name}</h3>
              <p>{mod.hint}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel section-space page-shell">
        <h2 className="section-title">Dashboard preview</h2>
        <div className="dashboard-showcase">
          <article className="dashboard-main">
            <div className="screen-topbar">
              <span className="dot dot-r" />
              <span className="dot dot-y" />
              <span className="dot dot-g" />
              <p>Product preview</p>
            </div>

            <div className="screen-stats">
              {dashboardStats.map((stat) => (
                <div className="screen-stat" key={stat.label}>
                  <small>{stat.label}</small>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>

            <div className="latest-block">
              <h3>Latest prediction</h3>
              <p className="result-label">L. casei A17</p>
              <p>Classification: <strong className="badge-good">Probiotic</strong></p>
              <p>Confidence: <strong>92%</strong></p>
            </div>
          </article>

          <aside className="dashboard-side">
            <article className="side-block">
              <h3>Quick snapshot</h3>
              <p>Clean statuses, clear confidence, and immediate access to latest output.</p>
              <Link className="text-link" to="/dashboard">Open dashboard →</Link>
            </article>

            <article className="side-block">
              <h3>Recent history</h3>
              <ul className="compact-history-list">
                {recentHistory.slice(0, 4).map((item) => (
                  <li key={`${item.sequence}-${item.date}`}>
                    <span className="history-name">{item.sequence}</span>
                    <span className="history-status">{item.result}</span>
                    <strong className="history-score">{item.confidence}</strong>
                  </li>
                ))}
              </ul>
            </article>
          </aside>
        </div>
      </section>

      <section className="panel section-space page-shell">
        <h2 className="section-title">Data privacy & secure workflow</h2>
        <div className="trust-grid">
          <article className="trust-card">
            <span className="trust-icon-wrap"><IconLock /></span>
            <h3>Private workspace</h3>
            <p>Keep analyses in a dedicated and protected environment.</p>
          </article>
          <article className="trust-card">
            <span className="trust-icon-wrap"><IconShield /></span>
            <h3>Secure data handling</h3>
            <p>Submitted data is managed with a security-first workflow.</p>
          </article>
          <article className="trust-card">
            <span className="trust-icon-wrap"><IconChart /></span>
            <h3>Controlled access</h3>
            <p>Control who can access project outputs.</p>
          </article>
        </div>
      </section>

      <section className="panel cta-panel section-space page-shell">
        <IconSpark className="icon icon-accent" />
        <h2 className="section-title">Ready to start your first prediction workflow?</h2>
        <p>Explore the platform, run basic predictions, and upgrade when you need advanced features.</p>
        <div className="cta-actions">
          <Link className="btn btn-accent" to="/prediction">Start prediction</Link>
          <Link className="btn btn-ghost" to="/premium">View premium plans</Link>
        </div>
      </section>
    </>
  )
}

export default Home