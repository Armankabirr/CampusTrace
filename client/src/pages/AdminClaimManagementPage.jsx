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

function AdminClaimManagementPage({
  onBack,
  onSignOut,
  onOpenUserManagement,
  onOpenReportManagement,
  onOpenMatchManagement,
  onOpenReviewsManagement,
  onOpenNotificationsManagement,
}) {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState(false)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))
    params.set('limit', '12')
    return params.toString()
  }, [statusFilter, page])

  const loadClaims = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/claims?${queryString}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        setError('Unable to load claims right now.')
        return
      }

      const data = await response.json()
      setClaims(Array.isArray(data.items) ? data.items : [])
      setTotalPages(data.totalPages || 1)
    } catch {
      setError('Unable to load claims right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClaims()
  }, [queryString])

  const updateClaimStatus = async (claimId, status) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/claims/${claimId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setToast({ type: 'success', message: `Claim status updated to ${status}.` })
        loadClaims()
      } else {
        setToast({ type: 'error', message: 'Failed to update claim status.' })
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
          activeItemId='claims'
          onNavigate={(itemId) => {
            if (itemId === 'overview') onBack?.()
            else if (itemId === 'user-management') onOpenUserManagement?.()
            else if (itemId === 'reports') onOpenReportManagement?.()
            else if (itemId === 'matches') onOpenMatchManagement?.()
            else if (itemId === 'reviews') onOpenReviewsManagement?.()
            else if (itemId === 'notifications') onOpenNotificationsManagement?.()
          }}
          onSignOut={onSignOut}
        />

        <main className='flex-1 p-6'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-2xl font-bold'>Claim Management</h1>
              <p className='text-sm text-gray-400'>Review and manage report claims from students.</p>
            </div>
            <button onClick={onBack} className='px-3 py-2 bg-slate-800 rounded text-gray-100'>
              Back to Dashboard
            </button>
          </div>

          {toast && (
            <div className='fixed top-6 right-6 z-50 animate-in slide-in-from-right-10 duration-300'>
              <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl ${toast.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' : 'border-rose-500/20 bg-rose-500/10 text-rose-100'
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
                <option value='verified'>Verified</option>
                <option value='rejected'>Rejected</option>
                <option value='completed'>Completed</option>
                <option value='returned'>Returned</option>
              </select>
            </div>

            {loading ? (
              <div className='grid place-items-center py-12'><div className='text-gray-400 text-sm'>Loading claims...</div></div>
            ) : error ? (
              <div className='p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg'>{error}</div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                  <thead className='text-gray-400 uppercase text-xs tracking-wider'>
                    <tr>
                      <th className='py-3 px-4'>Report</th>
                      <th className='py-3 px-4'>Claimer</th>
                      <th className='py-3 px-4'>Status</th>
                      <th className='py-3 px-4'>Created At</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-700'>
                    {claims.map((claim) => (
                      <tr key={claim.id} className='text-gray-200 hover:bg-white/5 transition-colors'>
                        <td className='py-4 px-4'>
                          <div className='font-medium text-white'>{claim.report?.title || 'Untitled'}</div>
                          <div className='text-xs text-gray-400 mt-0.5 capitalize'>{claim.report?.itemType} • {claim.report?.category}</div>
                        </td>
                        <td className='py-4 px-4'>
                          <div className='text-xs font-semibold'>{claim.claimer?.name}</div>
                          <div className='text-[10px] text-gray-500'>{claim.claimer?.email}</div>
                        </td>
                        <td className='py-4 px-4'>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${claim.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                              claim.status === 'verified' || claim.status === 'completed' || claim.status === 'returned' ? 'bg-emerald-500/10 text-emerald-500' :
                                'bg-rose-500/10 text-rose-500'
                            }`}>
                            {claim.status}
                          </span>
                        </td>
                        <td className='py-4 px-4 text-gray-500 text-xs'>{formatDate(claim.createdAt)}</td>
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

export default AdminClaimManagementPage
