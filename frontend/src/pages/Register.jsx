import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconLock, IconMail, IconUser } from '../components/Icons'
import { isAuthenticated, register } from '../services/authApi'

function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    password_confirm: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleChange = (event) => {
    const { id, value } = event.target

    const map = {
      'register-name': 'full_name',
      'register-email': 'email',
      'register-password': 'password',
      'register-password-confirm': 'password_confirm',
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

    if (!form.full_name.trim() || !form.email.trim() || !form.password || !form.password_confirm) {
      setErrorMessage('Please complete all fields.')
      return
    }

    if (form.password !== form.password_confirm) {
      setErrorMessage('Password confirmation does not match.')
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirm: form.password_confirm,
      })

      setSuccessMessage('Account created successfully. Redirecting to dashboard...')
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 300)
    } catch (error) {
      setErrorMessage(error.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-bg page-bg-register page-shell auth-panel">
      <article className="auth-card card auth-card-hover">
        <h1>Create account</h1>
        <p>Join ProBioPredict and start your prediction workflow in minutes.</p>

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
            <label htmlFor="register-name">Full name</label>
            <div className="glass auth-input-shell">
              <IconUser className="icon" />
              <input
                id="register-name"
                type="text"
                placeholder="Jane Doe"
                value={form.full_name}
                onChange={handleChange}
                autoComplete="name"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="register-email">Email</label>
            <div className="glass auth-input-shell">
              <IconMail className="icon" />
              <input
                id="register-email"
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
            <label htmlFor="register-password">Password</label>
            <div className="glass auth-input-shell">
              <IconLock className="icon" />
              <input
                id="register-password"
                type="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="register-password-confirm">Confirm password</label>
            <div className="glass auth-input-shell">
              <IconLock className="icon" />
              <input
                id="register-password-confirm"
                type="password"
                placeholder="Repeat your password"
                value={form.password_confirm}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="form-actions auth-actions">
            <button className="btn btn-accent auth-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
            <Link className="btn btn-ghost auth-btn" to="/login">
              Sign in
            </Link>
          </div>
        </form>
      </article>
    </section>
  )
}

export default Register