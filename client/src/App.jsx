import { useState } from 'react'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Sign from './pages/Sign'

function App() {
  const [currentPage, setCurrentPage] = useState('home') // 'home', 'login', or 'signup'

  const handleLoginClick = () => {
    setCurrentPage('login')
  }

  const handleSignupClick = () => {
    setCurrentPage('signup')
  }

  const handleBackClick = () => {
    setCurrentPage('home')
  }

  if (currentPage === 'login') {
    return <Login onBack={handleBackClick} />
  }

  if (currentPage === 'signup') {
    return <Sign onBack={handleBackClick} />
  }

  return <HomePage onLogin={handleLoginClick} onSignup={handleSignupClick} />
}

export default App
