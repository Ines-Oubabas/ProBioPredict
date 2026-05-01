import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import Navbar from './Navbar'

function AppLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default AppLayout