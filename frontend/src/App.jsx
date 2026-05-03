import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { isAuthenticated } from './services/authApi'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Home from './pages/Home'
import Login from './pages/Login'
import PredictionForm from './pages/PredictionForm'
import PredictionResult from './pages/PredictionResult'
import Premium from './pages/Premium'
import Register from './pages/Register'
import './App.css'

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/premium" element={<Premium />} />
        <Route
          path="/login"
          element={(
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          )}
        />
        <Route
          path="/register"
          element={(
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          )}
        />

        {/* Private routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/prediction" element={<PredictionForm />} />
          <Route path="/prediction-result" element={<PredictionResult />} />
          <Route path="/history" element={<History />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App