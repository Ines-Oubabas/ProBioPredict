import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  getCurrentUser,
  isAuthenticated,
  logout,
  subscribeAuthChanges,
} from '../services/authApi'

const publicNavItems = [
  { to: '/', label: 'Home' },
  { to: '/premium', label: 'Premium' },
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

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    const unsubscribe = subscribeAuthChanges((state) => {
      setAuthState(state)
    })
    return unsubscribe
  }, [])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/login', { replace: true })
  }

  const displayName = useMemo(() => {
    return authState.user?.full_name?.trim() || authState.user?.email?.trim() || 'User'
  }, [authState.user])

  const navItems = authState.isAuthenticated
    ? [...publicNavItems, ...privateNavItems]
    : publicNavItems

  return (
    <header className="app-header glass">
      <NavLink className="brand" to="/" onClick={closeMenu}>
        ProBioPredict
      </NavLink>

      <button
        className="menu-toggle"
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
        aria-controls="main-nav"
        onClick={() => setMenuOpen((v) => !v)}
      >
        ☰
      </button>

      <nav
        id="main-nav"
        className={`nav-links ${menuOpen ? 'open' : ''}`}
        aria-label="Main navigation"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
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
            <span className="muted" style={{ alignSelf: 'center', marginRight: '0.25rem' }}>
              Hello, {displayName}
            </span>
            <button className="btn btn-ghost" type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink className="btn btn-ghost" to="/login" onClick={closeMenu}>
              Sign in
            </NavLink>
            <NavLink className="btn btn-accent" to="/register" onClick={closeMenu}>
              Register
            </NavLink>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar