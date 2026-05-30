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
      } catch (e) {
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
              <button className='px-3 py-2 bg-indigo-600 rounded text-white'>New</button>
              <div className='text-sm text-gray-400'>{authUser?.email || 'admin@campustrace.local'}</div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='bg-slate-800 rounded-lg p-4'>
              <div className='text-sm text-gray-400'>Total Revenue</div>
              <div className='text-2xl font-bold'>$168.5K</div>
              <div className='mt-3 h-10'><svg className='w-full h-10' /></div>
            </div>
            <div className='bg-slate-800 rounded-lg p-4'>
              <div className='text-sm text-gray-400'>New Users</div>
              <div className='text-2xl font-bold'>2.4k</div>
              <div className='mt-3 h-10'><svg className='w-full h-10' /></div>
            </div>
            <div className='bg-slate-800 rounded-lg p-4'>
              <div className='text-sm text-gray-400'>Matches</div>
              <div className='text-2xl font-bold'>5.6k</div>
              <div className='mt-3 h-10'><svg className='w-full h-10' /></div>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
            <div className='lg:col-span-2 bg-slate-800 rounded-lg p-4'>
              <div className='flex items-center justify-between mb-3'>
                <div className='text-sm text-gray-300'>Sales & Visits</div>
                <div className='text-sm text-gray-400'>Monthly</div>
              </div>
              <div className='h-48 rounded bg-gradient-to-r from-indigo-600/30 to-emerald-400/10' />
            </div>
            <div className='bg-slate-800 rounded-lg p-4'>
              <div className='text-sm text-gray-300'>Order Status</div>
              <div className='mt-4 flex items-center justify-center'>
                <div className='w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center text-xl font-semibold'>68%</div>
              </div>
            </div>
          </div>

          <div className='mt-6 bg-slate-800 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='text-sm text-gray-300'>Recent Activity</div>
              <div className='text-sm text-gray-400'>Now</div>
            </div>
            <ul className='divide-y divide-slate-700'>
              <li className='py-2 flex justify-between text-sm'><div>New report submitted by user@example.com</div><div className='text-gray-400'>2m</div></li>
              <li className='py-2 flex justify-between text-sm'><div>Match confirmed for Report #1234</div><div className='text-gray-400'>10m</div></li>
              <li className='py-2 flex justify-between text-sm'><div>User suspended: user2@example.com</div><div className='text-gray-400'>1h</div></li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboardPage
