import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Home from './pages/Home'
import Login from './pages/Login'
import PredictionForm from './pages/PredictionForm'
import PredictionResult from './pages/PredictionResult'
import Premium from './pages/Premium'
import Register from './pages/Register'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/prediction" element={<PredictionForm />} />
        <Route path="/prediction-result" element={<PredictionResult />} />
        <Route path="/history" element={<History />} />
        <Route path="/premium" element={<Premium />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App