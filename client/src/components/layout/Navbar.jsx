import { useEffect, useRef, useState } from 'react'

function Navbar({
  authUser,
  activePage = 'home',
  onHome,
  onBrowse,
  onMatches,
  onLogin,
  onSignup,
  onAvatarClick,
  onReportItem,
  unreadNotifications = 0,
  onNotificationClick,
}) {
  const userInitial = authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'U'
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const onDocumentClick = (e) => {
      if (notifOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocumentClick)
    return () => document.removeEventListener('mousedown', onDocumentClick)
  }, [notifOpen])

  const fetchNotifications = async () => {
    try {
      setNotifLoading(true)
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setNotifications([])
        return
      }

      const res = await fetch('/api/notifications/my-notifications', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        setNotifications([])
        return
      }

      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch (err) {
      setNotifications([])
    } finally {
      setNotifLoading(false)
    }
  }

  const handleNotificationToggle = async () => {
    if (!notifOpen) await fetchNotifications()
    setNotifOpen((v) => !v)
  }

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      await fetch('/api/notifications/mark-all-as-read', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })

      setNotifications((prev) => prev.map((p) => ({ ...p, isRead: true })))
      if (typeof onNotificationClick === 'function') onNotificationClick({ markAllRead: true })
    } catch (err) {
      // ignore
    }
  }

  const handleNotificationItemClick = async (n) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      // mark as read on server
      await fetch(`/api/notifications/${n._id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })

      setNotifications((prev) => prev.map((p) => (p._id === n._id ? { ...p, isRead: true } : p)))

      if (typeof onNotificationClick === 'function') {
        onNotificationClick({
          notificationId: n._id,
          claimId: n.claimId?._id || n.claimId,
          reportId: n.reportId?._id || n.reportId,
          type: n.type,
        })
      }

      setNotifOpen(false)
    } catch (err) {
      // ignore
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-white/60 bg-white/90 px-4 py-3 shadow-soft backdrop-blur">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2 text-left transition hover:opacity-90"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
            Q
          </span>
          <div>
            <p className="text-sm font-bold leading-none">CampusTrace</p>
            <p className="text-[11px] text-slate-500">UIU Lost and Found</p>
          </div>
        </button>

        <div className="hidden items-center gap-2 rounded-full bg-slate-100 p-1 text-sm text-slate-500 lg:flex">
          <button
            className={`rounded-full px-4 py-1.5 transition ${activePage === 'home' ? 'bg-white text-brand-600 shadow' : 'hover:bg-white'}`}
            onClick={onHome}
            type="button"
          >
            Home
          </button>
          <button className="rounded-full px-4 py-1.5 transition hover:bg-white" onClick={onBrowse} type="button">
            Browse
          </button>
          <button className="rounded-full px-4 py-1.5 transition hover:bg-white" onClick={onMatches} type="button">
            Matches
          </button>
        </div>

        <div className="flex items-center gap-2">
          {authUser ? (
            <>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={handleNotificationToggle}
                  title="Notifications"
                  className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white transition hover:border-brand-300 hover:bg-slate-50"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-auto bg-white rounded-2xl shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          Mark all as read
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifOpen(false)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    {notifLoading ? (
                      <div className="p-4 text-sm text-slate-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">No notifications</div>
                    ) : (
                      <ul className="divide-y">
                        {notifications.map((n) => (
                          <li key={n._id} className="px-3 py-2 first:pt-3 last:pb-3 hover:bg-slate-50">
                            <button
                              type="button"
                              onClick={() => handleNotificationItemClick(n)}
                              className="w-full text-left"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <p className={`text-sm ${n.isRead ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
                                    {n.message}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                                </div>
                                {!n.isRead && <span className="h-3 w-3 mt-1 rounded-full bg-blue-500" />}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onReportItem}
                className="hidden rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 md:block"
              >
                + Report Item
              </button>
              <button
                type="button"
                onClick={onAvatarClick}
                title={authUser.name || 'User profile'}
                className="grid h-10 w-10 place-items-center rounded-full border border-orange-100 bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {userInitial}
              </button>
            </>
          ) : (
            <>
              <button
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-700 md:block"
                onClick={onLogin}
                type="button"
              >
                Sign In
              </button>
              <button
                className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
                onClick={onSignup}
                type="button"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
