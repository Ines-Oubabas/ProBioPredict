import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ensureValidSession, isAuthenticated } from '../services/authApi'

function ProtectedRoute() {
  const location = useLocation()

  const [isChecking, setIsChecking] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function verifySession() {
      // Pas de token -> refus immédiat
      if (!isAuthenticated()) {
        if (isMounted) {
          setIsAllowed(false)
          setIsChecking(false)
        }
        return
      }

      // Token présent -> vérification réelle backend (/me + refresh auto si 401)
      const user = await ensureValidSession()

      if (isMounted) {
        setIsAllowed(Boolean(user))
        setIsChecking(false)
      }
    }

    verifySession()

    return () => {
      isMounted = false
    }
  }, [location.pathname])

  if (isChecking) {
    return (
      <section className="page-shell">
        <article className="card">
          <p className="muted" aria-live="polite">
            Checking session...
          </p>
        </article>
      </section>
    )
  }

  if (!isAllowed) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute