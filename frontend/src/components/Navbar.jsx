import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { getCurrentUser, isAuthenticated, logout, subscribeAuthChanges } from '../services/authApi'

const publicNavItems = [
  { to: '/', label: 'Home' },
  { to: '/premium', label: 'Premium' },
  { to: '/contact', label: 'Contact' },
]

const privateNavItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/prediction', label: 'Prediction' },
  { to: '/history', label: 'History' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [authState, setAuthState] = useState({
    isAuthenticated: isAuthenticated(),
    user: getCurrentUser(),
  })
  const navigate = useNavigate()

  useEffect(() => subscribeAuthChanges(setAuthState), [])

  const displayName = useMemo(
    () => authState.user?.full_name?.trim() || authState.user?.email?.trim() || 'User',
    [authState.user]
  )

  const navItems = authState.isAuthenticated ? [...publicNavItems, ...privateNavItems] : publicNavItems

  return (
    <header className="app-header glass">
      <NavLink className="brand" to="/">ProBioPredict</NavLink>

      <button className="menu-toggle" type="button" onClick={() => setMenuOpen((v) => !v)}>☰</button>

      <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to={item.to}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={`auth-links ${menuOpen ? 'open' : ''}`}>
        {authState.isAuthenticated ? (
          <>
            <span className="muted">Hello, {displayName}</span>
            <button className="btn btn-ghost" type="button" onClick={() => { logout(); navigate('/login', { replace: true }) }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink className="btn btn-ghost" to="/login">Sign in</NavLink>
            <NavLink className="btn btn-accent" to="/register">Register</NavLink>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar