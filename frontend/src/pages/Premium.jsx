import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { premiumPlans } from '../data/mockData'
import { isAuthenticated } from '../services/authApi'
import { createCheckoutSession } from '../services/billingApi'

const planPresentation = {
  free: {
    badge: 'Get started',
    description: 'Explore predictions with a free account.',
    bullets: [
      'Prediction quota: 3 by default',
      'One DNA sequence per CSV upload',
      'Personal prediction history',
      'Manual result download in JSON format',
    ],
  },
  pro: {
    badge: 'Pro',
    description: 'Continue your predictions with the Pro quota.',
    bullets: [
      'Prediction quota: 100 by default',
      'One DNA sequence per CSV upload',
      'Personal prediction history',
      'Manual result download in JSON format',
    ],
  },
  lab: {
    badge: 'Lab',
    description: 'Use the Lab quota for your prediction workflow.',
    bullets: [
      'Unlimited predictions when configured',
      'One DNA sequence per CSV upload',
      'Personal prediction history',
      'Manual result download in JSON format',
    ],
  },
}

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
            Choose a prediction quota that fits your usage.
          </p>

          <p className="premium-intro-copy">
            All plans include CSV prediction submission, personal prediction
            history, and manual result downloads in JSON format.
            Pro and Lab provide access to their configured prediction quotas
            once the paid subscription is active.
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

            const presentation = planPresentation[planKey || 'free']

            const toneClass = isPro
              ? 'plan-pro'
              : isStarter
                ? 'plan-starter'
                : isLab
                  ? 'plan-lab'
                  : ''

            const highlightClass = plan.highlighted ? 'plan-highlight' : ''

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
                <span className="plan-badge">{presentation.badge}</span>

                <div className="plan-top">
                  <h3>{plan.name}</h3>
                  <p className="price">{plan.price}</p>
                  <p className="plan-description">
                    {presentation.description}
                  </p>
                </div>

                <ul className="premium-feature-list">
                  {presentation.bullets.map((item) => (
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
            Quotas depend on the platform configuration. The default limits
            are 3 predictions for Free and 100 for Pro. Lab is unlimited
            when configured without a prediction limit; otherwise, its
            configured limit applies.
          </p>
          <p className="muted">
            Usage is based on predictions currently saved in your account.
            Prediction quotas do not reset automatically each month.
            Your dashboard displays your current limit and usage.
          </p>
        </div>

        <div className="premium-footnote section-space">
          <p className="muted">
            Pro and Lab subscriptions use Stripe Checkout. Your paid plan
            becomes available after the backend confirms an active or
            trialing subscription through verified Stripe webhook events.
          </p>
        </div>
      </section>
    </section>
  )
}

export default Premium