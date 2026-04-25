import { useEffect, useState } from 'react'
import Stairs from './components/Stairs'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Sign from './pages/Sign'

function App() {
  const [currentPage, setCurrentPage] = useState('home') // 'home', 'login', or 'signup'
  const [prefilledLoginEmail, setPrefilledLoginEmail] = useState('')
  const [authUser, setAuthUser] = useState(null)

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('accessToken')

      if (!token) {
        return
      }

      try {
        const response = await fetch('/api/auth/get-me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          localStorage.removeItem('accessToken')
          return
        }

        const data = await response.json()
        setAuthUser(data.user || null)
      } catch {
        localStorage.removeItem('accessToken')
      }
    }

    restoreSession()
  }, [])

  const handleLoginClick = () => {
    setCurrentPage('login')
  }

  const handleSignupClick = () => {
    setCurrentPage('signup')
  }

  const handleBackClick = () => {
    setCurrentPage('home')
  }

  const handleSignupComplete = (email) => {
    setPrefilledLoginEmail(email)
    setCurrentPage('login')
  }

  const handleLoginSuccess = (user) => {
    setAuthUser(user)
    setCurrentPage('home')
  }

  const page =
    currentPage === 'login' ? (
      <Login
        onBack={handleBackClick}
        onSwitchToSignup={handleSignupClick}
        initialEmail={prefilledLoginEmail}
        onLoginSuccess={handleLoginSuccess}
      />
    ) : currentPage === 'signup' ? (
      <Sign onBack={handleBackClick} onSwitchToLogin={handleSignupComplete} />
    ) : (
      <HomePage onLogin={handleLoginClick} onSignup={handleSignupClick} authUser={authUser} />
    )

  return <Stairs>{page}</Stairs>
}

export default App
