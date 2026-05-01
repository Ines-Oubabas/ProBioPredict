import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/prediction', label: 'Prediction' },
  { to: '/history', label: 'History' },
  { to: '/premium', label: 'Premium' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

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
        onClick={() => setMenuOpen((v) => !v)}
      >
        ☰
      </button>

      <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
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
        <NavLink className="btn btn-ghost" to="/login" onClick={closeMenu}>
          Sign in
        </NavLink>
        <NavLink className="btn btn-accent" to="/register" onClick={closeMenu}>
          Register
        </NavLink>
      </div>
    </header>
  )
}

export default Navbar