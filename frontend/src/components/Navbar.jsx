import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getAccessToken, getCurrentUser, logout } from '../services/authApi'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/prediction', label: 'Prediction' },
  { to: '/history', label: 'History' },
  { to: '/premium', label: 'Premium' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAccessToken()))
  const [currentUser, setCurrentUser] = useState(getCurrentUser())

  const location = useLocation()
  const navigate = useNavigate()

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    // Re-sync auth state on route change
    setIsAuthenticated(Boolean(getAccessToken()))
    setCurrentUser(getCurrentUser())
  }, [location.pathname])

  useEffect(() => {
    // Sync across tabs/windows
    const onStorage = () => {
      setIsAuthenticated(Boolean(getAccessToken()))
      setCurrentUser(getCurrentUser())
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const handleLogout = () => {
    logout()
    setIsAuthenticated(false)
    setCurrentUser(null)
    closeMenu()
    navigate('/login', { replace: true })
  }

  const displayName =
    currentUser?.full_name?.trim() ||
    currentUser?.email?.trim() ||
    'User'

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
        {isAuthenticated ? (
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