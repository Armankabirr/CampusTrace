import { useEffect, useMemo, useState } from 'react'

const navigationItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'users', label: 'Users' },
  { id: 'reports', label: 'Reports' },
  { id: 'matches', label: 'Matches' },
  { id: 'claims', label: 'Claims' },
  { id: 'fraud', label: 'Fraud' },
  { id: 'audit', label: 'Audit Logs' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'settings', label: 'Settings' },
]

function formatDate(value) {
  if (!value) return 'Just now'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

function AdminDashboardPage({ authUser, onSignOut }) {
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
        }
      } catch {
        // keep placeholders
      } finally {
        setLoading(false)
      }
    }
    loadSummary()
  }, [])

  const metrics = summary?.metrics || { users: { total: 24800, active: 2400 }, reports: { total: 1200 }, claims: { total: 320 }, matches: { total: 5600 }, notifications: { unread: 32, total: 120 }, fraudReports: { total: 24, open: 6 } }
  const recent = summary?.recent || { reports: [], claims: [], matches: [], users: [], notifications: [], activities: [] }

  const usersByRole = useMemo(() => {
    return (metrics.users?.byRole || []).reduce((accumulator, item) => {
      accumulator[item.value] = item.count
      return accumulator
    }, {})
  }, [metrics.users?.byRole])

  const usersByStatus = useMemo(() => {
    return (metrics.users?.byStatus || []).reduce((accumulator, item) => {
      accumulator[item.value] = item.count
      return accumulator
    }, {})
  }, [metrics.users?.byStatus])

  const reportStatusCounts = metrics.reports?.byStatus || []
  const claimStatusCounts = metrics.claims?.byStatus || []
  const openReportsCount = (metrics.reports?.total || 0) - ((reportStatusCounts.find(r=>r.value==='resolved')?.count || 0) + (reportStatusCounts.find(r=>r.value==='archived')?.count || 0))
  const pendingClaimsCount = claimStatusCounts.find(c=>c.value==='pending')?.count || 0

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId)
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className='min-h-screen bg-gray-900 text-gray-100'>
      <div className='flex'>
        <aside className='w-64 bg-slate-950 p-6 hidden md:block'>
          <div className='flex items-center justify-between'>
            <div className='text-lg font-bold'>CampusTrace</div>
            <button onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} className='text-sm px-2 py-1 bg-slate-800 rounded'>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
          <nav className='mt-8 space-y-1'>
            {navigationItems.map((item) => (
              <button key={item.id} onClick={() => scrollToSection(item.id)} className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md ${activeSection === item.id ? 'bg-indigo-600/30 text-white' : 'text-gray-300 hover:bg-slate-800/40'}`}>
                <span className='w-2 h-2 rounded-full bg-indigo-400' />
                <span className='flex-1'>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className='mt-8 text-xs text-gray-400'>Admin</div>
        </aside>

        <main className='flex-1 p-6'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-2xl font-bold'>Admin Dashboard</h1>
              <p className='text-sm text-gray-400'>Overview & quick actions</p>
            </div>
            <div className='flex items-center gap-3'>
              <button onClick={onSignOut} className='px-3 py-2 bg-rose-600 rounded text-white'>Sign Out</button>
              <div className='text-sm text-gray-400'>{authUser?.email || 'admin@campustrace.local'}</div>
            </div>
          </div>

          {/* users summary small panel */}
          <div className='mb-6 flex gap-4'>
            <div className='bg-slate-800 rounded-lg p-3 text-sm'>
              <div className='text-gray-400'>Total users</div>
              <div className='font-bold'>{metrics.users?.total ?? 0}</div>
            </div>
            <div className='bg-slate-800 rounded-lg p-3 text-sm'>
              <div className='text-gray-400'>Active</div>
              <div className='font-bold'>{metrics.users?.active ?? 0}</div>
            </div>
            <div className='bg-slate-800 rounded-lg p-3 text-sm'>
              <div className='text-gray-400'>Students</div>
              <div className='font-bold'>{usersByRole.student ?? 0}</div>
            </div>
            <div className='bg-slate-800 rounded-lg p-3 text-sm'>
              <div className='text-gray-400'>Suspended</div>
              <div className='font-bold'>{usersByStatus.suspended ?? 0}</div>
            </div>
          </div>

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
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <div className='bg-slate-800 rounded-lg p-4'>
              <div className='text-sm text-gray-400'>Total Reports</div>
              <div className='text-2xl font-bold'>{metrics.reports?.total ?? 0}</div>
              <div className='mt-2 text-xs text-gray-400'>Reports submitted by users</div>
            </div>
            <div className='bg-slate-800 rounded-lg p-4'>
              <div className='text-sm text-gray-400'>Open Reports</div>
              <div className='text-2xl font-bold'>{metrics.reports?.open ?? (metrics.reports?.byStatus ? metrics.reports.byStatus.reduce((a,b)=>a+(b.value==='open'?b.count:0),0) : 0)}</div>
              <div className='mt-2 text-xs text-gray-400'>Reports still awaiting resolution</div>
            </div>
            <div className='bg-slate-800 rounded-lg p-4'>
              <div className='text-sm text-gray-400'>Matches Created</div>
              <div className='text-2xl font-bold'>{metrics.matches?.total ?? 0}</div>
              <div className='mt-2 text-xs text-gray-400'>AI-powered match attempts</div>
            </div>
            <div className='bg-slate-800 rounded-lg p-4'>
              <div className='text-sm text-gray-400'>Pending Claims</div>
              <div className='text-2xl font-bold'>{pendingClaimsCount}</div>
              <div className='mt-2 text-xs text-gray-400'>Claims awaiting moderator review</div>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
            <div className='lg:col-span-2 bg-slate-800 rounded-lg p-4'>
              <div className='flex items-center justify-between mb-3'>
                <div className='text-sm text-gray-300'>Reports Trend</div>
                <div className='text-sm text-gray-400'>Last 30 days</div>
              </div>
              <div className='h-48 rounded bg-gradient-to-r from-indigo-600/30 to-emerald-400/10' />
            </div>
            <div className='bg-slate-800 rounded-lg p-4'>
              <div className='text-sm text-gray-300'>Resolution Rate</div>
              <div className='mt-4 flex items-center justify-center'>
                <div className='w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center text-xl font-semibold'>{Math.round(((metrics.reports?.total - openReportsCount) / Math.max(1, metrics.reports?.total)) * 100) || 0}%</div>
              </div>
              <div className='mt-3 text-xs text-gray-400'>Resolved vs open reports</div>
            </div>
          </div>

          <div className='mt-6 bg-slate-800 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='text-sm text-gray-300'>Recent Activity</div>
              <div className='text-sm text-gray-400'>Now</div>
            </div>
            <ul className='divide-y divide-slate-700'>
              {(recent.activities && recent.activities.length > 0 ? recent.activities : [
                ...(recent.reports || []).slice(0,3).map(r=>({id:`report-${r.id||r._id}`, summary:`Report: ${r.title||r._id}`, action:r.status || 'submitted', targetType:'Report', createdAt:r.createdAt})),
                ...(recent.matches || []).slice(0,3).map(m=>({id:`match-${m.id||m._id}`, summary:`Match: ${m.lostItem?.title||'lost'} ↔ ${m.foundItem?.title||'found'}`, action: m.status || 'matched', targetType: 'Match', createdAt: m.createdAt})),
                ...(recent.claims || []).slice(0,3).map(c=>({id:`claim-${c.id||c._id}`, summary:`Claim: ${c.report?.title||'report'}`, action: c.status || 'claimed', targetType: 'Claim', createdAt: c.createdAt})),
              ]).map((activity) => (
                <li key={activity.id} className='py-2 flex justify-between text-sm'>
                  <div>{activity.summary}</div>
                  <div className='text-gray-400'>{formatDate(activity.createdAt)}</div>
                </li>
              ))}
            </ul>
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  )
}

export default AdminDashboardPage
