import { useEffect, useMemo, useState } from 'react'

const navigationItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'user-management', label: 'User Management' },
  { id: 'reports', label: 'Reports' },
  { id: 'matches', label: 'Matches' },
  { id: 'claims', label: 'Claims' },
  { id: 'fraud', label: 'Fraud' },
  { id: 'audit', label: 'Audit Logs' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'settings', label: 'Settings' },
]

const roles = ['student', 'moderator', 'fraud_investigator', 'admin', 'super_admin']
const statuses = ['active', 'suspended', 'deleted']

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

function UserManagementPage({ onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userHistory, setUserHistory] = useState(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)
    if (statusFilter) params.set('accountStatus', statusFilter)
    params.set('page', String(page))
    params.set('limit', '15')
    return params.toString()
  }, [search, roleFilter, statusFilter, page])

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/users?${queryString}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        setError('Unable to load users right now.')
        return
      }

      const data = await response.json()
      setUsers(Array.isArray(data.items) ? data.items : [])
      setTotalPages(data.totalPages || 1)
    } catch {
      setError('Unable to load users right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [queryString])

  const fetchUserDetail = async (userId) => {
    setDetailLoading(true)
    setUserHistory(null)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        setDetailLoading(false)
        return
      }

      const data = await response.json()
      setSelectedUser(data.user)
      setUserHistory(data)
    } catch {
      setUserHistory(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const updateUserStatus = async (userId, accountStatus) => {
    const reason = window.prompt('Optional reason for this action:') || ''
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ accountStatus, reason }),
      })

      if (!response.ok) {
        return
      }

      const data = await response.json()
      setUsers((prev) => prev.map((user) => (user.id === data.user?.id ? data.user : user)))
      if (selectedUser?.id === data.user?.id) {
        setSelectedUser(data.user)
      }
    } catch {
      // no-op
    }
  }

  const deleteUser = async (userId) => {
    const confirmed = window.confirm('Delete this user? This will revoke access immediately.')
    if (!confirmed) return

    const reason = window.prompt('Optional reason for deletion:') || ''
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        return
      }

      await loadUsers()
    } catch {
      // no-op
    }
  }

  const updateUserRole = async (userId, role) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        return
      }

      const data = await response.json()
      setUsers((prev) => prev.map((user) => (user.id === data.user?.id ? data.user : user)))
      if (selectedUser?.id === data.user?.id) {
        setSelectedUser(data.user)
      }
    } catch {
      // no-op
    }
  }

  return (
    <div className='min-h-screen bg-gray-900 text-gray-100'>
      <div className='flex'>
        <aside className='w-64 bg-slate-950 p-6 hidden md:block'>
          <div className='flex items-center justify-between'>
            <div className='text-lg font-bold'>CampusTrace</div>
          </div>
          <nav className='mt-8 space-y-1'>
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => (item.id === 'overview' ? onBack?.() : null)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md ${item.id === 'user-management' ? 'bg-indigo-600/30 text-white' : 'text-gray-300 hover:bg-slate-800/40'}`}
              >
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
              <h1 className='text-2xl font-bold'>User Management</h1>
              <p className='text-sm text-gray-400'>Search, review, and manage user access</p>
            </div>
            <button onClick={onBack} className='px-3 py-2 bg-slate-800 rounded text-gray-100'>
              Back to Dashboard
            </button>
          </div>

          <div className='grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6'>
            <section className='bg-slate-800 rounded-lg p-4'>
              <div className='flex flex-col lg:flex-row lg:items-center gap-3 mb-4'>
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(1)
                  }}
                  placeholder='Search by name, email, phone, or student ID'
                  className='flex-1 px-3 py-2 rounded bg-slate-900/60 border border-slate-700 text-sm'
                />
                <select
                  value={roleFilter}
                  onChange={(event) => {
                    setRoleFilter(event.target.value)
                    setPage(1)
                  }}
                  className='px-3 py-2 rounded bg-slate-900/60 border border-slate-700 text-sm'
                >
                  <option value=''>All roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value)
                    setPage(1)
                  }}
                  className='px-3 py-2 rounded bg-slate-900/60 border border-slate-700 text-sm'
                >
                  <option value=''>All statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {error ? (
                <div className='rounded-lg bg-red-700/20 border border-red-600 p-3 mb-4 text-sm text-red-100'>
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className='grid place-items-center rounded-lg border border-white/10 bg-slate-900/60 py-12'>
                  <div className='text-sm text-gray-400'>Loading users...</div>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead className='text-left text-gray-400'>
                      <tr>
                        <th className='py-2'>User</th>
                        <th className='py-2'>Role</th>
                        <th className='py-2'>Status</th>
                        <th className='py-2'>Activity</th>
                        <th className='py-2'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-700'>
                      {users.map((user) => (
                        <tr key={user.id} className='text-gray-200'>
                          <td className='py-3'>
                            <div className='font-medium'>{user.name || 'Unnamed user'}</div>
                            <div className='text-xs text-gray-400'>{user.email}</div>
                            <div className='text-xs text-gray-500'>Student ID: {user.studentId || '—'}</div>
                          </td>
                          <td className='py-3'>
                            <select
                              value={user.role}
                              onChange={(event) => updateUserRole(user.id, event.target.value)}
                              className='px-2 py-1 rounded bg-slate-900/60 border border-slate-700 text-xs'
                            >
                              {roles.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </td>
                          <td className='py-3'>
                            <div className='text-xs uppercase tracking-wide'>{user.accountStatus || 'active'}</div>
                            <div className='text-xs text-gray-500'>Last login: {formatDate(user.lastLoginAt)}</div>
                          </td>
                          <td className='py-3'>
                            <div className='text-xs text-gray-400'>Reports: {user.reportCount ?? 0}</div>
                            <div className='text-xs text-gray-400'>Matches: {user.matchCount ?? 0}</div>
                            <div className='text-xs text-gray-400'>Fraud: {user.fraudCount ?? 0}</div>
                          </td>
                          <td className='py-3'>
                            <div className='flex flex-col gap-2 text-xs'>
                              <button
                                onClick={() => fetchUserDetail(user.id)}
                                className='px-2 py-1 rounded bg-indigo-600/30 text-white'
                              >
                                View profile
                              </button>
                              <div className='flex flex-wrap gap-2'>
                                <button
                                  onClick={() => updateUserStatus(user.id, 'suspended')}
                                  className='px-2 py-1 rounded bg-amber-500/20 text-amber-200'
                                >
                                  Suspend
                                </button>
                                <button
                                  onClick={() => updateUserStatus(user.id, 'active')}
                                  className='px-2 py-1 rounded bg-emerald-500/20 text-emerald-200'
                                >
                                  Reactivate
                                </button>
                                <button
                                  onClick={() => deleteUser(user.id)}
                                  className='px-2 py-1 rounded bg-rose-500/20 text-rose-200'
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className='flex items-center justify-between mt-4 text-sm text-gray-400'>
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className='px-2 py-1 rounded bg-slate-900/60 border border-slate-700'
                  disabled={page <= 1}
                >
                  Previous
                </button>
                <div>Page {page} of {totalPages}</div>
                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className='px-2 py-1 rounded bg-slate-900/60 border border-slate-700'
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </section>

            <aside className='bg-slate-800 rounded-lg p-4'>
              <div className='text-sm text-gray-300 mb-3'>User profile & history</div>
              {detailLoading ? (
                <div className='text-sm text-gray-400'>Loading profile...</div>
              ) : selectedUser ? (
                <div className='space-y-4'>
                  <div className='rounded-lg bg-slate-900/60 p-3 text-sm'>
                    <div className='font-semibold'>{selectedUser.name || 'Unnamed user'}</div>
                    <div className='text-xs text-gray-400'>{selectedUser.email}</div>
                    <div className='text-xs text-gray-500'>Role: {selectedUser.role}</div>
                    <div className='text-xs text-gray-500'>Status: {selectedUser.accountStatus}</div>
                    <div className='text-xs text-gray-500'>Student ID: {selectedUser.studentId || '—'}</div>
                    <div className='text-xs text-gray-500'>Last login: {formatDate(selectedUser.lastLoginAt)}</div>
                  </div>

                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    <div className='rounded bg-slate-900/60 p-2'>Reports: {userHistory?.counts?.reportCount ?? 0}</div>
                    <div className='rounded bg-slate-900/60 p-2'>Claims: {userHistory?.counts?.claimCount ?? 0}</div>
                    <div className='rounded bg-slate-900/60 p-2'>Matches: {userHistory?.counts?.matchCount ?? 0}</div>
                    <div className='rounded bg-slate-900/60 p-2'>Fraud: {userHistory?.counts?.fraudCount ?? 0}</div>
                  </div>

                  <div>
                    <div className='text-xs uppercase tracking-wide text-gray-400 mb-2'>Recent reports</div>
                    <div className='space-y-2 text-xs'>
                      {(userHistory?.history?.reports || []).map((report) => (
                        <div key={report.id} className='rounded bg-slate-900/60 p-2'>
                          {report.title} • {report.status}
                        </div>
                      ))}
                      {(!userHistory?.history?.reports || userHistory.history.reports.length === 0) ? (
                        <div className='text-gray-500'>No reports found.</div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <div className='text-xs uppercase tracking-wide text-gray-400 mb-2'>Recent matches</div>
                    <div className='space-y-2 text-xs'>
                      {(userHistory?.history?.matches || []).map((match) => (
                        <div key={match.id} className='rounded bg-slate-900/60 p-2'>
                          {match.lostItem?.title || 'Lost item'} ↔ {match.foundItem?.title || 'Found item'} • {match.status}
                        </div>
                      ))}
                      {(!userHistory?.history?.matches || userHistory.history.matches.length === 0) ? (
                        <div className='text-gray-500'>No matches found.</div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <div className='text-xs uppercase tracking-wide text-gray-400 mb-2'>Recent fraud reports</div>
                    <div className='space-y-2 text-xs'>
                      {(userHistory?.history?.fraudReports || []).map((fraud) => (
                        <div key={fraud.id} className='rounded bg-slate-900/60 p-2'>
                          {fraud.category} • {fraud.status}
                        </div>
                      ))}
                      {(!userHistory?.history?.fraudReports || userHistory.history.fraudReports.length === 0) ? (
                        <div className='text-gray-500'>No fraud reports found.</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className='text-sm text-gray-400'>Select a user to view profile details.</div>
              )}
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

export default UserManagementPage
