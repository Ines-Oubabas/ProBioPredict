import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IconLock, IconMail } from '../components/Icons'
import { isAuthenticated, login } from '../services/authApi'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const fromPath = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(fromPath, { replace: true })
    }
  }, [navigate, fromPath])

  const handleChange = (event) => {
    const { id, value } = event.target

    const map = {
      'login-email': 'email',
      'login-password': 'password',
    }

    const key = map[id]
    if (!key) return

    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    setErrorMessage('')
    setSuccessMessage('')

    if (!form.email.trim() || !form.password) {
      setErrorMessage('Please enter your email and password.')
      return
    }

    setIsSubmitting(true)

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      })

      setSuccessMessage('Login successful. Redirecting...')
      setTimeout(() => {
        navigate(fromPath, { replace: true })
      }, 250)
    } catch (error) {
      setErrorMessage(error.message || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-bg page-bg-login page-shell auth-panel">
      <article className="auth-card card auth-card-hover">
        <h1>Login</h1>
        <p>Sign in to access your predictions and saved history.</p>

        {errorMessage ? (
          <p className="auth-alert auth-alert-error" role="alert" aria-live="assertive">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="auth-alert auth-alert-success" role="status" aria-live="polite">
            {successMessage}
          </p>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <div className="glass auth-input-shell">
              <IconMail className="icon" />
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <div className="glass auth-input-shell">
              <IconLock className="icon" />
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="form-actions auth-actions">
            <button className="btn btn-accent auth-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Continue'}
            </button>
            <Link className="btn btn-ghost auth-btn" to="/register">
              Create account
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