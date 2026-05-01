import { Link } from 'react-router-dom'
import { IconLock, IconMail } from '../components/Icons'

function Login() {
  return (
    <section className="auth-bg page-bg-login page-shell">
      <section className="auth-center">
        <article className="auth-card">
          <h1>Login</h1>
          <p>Sign in to access your predictions and saved history.</p>

          <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
            <label>
              Email
              <div className="input-wrap">
                <IconMail />
                <input type="email" placeholder="you@example.com" />
              </div>
            </label>

            <label>
              Password
              <div className="input-wrap">
                <IconLock />
                <input type="password" placeholder="••••••••" />
              </div>
            </label>

            <button className="btn btn-accent" type="submit">Continue (mock)</button>
          </form>

          <div className="auth-links-inline">
            <Link className="text-link" to="#">Forgot password?</Link>
          </div>

          <p className="muted">
            No account yet? <Link to="/register">Create one</Link>
          </p>
        </article>
      </section>
    </section>
  )
}

export default Login