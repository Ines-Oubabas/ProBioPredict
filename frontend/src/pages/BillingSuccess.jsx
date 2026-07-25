import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMe } from '../services/authApi'

function getPlanLabel(subscription) {
  if (!subscription) return 'Free'
  return subscription.plan_label || subscription.plan || 'Free'
}

function getStatusLabel(subscription) {
  if (!subscription) return 'Free'

  const status = subscription.status || 'free'

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

function BillingSuccess() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [subscription, setSubscription] = useState(null)

  const refreshSubscription = useCallback(async ({ manual = false } = {}) => {
    if (manual) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const user = await getMe()
      setSubscription(user?.subscription || null)
    } catch (requestError) {
      setError(
        requestError?.message ||
          'Unable to refresh your subscription status from the backend.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    refreshSubscription()
  }, [refreshSubscription])

  const isPremium = Boolean(subscription?.is_premium)
  const status = subscription?.status || 'free'
  const paymentStillProcessing =
    !isPremium && ['incomplete', 'free'].includes(status)

  return (
    <section className="page-shell">
      <section className="panel premium-panel">
        <header className="premium-head premium-hero">
          <h1 className="section-title">Checkout completed</h1>

          <p className="section-subtitle">
            Stripe has returned you to ProBioPredict. Your access is confirmed
            only after the secure Stripe webhook updates your subscription on
            the backend.
          </p>
        </header>

        {loading ? (
          <p className="muted">Checking your subscription status...</p>
        ) : null}

        {error ? (
          <div role="alert">
            <p style={{ color: '#ffb4b4' }}>{error}</p>
          </div>
        ) : null}

        {!loading && !error && (
          <section className="section-space">
            <article className="panel">
              <h2>
                {isPremium
                  ? 'Your Premium access is active'
                  : 'Your payment is being confirmed'}
              </h2>

              {isPremium ? (
                <p className="muted">
                  Your backend subscription is active. You can now use the
                  limits included with your {getPlanLabel(subscription)} plan.
                </p>
              ) : (
                <p className="muted">
                  Stripe may need a moment to deliver the webhook confirmation.
                  This page does not activate Premium itself. Please refresh the
                  status in a few seconds if your plan is not active yet.
                </p>
              )}

              <div className="section-space">
                <p>
                  <strong>Plan:</strong> {getPlanLabel(subscription)}
                </p>
                <p>
                  <strong>Backend status:</strong>{' '}
                  {getStatusLabel(subscription)}
                </p>
                <p>
                  <strong>Premium access:</strong>{' '}
                  {isPremium ? 'Active' : 'Not active yet'}
                </p>
              </div>

              {paymentStillProcessing ? (
                <p className="muted">
                  If this status remains unchanged, verify that the Stripe
                  webhook endpoint is configured and receiving events on the
                  backend.
                </p>
              ) : null}

              <div className="dashboard-header-actions section-space">
                <button
                  className="btn btn-accent"
                  type="button"
                  onClick={() => refreshSubscription({ manual: true })}
                  disabled={refreshing}
                >
                  {refreshing ? 'Refreshing status...' : 'Refresh status'}
                </button>

                <Link className="btn btn-ghost" to="/dashboard">
                  Go to dashboard
                </Link>

                <Link className="btn btn-ghost" to="/premium">
                  View plans
                </Link>
              </div>
            </article>
          </section>
        )}
      </section>
    </section>
  )
}

export default BillingSuccess