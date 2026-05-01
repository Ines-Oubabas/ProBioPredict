import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="site-footer glass">
      <div className="footer-left">
        <strong>ProBioPredict</strong>
        <p>Biotech SaaS product prototype.</p>
      </div>

      <nav className="footer-links" aria-label="Footer">
        <Link to="/">Home</Link>
        <Link to="/prediction">Prediction</Link>
        <Link to="/history">History</Link>
        <Link to="/premium">Premium</Link>
      </nav>

      <p className="footer-copy">© 2026 ProBioPredict · Product prototype</p>
    </footer>
  )
}

export default Footer