import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppProvider'
import { useApp } from './context/useApp'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Login from './pages/Login'
import Properties from './pages/Properties'
import Bookings from './pages/Bookings'
import './App.css'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useApp()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function HomeRedirect() {
  const { isAuthenticated } = useApp()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return <AppProvider><HashRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
    <Route path="/leads" element={<ProtectedRoute><AppLayout><Leads /></AppLayout></ProtectedRoute>} />
    <Route path="/properties" element={<ProtectedRoute><AppLayout><Properties /></AppLayout></ProtectedRoute>} />
    <Route path="/bookings" element={<ProtectedRoute><AppLayout><Bookings /></AppLayout></ProtectedRoute>} />
    <Route path="/" element={<HomeRedirect />} />
    <Route path="*" element={<HomeRedirect />} />
  </Routes></HashRouter></AppProvider>
}
