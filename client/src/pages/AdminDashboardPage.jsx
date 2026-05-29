import { useEffect, useState } from 'react'

const formatDate = (value) => {
  if (!value) return 'Just now'
  return new Date(value).toLocaleString()
}

const StatCard = ({ label, value, detail, accent = 'from-brand-500 to-brand-700' }) => (
  <div className='rounded-3xl border border-white/70 bg-white/90 p-5 shadow-soft backdrop-blur'>
    <div className={`mb-4 h-2 w-20 rounded-full bg-gradient-to-r ${accent}`} />
    <p className='text-sm font-medium text-slate-500'>{label}</p>
    <div className='mt-2 flex items-end justify-between gap-4'>
      <h3 className='text-3xl font-extrabold tracking-tight text-slate-900'>{value}</h3>
      <p className='max-w-[10rem] text-right text-xs leading-5 text-slate-500'>{detail}</p>
    </div>
  </div>
)

const SectionShell = ({ title, subtitle, children, action }) => (
  <section className='rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-soft backdrop-blur'>
    <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
      <div>
        <h2 className='text-xl font-bold text-slate-900'>{title}</h2>
        <p className='text-sm text-slate-500'>{subtitle}</p>
      </div>
      {action}
    </div>
    {children}
  </section>
)

const StatusBar = ({ label, value, total, tone = 'bg-brand-500' }) => {
  const width = total > 0 ? Math.max(8, Math.round((value / total) * 100)) : 0

  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between text-sm'>
        <span className='text-slate-600'>{label}</span>
        <span className='font-semibold text-slate-900'>{value}</span>
      </div>
      <div className='h-2 rounded-full bg-slate-100'>
        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function AdminDashboardPage({ authUser, onSignOut }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <div className='relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.15),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_#fffaf5_0%,_#f8fafc_48%,_#eef2f7_100%)] text-slate-900'>
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl' />
        <div className='absolute right-0 top-40 h-96 w-96 rounded-full bg-slate-900/5 blur-3xl' />
      </div>

      <main className='relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8'>
        <header className='rounded-[2rem] border border-white/70 bg-white/90 px-5 py-5 shadow-soft backdrop-blur sm:px-6'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div className='space-y-2'>
              <div className='inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700'>
                Admin Control Room
              </div>
              <div>
                <h1 className='text-3xl font-black tracking-tight sm:text-4xl'>CampusTrace Admin Dashboard</h1>
                <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600'>
                  Monitor users, reports, claims, matches, and notifications from one place. Admins are redirected here automatically after sign in.
                </p>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-3'>
              <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
                <p className='text-[11px] uppercase tracking-[0.22em] text-slate-500'>Signed in as</p>
                <p className='font-semibold text-slate-900'>{authUser?.name || 'Admin'}</p>
                <p className='text-sm text-slate-500'>{authUser?.email || 'admin@campustrace.local'}</p>
              </div>
              <button
                type='button'
                onClick={onSignOut}
                className='rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800'
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className='grid place-items-center rounded-[2rem] border border-white/70 bg-white/90 py-20 shadow-soft backdrop-blur'>
            <div className='space-y-3 text-center'>
              <div className='mx-auto h-12 w-12 animate-pulse rounded-full bg-brand-500/20' />
              <p className='text-sm font-medium text-slate-600'>Loading dashboard summary...</p>
            </div>
          </div>
        ) : error ? (
          <div className='rounded-[2rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-soft'>
            {error}
          </div>
        ) : (
          <>
            <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
              <StatCard
                label='Total users'
                value={metrics.users?.total ?? 0}
                detail={`${metrics.users?.students ?? 0} students and ${metrics.users?.admins ?? 0} admins`}
              />
              <StatCard
                label='Reports'
                value={metrics.reports?.total ?? 0}
                detail='Lost and found items currently in the system'
                accent='from-brand-400 to-brand-600'
              />
              <StatCard
                label='Claims'
                value={metrics.claims?.total ?? 0}
                detail='Verification and ownership review requests'
                accent='from-slate-700 to-slate-900'
              />
              <StatCard
                label='Matches'
                value={metrics.matches?.total ?? 0}
                detail='AI-powered pairing results in circulation'
                accent='from-amber-500 to-orange-600'
              />
              <StatCard
                label='Unread notifications'
                value={metrics.notifications?.unread ?? 0}
                detail={`${metrics.notifications?.total ?? 0} notifications stored overall`}
                accent='from-emerald-500 to-teal-600'
              />
            </section>

            <section className='grid gap-6 xl:grid-cols-[1.4fr_0.9fr]'>
              <div className='space-y-6'>
                <SectionShell title='Recent Reports' subtitle='Latest item reports submitted by the community'>
                  <div className='overflow-hidden rounded-2xl border border-slate-200'>
                    <table className='min-w-full divide-y divide-slate-200 text-sm'>
                      <thead className='bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500'>
                        <tr>
                          <th className='px-4 py-3'>Title</th>
                          <th className='px-4 py-3'>Type</th>
                          <th className='px-4 py-3'>Status</th>
                          <th className='px-4 py-3'>Owner</th>
                          <th className='px-4 py-3'>Created</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-slate-100 bg-white'>
                        {(recent.reports || []).map((report) => (
                          <tr key={report.id} className='align-top'>
                            <td className='px-4 py-3'>
                              <p className='font-semibold text-slate-900'>{report.title}</p>
                              <p className='text-xs text-slate-500'>{report.category}</p>
                            </td>
                            <td className='px-4 py-3'>
                              <span className='rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700'>
                                {report.itemType}
                              </span>
                            </td>
                            <td className='px-4 py-3'>
                              <span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700'>
                                {report.status}
                              </span>
                            </td>
                            <td className='px-4 py-3 text-slate-600'>
                              <p className='font-medium text-slate-900'>{report.owner?.name || 'Unknown'}</p>
                              <p className='text-xs'>{report.owner?.email || '-'}</p>
                            </td>
                            <td className='px-4 py-3 text-slate-500'>{formatDate(report.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionShell>

                <SectionShell title='Recent Claims' subtitle='Claims waiting for review or already processed'>
                  <div className='grid gap-3'>
                    {(recent.claims || []).map((claim) => (
                      <article key={claim.id} className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                          <div>
                            <p className='font-semibold text-slate-900'>
                              {claim.report?.title || 'Untitled report'}
                            </p>
                            <p className='text-sm text-slate-600'>
                              Claimed by {claim.claimer?.name || 'Unknown'} · {claim.report?.itemType || 'item'}
                            </p>
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            <span className='rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white'>
                              {claim.status}
                            </span>
                            <span className='rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200'>
                              verified: {claim.isVerified ? 'yes' : 'no'}
                            </span>
                          </div>
                        </div>
                        <p className='mt-3 text-xs text-slate-500'>{formatDate(claim.createdAt)}</p>
                      </article>
                    ))}
                  </div>
                </SectionShell>

                <SectionShell title='Recent Matches' subtitle='Machine-generated pairings and their current state'>
                  <div className='grid gap-3'>
                    {(recent.matches || []).map((match) => (
                      <article key={match.id} className='rounded-2xl border border-slate-200 bg-white p-4'>
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                          <div>
                            <p className='font-semibold text-slate-900'>Match score {match.matchScore}</p>
                            <p className='text-sm text-slate-600'>
                              {match.lostItem?.title || 'Lost item'} paired with {match.foundItem?.title || 'found item'}
                            </p>
                          </div>
                          <span className='rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700'>
                            {match.status}
                          </span>
                        </div>
                        <p className='mt-3 text-xs text-slate-500'>{formatDate(match.createdAt)}</p>
                      </article>
                    ))}
                  </div>
                </SectionShell>
              </div>

              <div className='space-y-6'>
                <SectionShell title='Status Breakdown' subtitle='High-level health of the system'>
                  <div className='space-y-5'>
                    <StatusBar
                      label='Active reports'
                      value={(metrics.reports?.byStatus || []).find((item) => item.value === 'active')?.count || 0}
                      total={reportStatusTotal}
                      tone='bg-brand-500'
                    />
                    <StatusBar
                      label='Matched reports'
                      value={(metrics.reports?.byStatus || []).find((item) => item.value === 'matched')?.count || 0}
                      total={reportStatusTotal}
                      tone='bg-emerald-500'
                    />
                    <StatusBar
                      label='Pending claims'
                      value={(metrics.claims?.byStatus || []).find((item) => item.value === 'pending')?.count || 0}
                      total={claimStatusTotal}
                      tone='bg-amber-500'
                    />
                    <StatusBar
                      label='Confirmed matches'
                      value={(metrics.matches?.byStatus || []).find((item) => item.value === 'confirmed')?.count || 0}
                      total={(metrics.matches?.byStatus || []).reduce((total, item) => total + item.count, 0) || 0}
                      tone='bg-slate-900'
                    />
                  </div>
                </SectionShell>

                <SectionShell title='Top Categories' subtitle='Most common report categories on the platform'>
                  <div className='grid gap-3'>
                    {(summary?.topCategories || []).map((category, index) => (
                      <div key={category._id || index} className='flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3'>
                        <span className='font-medium text-slate-700'>{category._id || 'Uncategorized'}</span>
                        <span className='rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200'>
                          {category.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </SectionShell>

                <SectionShell title='Recent Users' subtitle='Most recent accounts in the system'>
                  <div className='grid gap-3'>
                    {(recent.users || []).map((user) => (
                      <div key={user.id} className='rounded-2xl border border-slate-200 bg-white px-4 py-3'>
                        <div className='flex items-start justify-between gap-3'>
                          <div>
                            <p className='font-semibold text-slate-900'>{user.name}</p>
                            <p className='text-sm text-slate-600'>{user.email}</p>
                          </div>
                          <span className='rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700'>
                            {user.role}
                          </span>
                        </div>
                        <p className='mt-2 text-xs text-slate-500'>{formatDate(user.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </SectionShell>

                <SectionShell title='Recent Notifications' subtitle='Latest notification events generated by the system'>
                  <div className='grid gap-3'>
                    {(recent.notifications || []).map((notification) => (
                      <div key={notification.id} className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
                        <p className='text-sm font-medium text-slate-800'>{notification.message}</p>
                        <div className='mt-2 flex items-center justify-between gap-3 text-xs text-slate-500'>
                          <span>{notification.type}</span>
                          <span>{notification.user?.name || 'Unknown user'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionShell>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default AdminDashboardPage