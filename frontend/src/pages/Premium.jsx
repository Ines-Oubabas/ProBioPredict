import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { premiumPlans } from '../data/mockData'
import { isAuthenticated } from '../services/authApi'
import { createCheckoutSession } from '../services/billingApi'

function getPlanKey(plan) {
  const name = plan?.name?.toLowerCase() || ''

  if (name === 'pro') return 'pro'
  if (name === 'lab' || name.includes('team')) return 'lab'

  return null
}

function Premium() {
  const navigate = useNavigate()
  const [loadingPlan, setLoadingPlan] = useState('')
  const [error, setError] = useState('')

  async function handlePlanSelection(plan) {
    const planKey = getPlanKey(plan)

    if (!planKey) {
      if (isAuthenticated()) {
        navigate('/dashboard')
      } else {
        navigate('/register')
      }
      return
    }

    if (!isAuthenticated()) {
      navigate('/login')
      return
    }

    setError('')
    setLoadingPlan(planKey)

    try {
      const { checkout_url: checkoutUrl } = await createCheckoutSession(planKey)
      window.location.assign(checkoutUrl)
    } catch (checkoutError) {
      setError(
        checkoutError?.message ||
          'Unable to start Stripe Checkout. Please try again.',
      )
      setLoadingPlan('')
    }
  }

  return (
    <section className="page-shell">
      <section className="panel premium-panel">
        <header className="premium-head premium-hero">
          <h1 className="section-title">Premium plans</h1>

          <p className="section-subtitle">
            Start free, validate your workflow, and scale with the right plan
            as your prediction volume grows.
          </p>

          <p className="premium-intro-copy">
            Every user can begin with Free / Starter. The free plan includes up
            to 3 predictions. Beyond that limit, upgrading to a paid plan is
            required.
          </p>
        </header>

        {error ? (
          <p className="section-space" role="alert" style={{ color: '#ffb4b4' }}>
            {error}
          </p>
        ) : null}

        <div className="premium-pricing-grid section-space">
          {premiumPlans.map((plan) => {
            const name = plan.name?.toLowerCase() || ''
            const planKey = getPlanKey(plan)
            const isPro = planKey === 'pro'
            const isStarter = name.includes('starter') || name.includes('free')
            const isLab = planKey === 'lab'
            const isLoading = loadingPlan === planKey

            const toneClass = isPro
              ? 'plan-pro'
              : isStarter
                ? 'plan-starter'
                : isLab
                  ? 'plan-lab'
                  : ''

            const highlightClass = plan.highlighted ? 'plan-highlight' : ''

            const badgeLabel =
              plan.badge ||
              (isPro
                ? 'Most popular'
                : isStarter
                  ? 'Get started'
                  : 'For teams')

            let buttonLabel = plan.cta || 'Choose plan'

            if (isLoading) {
              buttonLabel = 'Redirecting to Checkout...'
            } else if (isStarter && isAuthenticated()) {
              buttonLabel = 'Go to dashboard'
            } else if (isStarter && !isAuthenticated()) {
              buttonLabel = 'Create free account'
            }

            return (
              <article
                key={plan.name}
                className={`premium-plan-card ${toneClass} ${highlightClass}`.trim()}
              >
                <span className="plan-badge">{badgeLabel}</span>

                <div className="plan-top">
                  <h3>{plan.name}</h3>
                  <p className="price">{plan.price}</p>

                  {plan.description ? (
                    <p className="plan-description">{plan.description}</p>
                  ) : null}
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

                <button
                  className={`btn ${isPro ? 'btn-accent' : 'btn-ghost'} plan-btn`}
                  type="button"
                  onClick={() => handlePlanSelection(plan)}
                  disabled={Boolean(loadingPlan)}
                >
                  {buttonLabel}
                </button>
              </article>
            )
          })}
        </div>

        <div className="premium-help-text section-space">
          <p className="muted">
            Free / Starter is ideal for testing the platform. Pro fits regular
            or advanced usage. Lab is made for teams, researchers, and
            laboratories.
          </p>
        </div>

        <div className="premium-footnote section-space">
          <p className="muted">
            Paid-plan Checkout is created securely by the ProBioPredict backend.
            Your Premium status is activated only after Stripe confirms payment
            through the backend webhook.
          </p>
        </div>
      </section>
    </section>
  )
}

export default Premium