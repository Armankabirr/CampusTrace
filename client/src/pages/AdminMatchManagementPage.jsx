import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/layout/AdminSidebar'

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

function AdminMatchManagementPage({
  onBack,
  onSignOut,
  onOpenUserManagement,
  onOpenReportManagement,
  onOpenClaimManagement,
  onOpenReviewsManagement,
  onOpenNotificationsManagement,
}) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))
    params.set('limit', '12')
    return params.toString()
  }, [statusFilter, page])

  const loadMatches = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/matches?${queryString}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        setError('Unable to load matches right now.')
        return
      }

      const data = await response.json()
      setMatches(Array.isArray(data.items) ? data.items : [])
      setTotalPages(data.totalPages || 1)
    } catch {
      setError('Unable to load matches right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [queryString])

  const updateMatchStatus = async (matchId, status) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/matches/${matchId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setToast({ type: 'success', message: `Match status updated to ${status}.` })
        loadMatches()
      } else {
        setToast({ type: 'error', message: 'Failed to update match status.' })
      }
    } catch {
      setToast({ type: 'error', message: 'An error occurred during update.' })
    } finally {
      setActionLoading(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <div className='min-h-screen bg-gray-900 text-gray-100'>
      <div className='flex'>
        <AdminSidebar
          activeItemId='matches'
          onNavigate={(itemId) => {
            if (itemId === 'overview') onBack?.()
            else if (itemId === 'user-management') onOpenUserManagement?.()
            else if (itemId === 'reports') onOpenReportManagement?.()
            else if (itemId === 'claims') onOpenClaimManagement?.()
            else if (itemId === 'reviews') onOpenReviewsManagement?.()
            else if (itemId === 'notifications') onOpenNotificationsManagement?.()
          }}
          onSignOut={onSignOut}
        />

        <main className='flex-1 p-6'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-2xl font-bold'>Match Management</h1>
              <p className='text-sm text-gray-400'>Review and manage potential item matches.</p>
            </div>
            <button onClick={onBack} className='px-3 py-2 bg-slate-800 rounded text-gray-100'>
              Back to Dashboard
            </button>
          </div>

          {toast && (
            <div className={`fixed top-6 right-6 z-50 animate-in slide-in-from-right-10 duration-300`}>
              <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl ${
                toast.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' : 'border-rose-500/20 bg-rose-500/10 text-rose-100'
              }`}>
                <div className='text-sm font-bold'>{toast.type === 'success' ? 'Success' : 'Error'}</div>
                <div className='text-xs opacity-80'>{toast.message}</div>
              </div>
            </div>
          )}

          <section className='bg-slate-800 rounded-lg p-4'>
            <div className='mb-4'>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className='px-3 py-2 rounded bg-slate-900/60 border border-slate-700 text-sm'
              >
                <option value=''>All Statuses</option>
                <option value='pending'>Pending</option>
                <option value='confirmed'>Confirmed</option>
                <option value='rejected'>Rejected</option>
              </select>
            </div>

            {loading ? (
              <div className='grid place-items-center py-12'><div className='text-gray-400 text-sm'>Loading matches...</div></div>
            ) : error ? (
              <div className='p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg'>{error}</div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                  <thead className='text-gray-400 uppercase text-xs tracking-wider'>
                    <tr>
                      <th className='py-3 px-4'>Items</th>
                      <th className='py-3 px-4'>Match Score</th>
                      <th className='py-3 px-4'>Status</th>
                      <th className='py-3 px-4'>Created At</th>
                      <th className='py-3 px-4'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-700'>
                    {matches.map((match) => (
                      <tr key={match.id} className='text-gray-200 hover:bg-white/5 transition-colors'>
                        <td className='py-4 px-4'>
                          <div className='flex flex-col gap-1'>
                            <div className='text-amber-400 text-xs uppercase font-bold'>Lost: <span className='text-white normal-case font-medium ml-1'>{match.lostItem?.title}</span></div>
                            <div className='text-teal-400 text-xs uppercase font-bold'>Found: <span className='text-white normal-case font-medium ml-1'>{match.foundItem?.title}</span></div>
                          </div>
                        </td>
                        <td className='py-4 px-4'>
                          <div className='flex items-center gap-2'>
                            <div className='h-2 w-16 bg-slate-700 rounded-full overflow-hidden'>
                              <div className='h-full bg-indigo-500' style={{ width: `${match.matchScore}%` }} />
                            </div>
                            <span className='font-bold text-indigo-400'>{Math.round(match.matchScore)}%</span>
                          </div>
                        </td>
                        <td className='py-4 px-4'>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                            match.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                            match.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                            'bg-rose-500/10 text-rose-500'
                          }`}>
                            {match.status}
                          </span>
                        </td>
                        <td className='py-4 px-4 text-gray-500 text-xs'>{formatDate(match.createdAt)}</td>
                        <td className='py-4 px-4'>
                          <div className='flex gap-2'>
                            <button
                              onClick={() => updateMatchStatus(match.id, 'confirmed')}
                              disabled={actionLoading || match.status === 'confirmed'}
                              className='px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/30 transition-colors disabled:opacity-30'
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => updateMatchStatus(match.id, 'rejected')}
                              disabled={actionLoading || match.status === 'rejected'}
                              className='px-2 py-1 rounded bg-rose-500/20 text-rose-300 text-xs hover:bg-rose-500/30 transition-colors disabled:opacity-30'
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className='mt-6 flex items-center justify-between text-sm text-gray-400'>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className='px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30'
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className='px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30'
              >
                Next
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default AdminMatchManagementPage
