import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  getCurrentUser,
  isAuthenticated,
  logout,
  subscribeAuthChanges,
} from '../services/authApi'
import './Navbar.css'

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
    () =>
      authState.user?.full_name?.trim() ||
      authState.user?.email?.trim() ||
      'User',
    [authState.user],
  )

  const navItems = authState.isAuthenticated
    ? [...publicNavItems, ...privateNavItems]
    : publicNavItems

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleLogout() {
    closeMenu()
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="app-header app-header-compact glass">
      <NavLink className="brand" to="/" onClick={closeMenu}>
        ProBioPredict
      </NavLink>

      <button
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
        onClick={() => setMenuOpen((value) => !value)}
      >
        <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
      </button>

      <nav
        id="main-navigation"
        className={`nav-links ${menuOpen ? 'open' : ''}`}
        aria-label="Main navigation"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            to={item.to}
            onClick={closeMenu}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={`auth-links ${menuOpen ? 'open' : ''}`}>
        {authState.isAuthenticated ? (
          <>
            <span className="navbar-user-label">
              Hello, {displayName}
            </span>

            <button
              className="btn btn-ghost"
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink
              className="btn btn-ghost"
              to="/login"
              onClick={closeMenu}
            >
              Sign in
            </NavLink>

            <NavLink
              className="btn btn-accent navbar-register-button"
              to="/register"
              onClick={closeMenu}
            >
              Register
            </NavLink>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar