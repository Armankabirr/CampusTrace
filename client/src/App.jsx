import { useEffect, useState } from 'react'
import Stairs from './components/Stairs'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ProfilePage from './pages/ProfilePage'
import ReportItemPage from './pages/ReportItemPage'
import BrowsePage from './pages/BrowsePage'
import ReportDetailPage from './pages/ReportDetailPage'
import Sign from './pages/Sign'

function App() {
  const [currentPage, setCurrentPage] = useState('home') // 'home', 'login', 'signup', 'forgot-password', 'profile', 'report', 'browse', 'report-detail'
  const [prefilledLoginEmail, setPrefilledLoginEmail] = useState('')
  const [authUser, setAuthUser] = useState(null)
  const [selectedReportId, setSelectedReportId] = useState(null)

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

  const handleAvatarClick = () => {
    if (authUser) {
      setCurrentPage('profile')
    }
  }

  const handleHomeClick = () => {
    setCurrentPage('home')
  }

  const handleReportItemClick = () => {
    setCurrentPage('report')
  }

  const handleBrowseClick = () => {
    setCurrentPage('browse')
  }

  const handleViewReport = (reportId, itemType) => {
    setSelectedReportId(reportId)
    setCurrentPage('report-detail')
  }

  const handleBackFromReportDetail = () => {
    setCurrentPage('browse')
    setSelectedReportId(null)
  }

  const handleSignOut = () => {
    localStorage.removeItem('accessToken')
    setAuthUser(null)
    setCurrentPage('home')
  }

  const handleForgotPasswordClick = () => {
    setCurrentPage('forgot-password')
  }

  const handleBackToLoginFromForgotPassword = () => {
    setCurrentPage('login')
  }

  const page =
    currentPage === 'login' ? (
      <Login
        onBack={handleBackClick}
        onSwitchToSignup={handleSignupClick}
        initialEmail={prefilledLoginEmail}
        onLoginSuccess={handleLoginSuccess}
        onForgotPassword={handleForgotPasswordClick}
      />
    ) : currentPage === 'forgot-password' ? (
      <ForgotPassword
        onBack={handleBackClick}
        onBackToLogin={handleBackToLoginFromForgotPassword}
      />
    ) : currentPage === 'signup' ? (
      <Sign onBack={handleBackClick} onSwitchToLogin={handleSignupComplete} />
    ) : currentPage === 'profile' ? (
      <ProfilePage
        authUser={authUser}
        onHome={handleHomeClick}
        onReportItem={handleReportItemClick}
        onSignOut={handleSignOut}
        onAvatarClick={handleAvatarClick}
      />
    ) : currentPage === 'report' ? (
      <ReportItemPage authUser={authUser} onHome={handleHomeClick} onBack={handleHomeClick} />
    ) : currentPage === 'browse' ? (
      <BrowsePage
        authUser={authUser}
        onHome={handleHomeClick}
        onBrowse={handleBrowseClick}
        onReportItem={handleReportItemClick}
        onAvatarClick={handleAvatarClick}
        onViewReport={handleViewReport}
      />
    ) : currentPage === 'report-detail' ? (
      <ReportDetailPage
        authUser={authUser}
        onHome={handleHomeClick}
        onBack={handleBackFromReportDetail}
        reportId={selectedReportId}
      />
    ) : (
      <HomePage
        onLogin={handleLoginClick}
        onSignup={handleSignupClick}
        onReportItem={handleReportItemClick}
        onBrowse={handleBrowseClick}
        onAvatarClick={handleAvatarClick}
        onHome={handleHomeClick}
        authUser={authUser}
      />
    )

  return <Stairs>{page}</Stairs>
}

export default App
