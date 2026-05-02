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

          <div className="hero-tags">
            {heroIndicators.map((label) => (
              <span key={label} className="tag">
                {label}
              </span>
            ))}
          </div>

          <div className="hero-ctas">
            <Link className="btn btn-accent" to="/prediction">
              Start prediction
            </Link>
            <a className="btn btn-ghost" href="#why">
              Learn more
            </a>
          </div>
        </div>
      </section>

      <section id="why" className="panel section-space page-shell">
        <h2 className="section-title">Why ProBioPredict?</h2>
        <div className="cards-grid-3 section-space">
          {whyProBioPredict.map((item) => (
            <article className="card card-soft" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <p className="muted" style={{ marginTop: '0.7rem', textAlign: 'center' }}>
          Designed for students, researchers, and biotech projects.
        </p>
      </section>

      <section className="panel section-space page-shell">
        <h2 className="section-title">How it works</h2>
        <div className="timeline-wrap section-space">
          {workflowSteps.map((step) => (
            <article className="card card-soft timeline-item" key={step.id}>
              <span className="timeline-id">{step.id}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel section-space page-shell">
        <h2 className="section-title">Platform modules</h2>
        <div className="feature-mosaic section-space">
          <article className="card card-feature mosaic-main">
            <span className="timeline-id">
              <IconShield className="icon" />
            </span>
            <h3>Secure workspace</h3>
            <p>Keep your workflow private, organized, and accessible only to the right people.</p>
          </article>

          {modules.slice(1).map((mod, index) => (
            <article
              className={`card card-soft mosaic-side-${index + 1}`}
              key={mod.name}
            >
              <h3>{mod.name}</h3>
              <p>{mod.hint}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel section-space page-shell">
        <h2 className="section-title">Dashboard preview</h2>
        <div className="dashboard-main-grid section-space">
          <article className="card card-feature">
            <h3>Product preview</h3>
            <div className="screen-stats">
              {dashboardStats.map((stat) => (
                <div className="stat-chip" key={stat.label}>
                  <small>{stat.label}</small>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>

            <div className="section-space">
              <h3>Latest prediction</h3>
              <p className="result-label">L. casei A17</p>
              <p>
                Classification: <strong>Probiotic</strong>
              </p>
              <p>
                Confidence: <strong>92%</strong>
              </p>
            </div>
          </article>

          <aside className="card card-soft">
            <article>
              <h3>Quick snapshot</h3>
              <p>Clear statuses, readable confidence, and direct access to recent outputs.</p>
              <Link className="btn btn-ghost" to="/dashboard">
                Open dashboard
              </Link>
            </article>

            <article className="section-space">
              <h3>Recent history</h3>
              <ul className="simple-list">
                {recentHistory.slice(0, 4).map((item) => (
                  <li key={`${item.sequence}-${item.date}`}>
                    {item.sequence} — {item.result} ({item.confidence})
                  </li>
                ))}
              </ul>
            </article>
          </aside>
        </div>
      </section>

      <section className="panel section-space page-shell">
        <h2 className="section-title">Data privacy & secure workflow</h2>
        <div className="cards-grid-3 section-space">
          <article className="card card-soft">
            <p className="timeline-id">
              <IconLock className="icon" />
            </p>
            <h3>Private workspace</h3>
            <p>Keep analyses in a dedicated and protected environment.</p>
          </article>
          <article className="card card-soft">
            <p className="timeline-id">
              <IconShield className="icon" />
            </p>
            <h3>Secure data handling</h3>
            <p>Submitted data is managed with a security-first workflow.</p>
          </article>
          <article className="card card-soft">
            <p className="timeline-id">
              <IconChart className="icon" />
            </p>
            <h3>Controlled access</h3>
            <p>Control who can access project outputs.</p>
          </article>
        </div>
      </section>

      <section className="panel section-space page-shell">
        <p style={{ display: 'flex', justifyContent: 'center' }}>
          <IconSpark className="icon" />
        </p>
        <h2 className="section-title">Ready to start your first prediction workflow?</h2>
        <p style={{ textAlign: 'center' }}>
          Explore the platform, run basic predictions, and upgrade when you need advanced features.
        </p>
        <div className="hero-ctas">
          <Link className="btn btn-accent" to="/prediction">
            Start prediction
          </Link>
          <Link className="btn btn-ghost" to="/premium">
            View premium plans
          </Link>
        </div>
      </section>
    </>
  )
}

export default Home