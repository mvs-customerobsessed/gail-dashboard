import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/prose.css'
import App from './App.jsx'
import { AuthProvider } from './components/auth/AuthProvider'
import ProtectedRoute from './components/auth/ProtectedRoute'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    </AuthProvider>
  </StrictMode>,
)
