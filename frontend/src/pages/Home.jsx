import { Link } from 'react-router-dom'
import { dashboardStats, modules, recentHistory, whyProBioPredict, workflowSteps } from '../data/mockData'
import { IconChart, IconLock, IconShield, IconSpark } from '../components/Icons'

function Home() {
  const latest = recentHistory?.[0] ?? {
    sequence: 'L. casei A17',
    result: 'Probiotic',
    confidence: '92%',
    date: '2026-04-18',
  }

  return (
    <section className="home-immersive page-shell">
      <section className="hero-landing home-hero home-hero-v3 home-hero-v3-clean">
        <div className="hero-overlay" />

        <div className="home-hero-grid home-hero-grid-clean">
          <div className="home-hero-copy home-hero-copy-clean">
            <p className="hero-kicker hero-reveal hero-reveal-1">AI Biotech Platform</p>

            <h1 className="hero-title hero-title-compact hero-reveal hero-reveal-2">
              Decode genomes.
              <br />
              Predict probiotics.
            </h1>

            <p className="hero-subtitle hero-subtitle-compact hero-reveal hero-reveal-3">
              AI-powered genomic analysis built for next-generation biotech research.
            </p>

            <div className="hero-ctas hero-reveal hero-reveal-4">
              <Link className="btn btn-accent" to="/prediction">
                Start prediction
              </Link>
              <a className="btn btn-ghost" href="#why-probio">
                Explore platform
              </a>
            </div>

            <div className="home-micro-metrics home-micro-metrics-clean hero-reveal hero-reveal-5">
              {dashboardStats.map((stat) => (
                <div key={stat.label} className="metric-pill">
                  <small>{stat.label}</small>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <aside className="home-hero-cockpit home-hero-cockpit-clean hero-reveal hero-reveal-4">
            <article className="cockpit-shell cockpit-shell-mini">
              <div className="cockpit-top cockpit-top-mini">
                <p>Live preview</p>
                <span className="status-pill tone-healthy">Mock pipeline active</span>
              </div>

              <div className="cockpit-mini-list">
                <p>
                  Latest result: <strong>{latest.result}</strong>
                </p>
                <p>
                  Confidence: <strong>{latest.confidence}</strong>
                </p>
                <p>
                  Status: <strong>Mock pipeline active</strong>
                </p>
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section id="why-probio" className="home-flow section-space home-band">
        <div className="home-section-head">
          <p className="home-section-kicker">Why ProBioPredict</p>
          <h2 className="section-title">A biotech SaaS experience designed for clarity under complexity</h2>
          <p className="section-subtitle">
            Built to make genomic prediction workflows readable, secure, and operational for real teams.
          </p>
        </div>

        <div className="why-fluid-grid">
          {whyProBioPredict.map((item, idx) => (
            <article key={item.title} className={`why-fluid-item why-fluid-item-${idx + 1}`}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-flow section-space home-band">
        <div className="home-section-head">
          <p className="home-section-kicker">Workflow</p>
          <h2 className="section-title">From sequence upload to confident output in one guided flow</h2>
        </div>

        <div className="workflow-rail workflow-rail-v3 workflow-rail-balanced">
          {workflowSteps.map((step) => (
            <article className="workflow-step" key={step.id}>
              <span className="timeline-id">{step.id}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="product-experience" className="home-flow section-space home-band">
        <div className="home-section-head">
          <p className="home-section-kicker">Product experience</p>
          <h2 className="section-title">A continuous interface instead of disconnected tools</h2>
          <p className="section-subtitle">
            Track latest results, confidence, and activity while keeping quick actions one click away.
          </p>
        </div>

        <div className="home-preview-layout">
          <article className="preview-core">
            <h3>Workspace snapshot</h3>
            <p className="muted">
              See key metrics, latest classification, and confidence indicators in a compact cockpit layout.
            </p>

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
              <p className="result-label">{latest.sequence}</p>
              <p>
                Classification: <strong>{latest.result}</strong>
              </p>
              <p>
                Confidence: <strong>{latest.confidence}</strong>
              </p>
            </div>

            <div className="form-actions">
              <Link className="btn btn-accent" to="/dashboard">
                Open dashboard
              </Link>
              <Link className="btn btn-ghost" to="/history">
                View history
              </Link>
            </div>
          </article>

          <aside className="preview-side">
            <article>
              <h3>Recent history</h3>
              <ul className="simple-list">
                {recentHistory.slice(0, 4).map((item) => (
                  <li key={`${item.sequence}-${item.date}`}>
                    {item.sequence} — {item.result} ({item.confidence})
                  </li>
                ))}
              </ul>
            </article>

            <article className="section-space">
              <h3>Modules</h3>
              <ul className="simple-list">
                {modules.map((mod) => (
                  <li key={mod.name}>
                    <strong>{mod.name}:</strong> {mod.hint}
                  </li>
                ))}
              </ul>
            </article>

            <article className="section-space">
              <h3>Execution</h3>
              <p className="muted">
                Backend and auth are production-ready. Current prediction engine runs in validated mock mode pending
                full ML integration.
              </p>
            </article>
          </aside>
        </div>
      </section>

      <section className="home-flow section-space home-band">
        <div className="home-section-head">
          <p className="home-section-kicker">Trust & security</p>
          <h2 className="section-title">Enterprise-style confidence with research-grade flexibility</h2>
        </div>

        <div className="trust-inline trust-inline-v3 trust-inline-clean">
          <article>
            <p className="timeline-id">
              <IconLock className="icon" />
            </p>
            <h3>Private workspace</h3>
            <p>Keep prediction tasks and outputs inside a dedicated project environment.</p>
          </article>

          <article>
            <p className="timeline-id">
              <IconShield className="icon" />
            </p>
            <h3>Secure file handling</h3>
            <p>DNA CSV uploads follow strict validation and controlled processing steps.</p>
          </article>

          <article>
            <p className="timeline-id">
              <IconChart className="icon" />
            </p>
            <h3>Traceable outputs</h3>
            <p>Review confidence, classification history, and status signals with clear visibility.</p>
          </article>
        </div>
      </section>

      <section className="home-final-cta section-space home-final-cta-v3">
        <p style={{ display: 'flex', justifyContent: 'center' }}>
          <IconSpark className="icon" />
        </p>
        <h2 className="section-title">Ready to run your next genomic prediction workflow?</h2>
        <p style={{ textAlign: 'center' }}>
          Start with the validated mock pipeline now and transition smoothly when production ML is integrated.
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
    </section>
  )
}

export default Home