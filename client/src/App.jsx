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
  const [profileInitialTab, setProfileInitialTab] = useState(null)
  const [profileHighlightClaimId, setProfileHighlightClaimId] = useState(null)
  const [profileAutoOpenContactClaimId, setProfileAutoOpenContactClaimId] = useState(null)

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
    // default simple click (no payload) navigates to profile
    setCurrentPage('profile')
    setProfileInitialTab(null)
    setProfileHighlightClaimId(null)
    setProfileAutoOpenContactClaimId(null)
  }

  // overload to receive payloads from Navbar
  const handleNotificationClickPayload = (payload) => {
    if (!payload) return handleNotificationClick()

    if (payload.markAllRead) {
      setUnreadNotifications(0)
      return
    }

    // If notification was marked read, decrement unread count
    if (payload.notificationId) {
      setUnreadNotifications((n) => Math.max(0, n - 1))
    }

    // If notification references a report, navigate to report detail
    if (payload.reportId) {
      setSelectedReportId(payload.reportId)
      setCurrentPage('report-detail')
      return
    }

    // otherwise open profile and show appropriate tab and highlight claim if provided
    const ownerTypes = ['claim_received', 'claim_pending_approval']
    if (ownerTypes.includes(payload.type)) {
      setProfileInitialTab('Claims on My Items')
      setProfileHighlightClaimId(payload.claimId || null)
      setProfileAutoOpenContactClaimId(null)
    } else {
      setProfileInitialTab('My Claims')
      setProfileHighlightClaimId(payload.claimId || null)
      if (payload.type === 'claim_accepted') {
        setProfileAutoOpenContactClaimId(payload.claimId || null)
      } else {
        setProfileAutoOpenContactClaimId(null)
      }
    }
    setCurrentPage('profile')
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
        onBrowse={handleBrowseClick}
        onMatches={handleBrowseClick}
        onReportItem={handleReportItemClick}
        onSignOut={handleSignOut}
        onAvatarClick={handleAvatarClick}
        unreadNotifications={unreadNotifications}
        onNotificationClick={handleNotificationClickPayload}
        initialTab={profileInitialTab}
        highlightClaimId={profileHighlightClaimId}
        autoOpenContactClaimId={profileAutoOpenContactClaimId}
      />
    ) : currentPage === 'report' ? (
      <ReportItemPage 
        authUser={authUser} 
        onHome={handleHomeClick} 
        onBrowse={handleBrowseClick}
        onMatches={handleBrowseClick}
        onReportItem={handleReportItemClick}
        onBack={handleHomeClick}
        unreadNotifications={unreadNotifications}
        onNotificationClick={handleNotificationClickPayload}
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
        onNotificationClick={handleNotificationClickPayload}
      />
    ) : currentPage === 'report-detail' ? (
      <ReportDetailPage
        authUser={authUser}
        onHome={handleHomeClick}
        onBrowse={handleBrowseClick}
        onMatches={handleBrowseClick}
        onReportItem={handleReportItemClick}
        onBack={handleBackFromReportDetail}
        reportId={selectedReportId}
        unreadNotifications={unreadNotifications}
        onNotificationClick={handleNotificationClickPayload}
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
        onNotificationClick={handleNotificationClickPayload}
      />
    )

  return <Stairs>{page}</Stairs>
}

export default App
