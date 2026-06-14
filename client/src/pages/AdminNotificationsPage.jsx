import { useEffect, useState } from 'react'
import AdminSidebar from '../components/layout/AdminSidebar'

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

function getTypeBadge(type) {
  switch (type) {
    case 'system_announcement':
      return { label: 'Announcement', bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30' }
    case 'system_warning':
      return { label: 'Warning', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' }
    case 'system_notification':
      return { label: 'System', bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/30' }
    default:
      return { label: type || 'Unknown', bg: 'bg-slate-700', text: 'text-gray-300', border: 'border-slate-600' }
  }
}

function AdminNotificationsPage({
  onBack,
  onSignOut,
  onOpenUserManagement,
  onOpenReportManagement,
  onOpenMatchManagement,
  onOpenClaimManagement,
  onOpenReviewsManagement,
}) {
  const [activeTab, setActiveTab] = useState('broadcast')
  const [toast, setToast] = useState(null)
  const [sending, setSending] = useState(false)

  // Broadcast form state
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastRole, setBroadcastRole] = useState('')

  // Warning form state
  const [warningMessage, setWarningMessage] = useState('')
  const [warningRole, setWarningRole] = useState('')

  // System notification form state
  const [systemMessage, setSystemMessage] = useState('')
  const [systemRole, setSystemRole] = useState('')

  // History state
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [historyTypeFilter, setHistoryTypeFilter] = useState('')
  const [historySearch, setHistorySearch] = useState('')

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const sendBroadcast = async (type, message, role) => {
    if (!message.trim()) {
      showToast('error', 'Message is required.')
      return
    }

    setSending(true)
    try {
      const token = localStorage.getItem('accessToken')
      const body = { message: message.trim(), type }
      if (role) body.role = role

      const response = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        showToast('success', `${data.message} Sent to ${data.count} user(s).`)
        // Clear the form
        if (type === 'system_announcement') setBroadcastMessage('')
        if (type === 'system_warning') setWarningMessage('')
        if (type === 'system_notification') setSystemMessage('')
      } else {
        const data = await response.json().catch(() => ({}))
        showToast('error', data.message || 'Failed to send notification.')
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'An error occurred while sending the notification.')
    } finally {
      setSending(false)
    }
  }

  const loadHistory = async () => {
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      params.set('page', String(historyPage))
      params.set('limit', '15')
      if (historyTypeFilter) params.set('type', historyTypeFilter)
      if (historySearch) params.set('search', historySearch)

      const response = await fetch(`/api/admin/notifications?${params.toString()}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        setHistoryError('Failed to load notification history.')
        return
      }

      const data = await response.json()
      setHistory(data.items || [])
      setHistoryTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error(err)
      setHistoryError('An error occurred while loading history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab, historyPage, historyTypeFilter, historySearch])

  const handleSidebarNavigation = (itemId) => {
    if (itemId === 'overview') onBack?.()
    else if (itemId === 'user-management') onOpenUserManagement?.()
    else if (itemId === 'reports') onOpenReportManagement?.()
    else if (itemId === 'matches') onOpenMatchManagement?.()
    else if (itemId === 'claims') onOpenClaimManagement?.()
    else if (itemId === 'reviews') onOpenReviewsManagement?.()
    else if (itemId === 'notifications') { /* already here */ }
  }

  const renderSendForm = (title, description, icon, accentColor, type, message, setMessage, role, setRole) => {
    const colorMap = {
      indigo: {
        card: 'border-indigo-500/20',
        iconBg: 'bg-indigo-500/20',
        iconText: 'text-indigo-400',
        btn: 'bg-indigo-600 hover:bg-indigo-500',
        focusRing: 'focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30',
      },
      amber: {
        card: 'border-amber-500/20',
        iconBg: 'bg-amber-500/20',
        iconText: 'text-amber-400',
        btn: 'bg-amber-600 hover:bg-amber-500',
        focusRing: 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30',
      },
      teal: {
        card: 'border-teal-500/20',
        iconBg: 'bg-teal-500/20',
        iconText: 'text-teal-400',
        btn: 'bg-teal-600 hover:bg-teal-500',
        focusRing: 'focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30',
      },
    }

    const colors = colorMap[accentColor] || colorMap.indigo

    return (
      <div className={`bg-slate-800 rounded-xl border ${colors.card} p-6 shadow-lg`}>
        {/* Header */}
        <div className='flex items-center gap-3 mb-5'>
          <div className={`w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center text-lg ${colors.iconText}`}>
            {icon}
          </div>
          <div>
            <h2 className='text-lg font-bold text-white'>{title}</h2>
            <p className='text-xs text-gray-400'>{description}</p>
          </div>
        </div>

        {/* Message input */}
        <div className='mb-4'>
          <label className='block text-xs font-medium text-gray-400 mb-1.5'>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Enter your ${title.toLowerCase()} message...`}
            rows={4}
            className={`w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-sm text-gray-100 placeholder-gray-500 ${colors.focusRing} focus:outline-none resize-none transition-colors`}
          />
        </div>

        {/* Target audience */}
        <div className='mb-5'>
          <label className='block text-xs font-medium text-gray-400 mb-1.5'>Target Audience</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-gray-300 ${colors.focusRing} focus:outline-none transition-colors`}
          >
            <option value=''>All Users</option>
            <option value='user'>Regular Users Only</option>
            <option value='admin'>Admins Only</option>
          </select>
        </div>

        {/* Send button */}
        <button
          onClick={() => sendBroadcast(type, message, role)}
          disabled={sending || !message.trim()}
          className={`w-full py-3 rounded-lg text-white font-semibold text-sm ${colors.btn} disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg`}
        >
          {sending ? (
            <span className='flex items-center justify-center gap-2'>
              <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
              Sending...
            </span>
          ) : (
            `Send ${title}`
          )}
        </button>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-900 text-gray-100'>
      <div className='flex'>
        <AdminSidebar
          activeItemId='notifications'
          onNavigate={handleSidebarNavigation}
          onSignOut={onSignOut}
        />

        <main className='flex-1 p-6'>
          {/* Page Header */}
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6'>
            <div>
              <h1 className='text-2xl font-bold'>Admin Notifications</h1>
              <p className='text-sm text-gray-400'>Broadcast announcements, send warnings, and manage system notifications</p>
            </div>
            <button onClick={onBack} className='px-3 py-2 bg-slate-800 rounded text-gray-100 hover:bg-slate-700 transition-colors'>
              Back to Dashboard
            </button>
          </div>

          {/* Toast */}
          {toast && (
            <div className='fixed top-6 right-6 z-50 animate-in slide-in-from-right-10 duration-300'>
              <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl ${toast.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' : 'border-rose-500/20 bg-rose-500/10 text-rose-100'
                }`}>
                <div className='text-sm font-bold'>{toast.type === 'success' ? '✓ Success' : '✕ Error'}</div>
                <div className='text-xs opacity-80'>{toast.message}</div>
              </div>
            </div>
          )}

          {/* Sub-navigation Tabs */}
          <div className='flex border-b border-slate-700 mb-6'>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'broadcast' ? 'border-indigo-500 text-white bg-indigo-600/5' : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
            >
              📢 Broadcast Announcements
            </button>
            <button
              onClick={() => setActiveTab('warnings')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'warnings' ? 'border-amber-500 text-white bg-amber-600/5' : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
            >
              ⚠️ Send Warnings
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'system' ? 'border-teal-500 text-white bg-teal-600/5' : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
            >
              🔔 System Notifications
            </button>
            <button
              onClick={() => { setActiveTab('history'); setHistoryPage(1); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-violet-500 text-white bg-violet-600/5' : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
            >
              📋 Notification History
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'broadcast' && (
            <div className='max-w-2xl'>
              {renderSendForm(
                'Broadcast Announcement',
                'Send an important announcement to all users or a specific group.',
                '📢',
                'indigo',
                'system_announcement',
                broadcastMessage,
                setBroadcastMessage,
                broadcastRole,
                setBroadcastRole,
              )}
            </div>
          )}

          {activeTab === 'warnings' && (
            <div className='max-w-2xl'>
              {renderSendForm(
                'Send Warning',
                'Send a warning notification to users about policy violations or important notices.',
                '⚠️',
                'amber',
                'system_warning',
                warningMessage,
                setWarningMessage,
                warningRole,
                setWarningRole,
              )}
            </div>
          )}

          {activeTab === 'system' && (
            <div className='max-w-2xl'>
              {renderSendForm(
                'System Notification',
                'Send a general system notification such as maintenance updates or feature announcements.',
                '🔔',
                'teal',
                'system_notification',
                systemMessage,
                setSystemMessage,
                systemRole,
                setSystemRole,
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {/* Filters */}
              <div className='bg-slate-800 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='md:col-span-2'>
                  <label className='block text-xs text-gray-400 mb-1'>Search Notifications</label>
                  <input
                    value={historySearch}
                    onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                    placeholder='Search by message content...'
                    className='w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm focus:border-indigo-500 focus:outline-none'
                  />
                </div>
                <div>
                  <label className='block text-xs text-gray-400 mb-1'>Type Filter</label>
                  <select
                    value={historyTypeFilter}
                    onChange={(e) => { setHistoryTypeFilter(e.target.value); setHistoryPage(1); }}
                    className='w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm focus:border-indigo-500 focus:outline-none text-gray-300'
                  >
                    <option value=''>All Types</option>
                    <option value='system_announcement'>Announcements</option>
                    <option value='system_warning'>Warnings</option>
                    <option value='system_notification'>System Notifications</option>
                  </select>
                </div>
              </div>

              {/* Error */}
              {historyError && (
                <div className='p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm'>
                  {historyError}
                </div>
              )}

              {/* History list */}
              {historyLoading ? (
                <div className='grid place-items-center py-12 bg-slate-800 rounded-lg'>
                  <div className='text-gray-400 text-sm'>Loading notification history...</div>
                </div>
              ) : history.length === 0 ? (
                <div className='grid place-items-center py-12 bg-slate-800 rounded-lg text-gray-400 text-sm'>
                  No notifications found matching your criteria.
                </div>
              ) : (
                <div className='space-y-3'>
                  {history.map((notif) => {
                    const badge = getTypeBadge(notif.type)
                    return (
                      <div
                        key={notif._id}
                        className={`bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-all ${!notif.isRead ? 'border-l-2 border-l-indigo-500' : ''
                          }`}
                      >
                        <div className='flex items-start justify-between gap-3'>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 flex-wrap mb-1.5'>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badge.bg} ${badge.text} border ${badge.border}`}>
                                {badge.label}
                              </span>
                              {!notif.isRead && (
                                <span className='px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30'>
                                  Unread
                                </span>
                              )}
                            </div>
                            <p className='text-sm text-gray-200 mb-1'>{notif.message}</p>
                            <div className='flex items-center gap-3 text-xs text-gray-500'>
                              <span>To: <span className='text-gray-400'>{notif.userId?.name || notif.userId?.email || 'Unknown User'}</span></span>
                              {notif.relatedUserId && (
                                <span>From: <span className='text-gray-400'>{notif.relatedUserId?.name || 'Admin'}</span></span>
                              )}
                            </div>
                          </div>
                          <div className='text-xs text-gray-500 whitespace-nowrap'>
                            {formatDate(notif.createdAt)}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Pagination */}
                  <div className='flex items-center justify-between mt-6 text-sm text-gray-400 bg-slate-800 p-4 rounded-lg'>
                    <button
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage <= 1}
                      className='px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 transition-colors'
                    >
                      Previous
                    </button>
                    <span>
                      Page {historyPage} of {historyTotalPages}
                    </span>
                    <button
                      onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                      disabled={historyPage >= historyTotalPages}
                      className='px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 transition-colors'
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AdminNotificationsPage
