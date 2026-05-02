import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IconLock, IconMail } from '../components/Icons'
import { getAccessToken, login } from '../services/authApi'

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
    const access = getAccessToken()
    if (access) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

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
      }, 350)
    } catch (error) {
      setErrorMessage(error.message || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-bg page-bg-login page-shell auth-panel">
      <article className="auth-card card">
        <h1>Login</h1>
        <p>Sign in to access your predictions and saved history.</p>

        {errorMessage ? (
          <p
            className="muted"
            style={{
              marginTop: '0.75rem',
              marginBottom: '0.75rem',
              color: '#ffb4b4',
              background: 'rgba(255, 90, 90, 0.12)',
              border: '1px solid rgba(255, 90, 90, 0.25)',
              borderRadius: '10px',
              padding: '0.6rem 0.75rem',
            }}
          >
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p
            className="muted"
            style={{
              marginTop: '0.75rem',
              marginBottom: '0.75rem',
              color: '#b8ffd2',
              background: 'rgba(70, 220, 140, 0.12)',
              border: '1px solid rgba(70, 220, 140, 0.3)',
              borderRadius: '10px',
              padding: '0.6rem 0.75rem',
            }}
          >
            {successMessage}
          </p>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <div
              className="glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.6rem',
              }}
            >
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
            <div
              className="glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.6rem',
              }}
            >
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

          <div className="form-actions">
            <button className="btn btn-accent" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Continue'}
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