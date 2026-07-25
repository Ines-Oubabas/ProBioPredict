import { Link } from 'react-router-dom'

function BillingCancel() {
  return (
    <section className="page-shell">
      <section className="panel premium-panel">
        <header className="premium-head premium-hero">
          <h1 className="section-title">Checkout cancelled</h1>

          <p className="section-subtitle">
            No subscription change has been made by this page. You can return
            to the plans whenever you are ready.
          </p>
        </header>

        <section className="section-space">
          <article className="panel">
            <h2>Your current plan has not been changed here</h2>

            <p className="muted">
              Cancelling Stripe Checkout does not activate Premium and does not
              update your plan from the frontend. Your actual subscription
              status always remains controlled by the backend and verified
              Stripe webhook events.
            </p>

            <div className="dashboard-header-actions section-space">
              <Link className="btn btn-accent" to="/premium">
                Back to plans
              </Link>

              <Link className="btn btn-ghost" to="/dashboard">
                Go to dashboard
              </Link>
            </div>
          </article>
        </section>
      </section>
    </section>
  )
}

export default BillingCancel