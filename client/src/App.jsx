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
  const [unreadNotifications, setUnreadNotifications] = useState(0)

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

  // Fetch unread notifications count
  useEffect(() => {
    if (!authUser) {
      setUnreadNotifications(0)
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await fetch('/api/notifications/unread-count', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setUnreadNotifications(data.unreadCount || 0)
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [authUser])

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

  const handleNotificationClick = () => {
    if (authUser) {
      setCurrentPage('profile')
      // In ProfilePage, we'll default to the first tab or add a notifications tab
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
        unreadNotifications={unreadNotifications}
        onNotificationClick={handleNotificationClick}
      />
    ) : currentPage === 'report' ? (
      <ReportItemPage 
        authUser={authUser} 
        onHome={handleHomeClick} 
        onBack={handleHomeClick}
        unreadNotifications={unreadNotifications}
        onNotificationClick={handleNotificationClick}
      />
    ) : currentPage === 'browse' ? (
      <BrowsePage
        authUser={authUser}
        onHome={handleHomeClick}
        onBrowse={handleBrowseClick}
        onReportItem={handleReportItemClick}
        onAvatarClick={handleAvatarClick}
        onViewReport={handleViewReport}
        unreadNotifications={unreadNotifications}
        onNotificationClick={handleNotificationClick}
      />
    ) : currentPage === 'report-detail' ? (
      <ReportDetailPage
        authUser={authUser}
        onHome={handleHomeClick}
        onBack={handleBackFromReportDetail}
        reportId={selectedReportId}
        unreadNotifications={unreadNotifications}
        onNotificationClick={handleNotificationClick}
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
        unreadNotifications={unreadNotifications}
        onNotificationClick={handleNotificationClick}
      />
    )

  return <Stairs>{page}</Stairs>
}

export default App
