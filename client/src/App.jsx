import { useState } from 'react'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return isAuthenticated ? <HomePage /> : <AuthPage />
}

export default App
