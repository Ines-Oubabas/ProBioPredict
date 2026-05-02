import { Link } from 'react-router-dom'
import { IconLock, IconMail, IconUser } from '../components/Icons'

function Register() {
  return (
    <section className="auth-bg page-bg-register page-shell auth-panel">
      <article className="auth-card card">
        <h1>Create account</h1>
        <p>Join ProBioPredict and start your prediction workflow in minutes.</p>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <label htmlFor="register-name">Full name</label>
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem' }}>
              <IconUser className="icon" />
              <input id="register-name" type="text" placeholder="Jane Doe" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="register-email">Email</label>
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem' }}>
              <IconMail className="icon" />
              <input id="register-email" type="email" placeholder="you@example.com" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="register-password">Password</label>
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem' }}>
              <IconLock className="icon" />
              <input id="register-password" type="password" placeholder="Create a password" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="register-password-confirm">Confirm password</label>
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem' }}>
              <IconLock className="icon" />
              <input id="register-password-confirm" type="password" placeholder="Repeat your password" />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-accent" type="submit">
              Create account (mock)
            </button>
          </div>
        </form>

        <p className="muted" style={{ marginTop: '0.8rem' }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </article>
    </section>
  )
}

export default Register