import { Link } from 'react-router-dom'
import { IconLock, IconMail } from '../components/Icons'

function Login() {
  return (
    <section className="auth-bg page-bg-login page-shell auth-panel">
      <article className="auth-card card">
        <h1>Login</h1>
        <p>Sign in to access your predictions and saved history.</p>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem' }}>
              <IconMail className="icon" />
              <input id="login-email" type="email" placeholder="you@example.com" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem' }}>
              <IconLock className="icon" />
              <input id="login-password" type="password" placeholder="••••••••" />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-accent" type="submit">
              Continue (mock)
            </button>
            <Link className="btn btn-ghost" to="#">
              Forgot password?
            </Link>
          </div>
        </form>

        <p className="muted" style={{ marginTop: '0.8rem' }}>
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </article>
    </section>
  )
}

export default Login