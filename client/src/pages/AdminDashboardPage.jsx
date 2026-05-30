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

const formatDate = (value) => {
  if (!value) return 'Just now'
  return new Date(value).toLocaleString()
}

const StatCard = ({ label, value, detail, accent = 'from-brand-500 to-brand-700' }) => (
  <div className='rounded-3xl border border-white/70 bg-white/90 p-5 shadow-soft backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/90'>
    <div className={`mb-4 h-2 w-20 rounded-full bg-gradient-to-r ${accent}`} />
    <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>{label}</p>
    <div className='mt-2 flex items-end justify-between gap-4'>
      <h3 className='text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50'>{value}</h3>
      <p className='max-w-[10rem] text-right text-xs leading-5 text-slate-500 dark:text-slate-400'>{detail}</p>
    </div>
  </div>
)

const SectionShell = ({ id, title, subtitle, children }) => (
  <section id={id} className='rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-soft backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/90'>
    <div className='mb-4'>
      <h2 className='text-xl font-bold text-slate-900 dark:text-slate-50'>{title}</h2>
      <p className='text-sm text-slate-500 dark:text-slate-400'>{subtitle}</p>
    </div>
    {children}
  </section>
)

const StatusBar = ({ label, value, total, tone = 'bg-brand-500' }) => {
  const width = total > 0 ? Math.max(8, Math.round((value / total) * 100)) : 0

  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between text-sm'>
        <span className='text-slate-600 dark:text-slate-300'>{label}</span>
        <span className='font-semibold text-slate-900 dark:text-slate-50'>{value}</span>
      </div>
      <div className='h-2 rounded-full bg-slate-100 dark:bg-slate-800'>
        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function AdminDashboardPage({ authUser, onSignOut }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('campustrace-admin-theme') || 'light')
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('campustrace-admin-theme', theme)
  }, [theme])

  useEffect(() => {
    const loadSummary = async () => {
      if (authUser?.role !== 'admin') {
        setError('Admin access required.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const token = localStorage.getItem('accessToken')
        const response = await fetch('/api/admin/dashboard', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.message || 'Failed to load admin dashboard.')
        }

        const data = await response.json()
        setSummary(data)
      } catch (fetchError) {
        setError(fetchError.message || 'Failed to load admin dashboard.')
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [authUser])

  const metrics = summary?.metrics || {}
  const recent = summary?.recent || {}
  const reportStatusTotal = metrics.reports?.byStatus?.reduce((total, item) => total + item.count, 0) || 0
  const claimStatusTotal = metrics.claims?.byStatus?.reduce((total, item) => total + item.count, 0) || 0
  const recentActivities = recent.activities || []

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
    <div className='relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.15),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_#fffaf5_0%,_#f8fafc_48%,_#eef2f7_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(148,163,184,0.08),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_48%,_#111827_100%)] dark:text-slate-100'>
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl' />
        <div className='absolute right-0 top-40 h-96 w-96 rounded-full bg-slate-900/5 blur-3xl' />
      </div>

      <main className='relative mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <div className='grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]'>
          <aside className='lg:sticky lg:top-6 lg:h-fit'>
            <div className='rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/90'>
              <div className='space-y-5'>
                <div>
                  <div className='inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'>
                    Admin Control Room
                  </div>
                  <h1 className='mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50'>CampusTrace</h1>
                  <p className='mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400'>Centered admin workspace for operations, moderation, audit, and investigations.</p>
                </div>

                <div className='rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60'>
                  <p className='text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400'>Signed in as</p>
                  <p className='font-semibold text-slate-900 dark:text-slate-50'>{authUser?.name || 'Admin'}</p>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>{authUser?.email || 'admin@campustrace.local'}</p>
                </div>

                <nav className='space-y-2'>
                  {navigationItems.map((item) => (
                    <button
                      key={item.id}
                      type='button'
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${activeSection === item.id ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200' : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>

                <button
                  type='button'
                  onClick={onSignOut}
                  className='w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                >
                  Sign Out
                </button>
              </div>
            </div>
          </aside>

          <div className='space-y-8'>
            <header className='rounded-[2rem] border border-white/70 bg-white/90 px-5 py-5 shadow-soft backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/90 sm:px-6'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                <div className='space-y-2'>
                  <div className='inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'>
                    Admin Dashboard
                  </div>
                  <p className='max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400'>
                    Monitor users, reports, claims, matches, fraud cases, audit logs, and notifications from one place.
                  </p>
                </div>

                <div className='flex flex-wrap items-center gap-3'>
                  <button
                    type='button'
                    onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
                    className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200'
                  >
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </button>
                  <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60'>
                    <p className='text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400'>Signed in as</p>
                    <p className='font-semibold text-slate-900 dark:text-slate-50'>{authUser?.name || 'Admin'}</p>
                    <p className='text-sm text-slate-500 dark:text-slate-400'>{authUser?.email || 'admin@campustrace.local'}</p>
                  </div>
                  <button
                    type='button'
                    onClick={onSignOut}
                    className='rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </header>

            {loading ? (
              <div className='grid place-items-center rounded-[2rem] border border-white/70 bg-white/90 py-20 shadow-soft backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/90'>
                <div className='space-y-3 text-center'>
                  <div className='mx-auto h-12 w-12 animate-pulse rounded-full bg-brand-500/20' />
                  <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>Loading dashboard summary...</p>
                </div>
              </div>
            ) : error ? (
              <div className='rounded-[2rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-soft dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300'>
                {error}
              </div>
            ) : (
              <>
                <section id='overview' className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
                  <StatCard label='Total users' value={metrics.users?.total ?? 0} detail={`${usersByRole.student ?? 0} students, ${usersByRole.admin ?? 0} admins`} />
                  <StatCard label='Active users' value={metrics.users?.active ?? 0} detail={`${usersByStatus.active ?? 0} active accounts`} accent='from-emerald-500 to-teal-600' />
                  <StatCard label='Reports' value={metrics.reports?.total ?? 0} detail='Lost and found items in circulation' accent='from-brand-400 to-brand-600' />
                  <StatCard label='Claims' value={metrics.claims?.total ?? 0} detail='Verification and ownership reviews' accent='from-slate-700 to-slate-900' />
                  <StatCard label='Matches' value={metrics.matches?.total ?? 0} detail='AI-powered pairing results' accent='from-amber-500 to-orange-600' />
                  <StatCard label='Unread notifications' value={metrics.notifications?.unread ?? 0} detail={`${metrics.notifications?.total ?? 0} notifications stored`} accent='from-emerald-500 to-teal-600' />
                  <StatCard label='Fraud cases' value={metrics.fraudReports?.open ?? 0} detail={`${metrics.fraudReports?.total ?? 0} under investigation`} accent='from-rose-500 to-red-600' />
                </section>

                <section id='activity' className='grid gap-6 xl:grid-cols-[1.35fr_0.95fr]'>
                  <div className='space-y-6'>
                    <SectionShell id='reports' title='Recent Reports' subtitle='Latest item reports submitted by the community'>
                      <div className='overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800'>
                        <table className='min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800'>
                          <thead className='bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400'>
                            <tr>
                              <th className='px-4 py-3'>Title</th>
                              <th className='px-4 py-3'>Type</th>
                              <th className='px-4 py-3'>Status</th>
                              <th className='px-4 py-3'>Owner</th>
                              <th className='px-4 py-3'>Created</th>
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900'>
                            {(recent.reports || []).map((report) => (
                              <tr key={report.id} className='align-top'>
                                <td className='px-4 py-3'>
                                  <p className='font-semibold text-slate-900 dark:text-slate-50'>{report.title}</p>
                                  <p className='text-xs text-slate-500 dark:text-slate-400'>{report.category}</p>
                                </td>
                                <td className='px-4 py-3'>
                                  <span className='rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'>{report.itemType}</span>
                                </td>
                                <td className='px-4 py-3'>
                                  <span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200'>{report.status}</span>
                                </td>
                                <td className='px-4 py-3 text-slate-600 dark:text-slate-400'>
                                  <p className='font-medium text-slate-900 dark:text-slate-50'>{report.owner?.name || 'Unknown'}</p>
                                  <p className='text-xs'>{report.owner?.email || '-'}</p>
                                </td>
                                <td className='px-4 py-3 text-slate-500 dark:text-slate-400'>{formatDate(report.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </SectionShell>

                    <SectionShell id='claims' title='Recent Claims' subtitle='Claims waiting for review or already processed'>
                      <div className='grid gap-3'>
                        {(recent.claims || []).map((claim) => (
                          <article key={claim.id} className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60'>
                            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                              <div>
                                <p className='font-semibold text-slate-900 dark:text-slate-50'>{claim.report?.title || 'Untitled report'}</p>
                                <p className='text-sm text-slate-600 dark:text-slate-400'>Claimed by {claim.claimer?.name || 'Unknown'} · {claim.report?.itemType || 'item'}</p>
                              </div>
                              <div className='flex flex-wrap gap-2'>
                                <span className='rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900'>{claim.status}</span>
                                <span className='rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'>verified: {claim.isVerified ? 'yes' : 'no'}</span>
                              </div>
                            </div>
                            <p className='mt-3 text-xs text-slate-500 dark:text-slate-400'>{formatDate(claim.createdAt)}</p>
                          </article>
                        ))}
                      </div>
                    </SectionShell>

                    <SectionShell id='matches' title='Recent Matches' subtitle='Machine-generated pairings and their current state'>
                      <div className='grid gap-3'>
                        {(recent.matches || []).map((match) => (
                          <article key={match.id} className='rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/60'>
                            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                              <div>
                                <p className='font-semibold text-slate-900 dark:text-slate-50'>Match score {match.matchScore}</p>
                                <p className='text-sm text-slate-600 dark:text-slate-400'>{match.lostItem?.title || 'Lost item'} paired with {match.foundItem?.title || 'found item'}</p>
                              </div>
                              <span className='rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'>{match.status}</span>
                            </div>
                            <p className='mt-3 text-xs text-slate-500 dark:text-slate-400'>{formatDate(match.createdAt)}</p>
                          </article>
                        ))}
                      </div>
                    </SectionShell>
                  </div>

                  <div className='space-y-6'>
                    <SectionShell id='users' title='Users' subtitle='Account counts and recent registrations'>
                      <div className='space-y-5'>
                        <StatusBar label='Active users' value={metrics.users?.active ?? 0} total={metrics.users?.total ?? 0} tone='bg-emerald-500' />
                        <StatusBar label='Students' value={usersByRole.student ?? 0} total={metrics.users?.total ?? 0} tone='bg-brand-500' />
                        <StatusBar label='Admins' value={usersByRole.admin ?? 0} total={metrics.users?.total ?? 0} tone='bg-slate-900' />
                        <StatusBar label='Suspended' value={usersByStatus.suspended ?? 0} total={metrics.users?.total ?? 0} tone='bg-rose-500' />
                      </div>
                      <div className='mt-5 grid gap-3'>
                        {(recent.users || []).map((user) => (
                          <div key={user.id} className='rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60'>
                            <div className='flex items-start justify-between gap-3'>
                              <div>
                                <p className='font-semibold text-slate-900 dark:text-slate-50'>{user.name}</p>
                                <p className='text-sm text-slate-600 dark:text-slate-400'>{user.email}</p>
                              </div>
                              <span className='rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'>{user.role}</span>
                            </div>
                            <p className='mt-2 text-xs text-slate-500 dark:text-slate-400'>{formatDate(user.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    </SectionShell>

                    <SectionShell id='fraud' title='Fraud Investigation' subtitle='Open fraud cases and risk overview'>
                      <div className='space-y-5'>
                        <StatusBar label='Open cases' value={metrics.fraudReports?.open || 0} total={metrics.fraudReports?.total || 0} tone='bg-rose-500' />
                        <StatusBar label='Under review' value={Math.max(0, (metrics.fraudReports?.total || 0) - (metrics.fraudReports?.open || 0))} total={metrics.fraudReports?.total || 0} tone='bg-amber-500' />
                      </div>
                      <p className='mt-4 text-sm text-slate-500 dark:text-slate-400'>The fraud case collection and admin investigation endpoints are ready for drill-down views and enforcement actions.</p>
                    </SectionShell>

                    <SectionShell id='audit' title='Recent Activities' subtitle='Admin audit trail and high-risk actions'>
                      <div className='grid gap-3'>
                        {recentActivities.length === 0 ? (
                          <p className='text-sm text-slate-500 dark:text-slate-400'>No admin activity has been recorded yet.</p>
                        ) : (
                          recentActivities.map((activity) => (
                            <div key={activity.id} className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60'>
                              <div className='flex items-start justify-between gap-3'>
                                <div>
                                  <p className='text-sm font-semibold text-slate-900 dark:text-slate-50'>{activity.summary}</p>
                                  <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>{activity.action} · {activity.targetType}</p>
                                </div>
                                <span className='rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'>{formatDate(activity.createdAt)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </SectionShell>

                    <SectionShell id='notifications' title='Notifications' subtitle='Recent notification events generated by the system'>
                      <div className='grid gap-3'>
                        {(recent.notifications || []).map((notification) => (
                          <div key={notification.id} className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60'>
                            <p className='text-sm font-medium text-slate-800 dark:text-slate-100'>{notification.message}</p>
                            <div className='mt-2 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400'>
                              <span>{notification.type}</span>
                              <span>{notification.user?.name || 'Unknown user'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SectionShell>

                    <SectionShell id='settings' title='Settings' subtitle='Quick admin preferences and session actions'>
                      <div className='grid gap-3 sm:grid-cols-2'>
                        <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60'>
                          <p className='text-sm font-semibold text-slate-900 dark:text-slate-50'>Dashboard view</p>
                          <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>Keep this summary layout as your default landing view.</p>
                        </div>
                        <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60'>
                          <p className='text-sm font-semibold text-slate-900 dark:text-slate-50'>Notifications</p>
                          <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>Unread alerts are tracked in the top navigation.</p>
                        </div>
                        <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2 dark:border-slate-800 dark:bg-slate-950/60'>
                          <p className='text-sm font-semibold text-slate-900 dark:text-slate-50'>Session actions</p>
                          <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>Use the sign out button in the sidebar whenever you need to end the current admin session.</p>
                        </div>
                      </div>
                    </SectionShell>

                    <SectionShell title='Top Categories' subtitle='Most common report categories on the platform'>
                      <div className='grid gap-3'>
                        {(summary?.topCategories || []).map((category, index) => (
                          <div key={category._id || index} className='flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60'>
                            <span className='font-medium text-slate-700 dark:text-slate-200'>{category._id || 'Uncategorized'}</span>
                            <span className='rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'>{category.count}</span>
                          </div>
                        ))}
                      </div>
                    </SectionShell>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboardPage
