import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/layout/AdminSidebar'

function getCount(rows, value) {
  return (rows || []).find((item) => item.value === value)?.count || 0
}

function AdminDashboardPage({ authUser, onSignOut, onOpenUserManagement, onOpenReportManagement, onOpenMatchManagement, onOpenClaimManagement }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('campustrace-admin-theme') || 'dark')
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('campustrace-admin-theme', theme)
  }, [theme])

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('accessToken')
        const response = await fetch('/api/admin/dashboard', {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (response.ok) {
          const data = await response.json()
          setSummary(data)
        } else {
          setError('Unable to load live dashboard metrics right now.')
        }
      } catch {
        setError('Unable to load live dashboard metrics right now.')
      } finally {
        setLoading(false)
      }
    }
    loadSummary()
  }, [])

  const metrics = summary?.metrics || { users: { total: 0, active: 0 }, reports: { total: 0, byType: [], byStatus: [] }, claims: { total: 0, byStatus: [] }, matches: { total: 0, byStatus: [] }, notifications: { unread: 0, total: 0 }, fraudReports: { total: 0, open: 0 } }
  const recent = summary?.recent || { reports: [], claims: [], matches: [], users: [], notifications: [], activities: [] }

  const usersByStatus = useMemo(() => {
    return (metrics.users?.byStatus || []).reduce((accumulator, item) => {
      accumulator[item.value] = item.count
      return accumulator
    }, {})
  }, [metrics.users?.byStatus])

  const reportStatusCounts = metrics.reports?.byStatus || []
  const claimStatusCounts = metrics.claims?.byStatus || []
  const matchStatusCounts = metrics.matches?.byStatus || []
  const reportTypeCounts = metrics.reports?.byType || []

  const totalUsers = metrics.users?.total ?? 0
  const activeUsers = metrics.users?.active ?? 0
  const lostItemReports = getCount(reportTypeCounts, 'lost')
  const foundItemReports = getCount(reportTypeCounts, 'found')
  const pendingMatches = getCount(matchStatusCounts, 'pending')
  const approvedMatches = getCount(matchStatusCounts, 'confirmed')
  const successfulReturns = getCount(claimStatusCounts, 'returned')
  const fraudReports = metrics.fraudReports?.total ?? 0

  const reportStatusChart = [
    { label: 'Pending', value: getCount(reportStatusCounts, 'pending'), color: 'bg-amber-300' },
    { label: 'Active', value: getCount(reportStatusCounts, 'active'), color: 'bg-sky-400' },
    { label: 'Matched', value: getCount(reportStatusCounts, 'matched'), color: 'bg-violet-400' },
    { label: 'Resolved', value: getCount(reportStatusCounts, 'resolved'), color: 'bg-emerald-400' },
    { label: 'Archived', value: getCount(reportStatusCounts, 'archived'), color: 'bg-slate-500' },
  ]

  const reportTypeChart = [
    { label: 'Lost', value: lostItemReports, color: 'bg-amber-400' },
    { label: 'Found', value: foundItemReports, color: 'bg-teal-400' },
  ]

  const matchStatusChart = [
    { label: 'Pending', value: pendingMatches, color: 'bg-yellow-400' },
    { label: 'Approved', value: approvedMatches, color: 'bg-lime-400' },
    { label: 'Rejected', value: getCount(matchStatusCounts, 'rejected'), color: 'bg-rose-400' },
  ]

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId)
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleNavigationClick = (sectionId) => {
    if (sectionId === 'user-management' && onOpenUserManagement) {
      onOpenUserManagement()
      return
    }

    if (sectionId === 'reports' && onOpenReportManagement) {
      onOpenReportManagement()
      return
    }

    if (sectionId === 'matches' && onOpenMatchManagement) {
      onOpenMatchManagement()
      return
    }

    if (sectionId === 'claims' && onOpenClaimManagement) {
      onOpenClaimManagement()
      return
    }

    scrollToSection(sectionId)
  }

  return (
    <div className='min-h-screen bg-gray-900 text-gray-100'>
      <div className='flex'>
        <AdminSidebar
          activeItemId={activeSection}
          onNavigate={handleNavigationClick}
          showThemeToggle
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onSignOut={onSignOut}
        />

        <main className='flex-1 p-6'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-2xl font-bold'>Admin Dashboard</h1>
              <p className='text-sm text-gray-400'>Overview & quick actions</p>
            </div>
            <div className='flex items-center gap-3'>
              <div className='text-sm text-gray-400'>{authUser?.email || 'admin@campustrace.local'}</div>
            </div>
          </div>

          <section id='overview' className='mb-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
              <div className='bg-slate-800 rounded-lg p-4'>
                <div className='text-sm text-gray-400'>Total users</div>
                <div className='mt-1 text-2xl font-bold'>{totalUsers}</div>
              </div>
              <div className='bg-slate-800 rounded-lg p-4'>
                <div className='text-sm text-gray-400'>Active users</div>
                <div className='mt-1 text-2xl font-bold'>{activeUsers}</div>
                <div className='mt-1 text-xs text-gray-500'>Suspended: {usersByStatus.suspended ?? 0}</div>
              </div>
              <div className='bg-slate-800 rounded-lg p-4'>
                <div className='text-sm text-gray-400'>Lost item reports</div>
                <div className='mt-1 text-2xl font-bold'>{lostItemReports}</div>
              </div>
              <div className='bg-slate-800 rounded-lg p-4'>
                <div className='text-sm text-gray-400'>Found item reports</div>
                <div className='mt-1 text-2xl font-bold'>{foundItemReports}</div>
              </div>
              <div className='bg-slate-800 rounded-lg p-4'>
                <div className='text-sm text-gray-400'>Pending matches</div>
                <div className='mt-1 text-2xl font-bold'>{pendingMatches}</div>
              </div>
              <div className='bg-slate-800 rounded-lg p-4'>
                <div className='text-sm text-gray-400'>Approved matches</div>
                <div className='mt-1 text-2xl font-bold'>{approvedMatches}</div>
              </div>
              <div className='bg-slate-800 rounded-lg p-4'>
                <div className='text-sm text-gray-400'>Successful returns</div>
                <div className='mt-1 text-2xl font-bold'>{successfulReturns}</div>
              </div>
              <div className='bg-slate-800 rounded-lg p-4'>
                <div className='text-sm text-gray-400'>Fraud reports</div>
                <div className='mt-1 text-2xl font-bold'>{fraudReports}</div>
              </div>
            </div>
          </section>

          {error ? (
            <div className='rounded-lg bg-red-700/20 border border-red-600 p-3 mb-4 text-sm text-red-100'>
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className='grid place-items-center rounded-lg border border-white/10 bg-slate-900/60 py-12 mb-6'>
              <div className='text-sm text-gray-400'>Loading dashboard summary...</div>
            </div>
          ) : (
          <>
          <section id='analytics' className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
            <div className='lg:col-span-2 bg-slate-800 rounded-lg p-4'>
              <div className='text-sm text-gray-300 mb-4'>Analytics charts</div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='rounded-lg bg-slate-900/60 p-3'>
                  <div className='text-xs uppercase tracking-wider text-gray-400 mb-3'>Reports by item type</div>
                  <div className='space-y-2'>
                    {reportTypeChart.map((entry) => {
                      const maxValue = Math.max(1, ...reportTypeChart.map((item) => item.value))
                      const width = Math.max(8, Math.round((entry.value / maxValue) * 100))
                      return (
                        <div key={entry.label}>
                          <div className='flex items-center justify-between text-sm mb-1'>
                            <span>{entry.label}</span>
                            <span className='text-gray-300'>{entry.value}</span>
                          </div>
                          <div className='h-2 w-full rounded bg-slate-700'>
                            <div className={`h-2 rounded ${entry.color}`} style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className='rounded-lg bg-slate-900/60 p-3'>
                  <div className='text-xs uppercase tracking-wider text-gray-400 mb-3'>Matches by status</div>
                  <div className='space-y-2'>
                    {matchStatusChart.map((entry) => {
                      const total = matchStatusChart.reduce((sum, item) => sum + item.value, 0)
                      const pct = Math.round((entry.value / Math.max(1, total)) * 100)
                      return (
                        <div key={entry.label} className='flex items-center justify-between text-sm'>
                          <span className='flex items-center gap-2'>
                            <span className={`w-2.5 h-2.5 rounded-full ${entry.color}`} />
                            {entry.label}
                          </span>
                          <span className='text-gray-300'>{entry.value} ({pct}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-slate-800 rounded-lg p-4'>
              <div className='text-sm text-gray-300 mb-4'>Report status split</div>
              <div className='space-y-2'>
                {reportStatusChart.map((entry) => {
                  const total = reportStatusChart.reduce((sum, item) => sum + item.value, 0)
                  const pct = Math.round((entry.value / Math.max(1, total)) * 100)
                  return (
                    <div key={entry.label}>
                      <div className='flex items-center justify-between text-sm mb-1'>
                        <span>{entry.label}</span>
                        <span className='text-gray-300'>{entry.value}</span>
                      </div>
                      <div className='h-2 w-full rounded bg-slate-700'>
                        <div className={`h-2 rounded ${entry.color}`} style={{ width: `${Math.max(8, pct)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          </>
          )}
        </main>
      </div>
    </div>
  )
}

export default AdminDashboardPage
