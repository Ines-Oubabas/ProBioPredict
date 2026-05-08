import { premiumPlans } from '../data/mockData'

function Premium() {
  return (
    <section className="page-shell">
      <section className="panel premium-panel">
        <header className="premium-head premium-hero">
          <h1 className="section-title">Premium plans</h1>
          <p className="section-subtitle">
            Start free, validate your workflow, and scale with the right plan as your prediction volume grows.
          </p>
          <p className="premium-intro-copy">
            Every user can begin with Free / Starter. The free plan includes up to 5 predictions. Beyond that limit,
            upgrading to a paid plan is required.
          </p>
        </header>

        <div className="premium-pricing-grid section-space">
          {premiumPlans.map((plan) => {
            const name = plan.name?.toLowerCase() || ''
            const isPro = name === 'pro'
            const isStarter = name.includes('starter') || name.includes('free')
            const isLab = name === 'lab' || name.includes('team')

            const toneClass = isPro ? 'plan-pro' : isStarter ? 'plan-starter' : isLab ? 'plan-lab' : ''
            const highlightClass = plan.highlighted ? 'plan-highlight' : ''
            const badgeLabel = plan.badge || (isPro ? 'Most popular' : isStarter ? 'Get started' : 'For teams')

            return (
              <article key={plan.name} className={`premium-plan-card ${toneClass} ${highlightClass}`.trim()}>
                <span className="plan-badge">{badgeLabel}</span>

                <div className="plan-top">
                  <h3>{plan.name}</h3>
                  <p className="price">{plan.price}</p>
                  {plan.description ? <p className="plan-description">{plan.description}</p> : null}
                </div>

                <ul className="premium-feature-list">
                  {plan.bullets.map((item) => (
                    <li key={item}>
                      <span className="feature-check" aria-hidden="true">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <button className={`btn ${isPro ? 'btn-accent' : 'btn-ghost'} plan-btn`} type="button">
                  {plan.cta || 'Choose plan'}
                </button>
              </article>
            )
          })}
        </div>

        <div className="premium-help-text section-space">
          <p className="muted">
            Free / Starter is ideal for testing the platform. Pro fits regular or advanced usage. Lab is made for
            teams, researchers, and laboratories.
          </p>
        </div>

        <div className="premium-footnote section-space">
          <p className="muted">
            Payment flow is currently in prototype mode. You can still review the complete plan experience and upgrade
            journey.
          </p>
        </div>
      </section>
    </section>
  )
}

export default Premium