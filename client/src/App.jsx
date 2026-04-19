import { useState } from 'react'
import Stairs from './components/Stairs'
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

  const page =
    currentPage === 'login' ? (
      <Login onBack={handleBackClick} />
    ) : currentPage === 'signup' ? (
      <Sign onBack={handleBackClick} />
    ) : (
      <HomePage onLogin={handleLoginClick} onSignup={handleSignupClick} />
    )

  return <Stairs>{page}</Stairs>
}

export default App
