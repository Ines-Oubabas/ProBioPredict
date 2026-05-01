import { Link } from 'react-router-dom'
import { IconLock, IconMail, IconUser } from '../components/Icons'

function Register() {
  return (
    <section className="auth-bg page-bg-register page-shell">
      <section className="auth-center">
        <article className="auth-card">
          <h1>Register</h1>
          <p>Create your ProBioPredict account and start tracking your results.</p>

          <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
            <label>
              Full name
              <div className="input-wrap">
                <IconUser />
                <input type="text" placeholder="Your name" />
              </div>
            </label>

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

            <button className="btn btn-accent" type="submit">Create account (mock)</button>
          </form>

          <p className="muted">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </article>
      </section>
    </section>
  )
}

export default Register