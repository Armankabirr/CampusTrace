import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/layout/AdminSidebar'

const statusOptions = ['pending', 'active', 'matched', 'resolved', 'archived']
const itemTypeOptions = ['lost', 'found']

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

function formatStatusLabel(status) {
  if (!status) return 'Unknown'
  return status.replace(/_/g, ' ')
}

function AdminReportManagementPage({
  onBack,
  onSignOut,
  onOpenUserManagement,
  onOpenMatchManagement,
  onOpenClaimManagement,
  onOpenReviewsManagement,
  onOpenNotificationsManagement,
}) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [itemTypeFilter, setItemTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [editReport, setEditReport] = useState(null)
  const [viewReport, setViewReport] = useState(null)
  const [rejectionModal, setRejectionModal] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [editDraft, setEditDraft] = useState({
    title: '',
    description: '',
    category: '',
    lastSeenLocation: '',
  })

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (itemTypeFilter) params.set('itemType', itemTypeFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (categoryFilter) params.set('category', categoryFilter)
    if (ownerFilter) params.set('ownerId', ownerFilter)
    params.set('page', String(page))
    params.set('limit', '12')
    return params.toString()
  }, [search, itemTypeFilter, statusFilter, categoryFilter, ownerFilter, page])

  const loadReports = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/reports?${queryString}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        setError('Unable to load reports right now.')
        return
      }

      const data = await response.json()
      setReports(Array.isArray(data.items) ? data.items : [])
      setTotalPages(data.totalPages || 1)
      setSelectedIds([])
    } catch {
      setError('Unable to load reports right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [queryString])

  const updateReportStatus = async (reportId, status, reason = '') => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status, reason }),
      })

      return response.ok
    } catch {
      return false
    }
  }

  const updateReport = async (reportId, payload) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      return response.ok
    } catch {
      return false
    }
  }

  const deleteReport = async (reportId) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      return response.ok
    } catch {
      return false
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === reports.length) {
      setSelectedIds([])
      return
    }
    setSelectedIds(reports.map((report) => report.id))
  }

  const toggleSelection = (reportId) => {
    setSelectedIds((prev) => {
      if (prev.includes(reportId)) {
        return prev.filter((id) => id !== reportId)
      }
      return [...prev, reportId]
    })
  }

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return

    if (bulkAction === 'archived') {
      setRejectionModal({ mode: 'bulk' })
      return
    }

    if (bulkAction === 'delete') {
      const confirmed = window.confirm('Delete selected reports? This cannot be undone.')
      if (!confirmed) return
    }

    setActionLoading(true)
    let ok = true

    if (bulkAction === 'delete') {
      const results = await Promise.all(selectedIds.map((id) => deleteReport(id)))
      ok = results.every(Boolean)
    } else {
      const results = await Promise.all(selectedIds.map((id) => updateReportStatus(id, bulkAction)))
      ok = results.every(Boolean)
    }

    setActionLoading(false)
    setBulkAction('')

    if (ok) {
      showToast('success', 'Bulk action completed successfully.')
      loadReports()
    } else {
      showToast('error', 'Unable to complete the bulk action.')
    }
  }

  const openEditPanel = (report) => {
    setEditReport(report)
    setEditDraft({
      title: report.title || '',
      description: report.description || '',
      category: report.category || '',
      lastSeenLocation: report.lastSeenLocation || '',
    })
  }

  const openViewPanel = (report) => {
    setViewReport(report)
  }

  const openRejectionModal = (report) => {
    setRejectionModal({ mode: 'single', report })
    setRejectionReason('')
  }

  const closeEditPanel = () => {
    setEditReport(null)
  }

  const closeViewPanel = () => {
    setViewReport(null)
  }

  const closeRejectionModal = () => {
    setRejectionModal(null)
    setRejectionReason('')
  }

  const confirmRejection = async () => {
    if (!rejectionModal) return

    if (rejectionModal.mode === 'bulk') {
      setActionLoading(true)
      const results = await Promise.all(
        selectedIds.map((id) => updateReportStatus(id, 'archived', rejectionReason))
      )
      const ok = results.every(Boolean)
      setActionLoading(false)
      setBulkAction('')
      closeRejectionModal()

      if (ok) {
        showToast('success', 'Bulk rejection completed successfully.')
        loadReports()
      } else {
        showToast('error', 'Unable to reject selected reports.')
      }
      return
    }

    if (rejectionModal.mode === 'single' && rejectionModal.report) {
      applyQuickStatus(rejectionModal.report.id, 'archived', 'Reject', rejectionReason)
      closeRejectionModal()
    }
  }

  const saveEdit = async () => {
    if (!editReport) return
    setActionLoading(true)
    const ok = await updateReport(editReport.id, editDraft)
    setActionLoading(false)

    if (ok) {
      showToast('success', 'Report updated successfully.')
      closeEditPanel()
      loadReports()
    } else {
      showToast('error', 'Unable to update report right now.')
    }
  }

  const applyQuickStatus = async (reportId, status, label, reason = '') => {
    setActionLoading(true)
    const ok = await updateReportStatus(reportId, status, reason)
    setActionLoading(false)

    if (ok) {
      showToast('success', `${label} action completed.`)
      loadReports()
    } else {
      showToast('error', `Unable to ${label.toLowerCase()} report right now.`)
    }
  }

  const handleDelete = async (reportId) => {
    const confirmed = window.confirm('Delete this report? This cannot be undone.')
    if (!confirmed) return

    setActionLoading(true)
    const ok = await deleteReport(reportId)
    setActionLoading(false)

    if (ok) {
      showToast('success', 'Report deleted successfully.')
      loadReports()
    } else {
      showToast('error', 'Unable to delete report right now.')
    }
  }

  return (
    <div className='min-h-screen bg-gray-900 text-gray-100'>
      <div className='flex'>
        <AdminSidebar
          activeItemId='reports'
          onNavigate={(itemId) => {
            if (itemId === 'overview') onBack?.()
            else if (itemId === 'user-management') onOpenUserManagement?.()
            else if (itemId === 'matches') onOpenMatchManagement?.()
            else if (itemId === 'claims') onOpenClaimManagement?.()
            else if (itemId === 'reviews') onOpenReviewsManagement?.()
            else if (itemId === 'notifications') onOpenNotificationsManagement?.()
          }}
          onSignOut={onSignOut}
        />

        <main className='flex-1 p-6'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6'>
            <div>
              <h1 className='text-2xl font-bold'>Report Management</h1>
              <p className='text-sm text-gray-400'>Search, filter, and manage lost & found reports.</p>
            </div>
            <button onClick={onBack} className='px-3 py-2 bg-slate-800 rounded text-gray-100'>
              Back to Dashboard
            </button>
          </div>

          {toast ? (
            <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${toast.type === 'success' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100' : 'border-rose-500/40 bg-rose-500/10 text-rose-100'}`}>
              {toast.message}
            </div>
          ) : null}

          <section className='bg-slate-800 rounded-lg p-4'>
            <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder='Search by title, description, location, or contact info'
                className='flex-1 px-3 py-2 rounded bg-slate-900/60 border border-slate-700 text-sm'
              />
              <select
                value={itemTypeFilter}
                onChange={(event) => {
                  setItemTypeFilter(event.target.value)
                  setPage(1)
                }}
                className='px-3 py-2 rounded bg-slate-900/60 border border-slate-700 text-sm'
              >
                <option value=''>All types</option>
                {itemTypeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
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
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{formatStatusLabel(status)}</option>
                ))}
              </select>
              <input
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value)
                  setPage(1)
                }}
                placeholder='Category'
                className='px-3 py-2 rounded bg-slate-900/60 border border-slate-700 text-sm'
              />
              <input
                value={ownerFilter}
                onChange={(event) => {
                  setOwnerFilter(event.target.value)
                  setPage(1)
                }}
                placeholder='Owner ID'
                className='px-3 py-2 rounded bg-slate-900/60 border border-slate-700 text-sm'
              />
            </div>

            <div className='mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
              <div className='text-xs text-gray-400'>Advanced filters: status, type, category, and owner.</div>
              <div className='flex flex-wrap gap-2 text-xs'>
                <select
                  value={bulkAction}
                  onChange={(event) => setBulkAction(event.target.value)}
                  className='px-2 py-1 rounded bg-slate-900/60 border border-slate-700'
                >
                  <option value=''>Bulk actions</option>
                  <option value='active'>Approve (set active)</option>
                  <option value='archived'>Reject (archive)</option>
                  <option value='resolved'>Resolve</option>
                  <option value='matched'>Mark matched</option>
                  <option value='delete'>Delete</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  className='px-3 py-1 rounded bg-indigo-600/30 text-white disabled:opacity-50'
                  disabled={!bulkAction || selectedIds.length === 0 || actionLoading}
                >
                  Apply
                </button>
              </div>
            </div>

            {error ? (
              <div className='rounded-lg bg-red-700/20 border border-red-600 p-3 my-4 text-sm text-red-100'>
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className='grid place-items-center rounded-lg border border-white/10 bg-slate-900/60 py-12 my-4'>
                <div className='text-sm text-gray-400'>Loading reports...</div>
              </div>
            ) : (
              <div className='overflow-x-auto mt-4'>
                <table className='w-full text-sm'>
                  <thead className='text-left text-gray-400'>
                    <tr>
                      <th className='py-2'>
                        <input type='checkbox' checked={reports.length > 0 && selectedIds.length === reports.length} onChange={handleSelectAll} />
                      </th>
                      <th className='py-2'>Report</th>
                      <th className='py-2'>Type</th>
                      <th className='py-2'>Status</th>
                      <th className='py-2'>Owner</th>
                      <th className='py-2'>Created</th>
                      <th className='py-2'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-700'>
                    {reports.map((report) => (
                      <tr key={report.id} className='text-gray-200'>
                        <td className='py-3'>
                          <input type='checkbox' checked={selectedIds.includes(report.id)} onChange={() => toggleSelection(report.id)} />
                        </td>
                        <td className='py-3'>
                          <div className='font-medium'>{report.title || 'Untitled report'}</div>
                          <div className='text-xs text-gray-400'>Category: {report.category || '—'}</div>
                          <div className='text-xs text-gray-500'>Location: {report.lastSeenLocation || '—'}</div>
                        </td>
                        <td className='py-3 text-xs uppercase tracking-wide'>{report.itemType || '—'}</td>
                        <td className='py-3'>
                          <span className='text-xs uppercase tracking-wide'>{formatStatusLabel(report.status)}</span>
                        </td>
                        <td className='py-3'>
                          <div className='text-xs text-gray-300'>{report.owner?.name || '—'}</div>
                          <div className='text-xs text-gray-500'>{report.owner?.email || ''}</div>
                        </td>
                        <td className='py-3 text-xs text-gray-400'>{formatDate(report.createdAt)}</td>
                        <td className='py-3'>
                          <div className='flex flex-wrap gap-2 text-xs'>
                            <button
                              onClick={() => openViewPanel(report)}
                              className='px-2 py-1 rounded bg-indigo-600/30 text-white'
                            >
                              View
                            </button>
                            <button
                              onClick={() => openEditPanel(report)}
                              className='px-2 py-1 rounded bg-slate-700/70 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity'
                              disabled={actionLoading || report.status === 'resolved'}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => applyQuickStatus(report.id, 'active', 'Approve')}
                              className='px-2 py-1 rounded bg-emerald-500/20 text-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity'
                              disabled={actionLoading || report.status === 'active' || report.status === 'resolved'}
                            >
                              {report.status === 'active' ? 'Approved' : 'Approve'}
                            </button>
                            <button
                              onClick={() => openRejectionModal(report)}
                              className='px-2 py-1 rounded bg-amber-500/20 text-amber-200 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity'
                              disabled={actionLoading || report.status === 'archived' || report.status === 'resolved'}
                            >
                              {report.status === 'archived' ? 'Rejected' : 'Reject'}
                            </button>
                            <button
                              onClick={() => handleDelete(report.id)}
                              className='px-2 py-1 rounded bg-rose-500/20 text-rose-200 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity'
                              disabled={actionLoading || report.status === 'resolved'}
                            >
                              Delete
                            </button>
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

          {viewReport ? (
            <section className='mt-6 bg-slate-800 rounded-lg p-4'>
              <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4'>
                <div>
                  <div className='text-lg font-semibold'>Report Details</div>
                  <div className='text-xs text-gray-400'>Extended view for admin review.</div>
                </div>
                <button onClick={closeViewPanel} className='px-3 py-2 rounded bg-slate-700/70 text-gray-100'>
                  Close
                </button>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4'>
                <div className='rounded-lg bg-slate-900/60 border border-white/5 overflow-hidden'>
                  {viewReport.imageUrl ? (
                    <img
                      src={viewReport.imageUrl}
                      alt={viewReport.title || 'Report image'}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='h-full min-h-[200px] grid place-items-center text-3xl text-gray-500'>
                      📷
                    </div>
                  )}
                </div>

                <div className='space-y-3 text-sm'>
                  <div>
                    <div className='text-xs text-gray-400'>Title</div>
                    <div className='text-lg font-semibold text-gray-100'>{viewReport.title || 'Untitled report'}</div>
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <div>
                      <div className='text-xs text-gray-400'>Type</div>
                      <div className='text-gray-200 uppercase tracking-wide'>{viewReport.itemType || '—'}</div>
                    </div>
                    <div>
                      <div className='text-xs text-gray-400'>Status</div>
                      <div className='text-gray-200 uppercase tracking-wide'>{formatStatusLabel(viewReport.status)}</div>
                    </div>
                    <div>
                      <div className='text-xs text-gray-400'>Category</div>
                      <div className='text-gray-200'>{viewReport.category || '—'}</div>
                    </div>
                    <div>
                      <div className='text-xs text-gray-400'>Created</div>
                      <div className='text-gray-200'>{formatDate(viewReport.createdAt)}</div>
                    </div>
                    <div className='sm:col-span-2'>
                      <div className='text-xs text-gray-400'>Last seen location</div>
                      <div className='text-gray-200'>{viewReport.lastSeenLocation || '—'}</div>
                    </div>
                    <div className='sm:col-span-2'>
                      <div className='text-xs text-gray-400'>Owner</div>
                      <div className='text-gray-200'>{viewReport.owner?.name || '—'}</div>
                      <div className='text-xs text-gray-500'>{viewReport.owner?.email || ''}</div>
                    </div>
                  </div>
                  <div>
                    <div className='text-xs text-gray-400'>Description</div>
                    <div className='text-gray-200 whitespace-pre-wrap'>{viewReport.description || '—'}</div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {editReport ? (
            <section className='mt-6 bg-slate-800 rounded-lg p-4'>
              <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4'>
                <div>
                  <div className='text-lg font-semibold'>Edit Report</div>
                  <div className='text-xs text-gray-400'>Update title, description, category, or location.</div>
                </div>
                <button onClick={closeEditPanel} className='px-3 py-2 rounded bg-slate-700/70 text-gray-100'>
                  Close
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-xs text-gray-400'>Title</label>
                  <input
                    value={editDraft.title}
                    onChange={(event) => setEditDraft((prev) => ({ ...prev, title: event.target.value }))}
                    className='mt-1 w-full px-3 py-2 rounded bg-slate-900/60 border border-slate-700 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-gray-400'>Category</label>
                  <input
                    value={editDraft.category}
                    onChange={(event) => setEditDraft((prev) => ({ ...prev, category: event.target.value }))}
                    className='mt-1 w-full px-3 py-2 rounded bg-slate-900/60 border border-slate-700 text-sm'
                  />
                </div>
                <div className='md:col-span-2'>
                  <label className='text-xs text-gray-400'>Description</label>
                  <textarea
                    value={editDraft.description}
                    onChange={(event) => setEditDraft((prev) => ({ ...prev, description: event.target.value }))}
                    className='mt-1 w-full px-3 py-2 rounded bg-slate-900/60 border border-slate-700 text-sm min-h-[120px]'
                  />
                </div>
                <div className='md:col-span-2'>
                  <label className='text-xs text-gray-400'>Last seen location</label>
                  <input
                    value={editDraft.lastSeenLocation}
                    onChange={(event) => setEditDraft((prev) => ({ ...prev, lastSeenLocation: event.target.value }))}
                    className='mt-1 w-full px-3 py-2 rounded bg-slate-900/60 border border-slate-700 text-sm'
                  />
                </div>
              </div>

              <div className='mt-4 flex justify-end gap-2'>
                <button
                  onClick={saveEdit}
                  className='px-4 py-2 rounded bg-emerald-500/20 text-emerald-200 disabled:opacity-50'
                  disabled={actionLoading}
                >
                  Save changes
                </button>
              </div>
            </section>
          ) : null}

          {rejectionModal ? (
            <div className='fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4'>
              <div className='w-full max-w-lg rounded-lg bg-slate-900 border border-white/10 p-5'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='text-lg font-semibold'>Rejection reason</div>
                    <div className='text-xs text-gray-400'>This will be sent to the report owner.</div>
                  </div>
                  <button onClick={closeRejectionModal} className='text-sm text-gray-400 hover:text-gray-200'>
                    Close
                  </button>
                </div>

                {rejectionModal.mode === 'single' && rejectionModal.report ? (
                  <div className='mt-3 text-sm text-gray-300'>
                    Report: <span className='font-semibold text-gray-100'>{rejectionModal.report.title || 'Untitled report'}</span>
                  </div>
                ) : (
                  <div className='mt-3 text-sm text-gray-300'>
                    Rejecting {selectedIds.length} selected reports.
                  </div>
                )}

                <div className='mt-4'>
                  <label className='text-xs text-gray-400'>Reason (optional)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    className='mt-1 w-full min-h-[120px] rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-gray-100'
                    placeholder='Add a brief reason for rejection...'
                  />
                </div>

                <div className='mt-4 flex justify-end gap-2'>
                  <button
                    onClick={closeRejectionModal}
                    className='px-3 py-2 rounded bg-slate-800 text-gray-200'
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRejection}
                    className='px-4 py-2 rounded bg-amber-500/20 text-amber-200 disabled:opacity-50'
                    disabled={actionLoading}
                  >
                    Confirm rejection
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}

export default AdminReportManagementPage
