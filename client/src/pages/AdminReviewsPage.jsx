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

function StarRating({ rating }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={`text-lg ${i <= rating ? 'text-amber-400' : 'text-gray-600'}`}>
        ★
      </span>
    )
  }
  return <div className='flex gap-0.5'>{stars}</div>
}

function AdminReviewsPage({
  onBack,
  onSignOut,
  onOpenUserManagement,
  onOpenReportManagement,
  onOpenMatchManagement,
  onOpenClaimManagement,
}) {
  const [activeTab, setActiveTab] = useState('all') // 'all', 'moderate', 'remove', 'analytics'
  const [reviews, setReviews] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadReviews = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '10')
      if (search) params.set('search', search)
      if (ratingFilter) params.set('rating', ratingFilter)
      if (typeFilter) params.set('reviewType', typeFilter)
      
      // In moderation tab, we show flagged reviews first
      if (activeTab === 'moderate') {
        params.set('flagged', 'true')
      }

      const response = await fetch(`/api/admin/reviews?${params.toString()}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        setError('Failed to load reviews.')
        return
      }

      const data = await response.json()
      setReviews(data.items || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error(err)
      setError('An error occurred while loading reviews.')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/reviews/analytics', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [page, search, ratingFilter, typeFilter, activeTab])

  useEffect(() => {
    loadAnalytics()
  }, [activeTab])

  const handleModerate = async (claimId, reviewType, flagged, moderated) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/reviews/${claimId}/${reviewType}/moderate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ flagged, moderated }),
      })

      if (response.ok) {
        showToast('success', 'Review moderation status updated.')
        loadReviews()
        loadAnalytics()
      } else {
        showToast('error', 'Failed to update moderation status.')
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'An error occurred.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveComment = async (claimId, reviewType) => {
    const confirmed = window.confirm('Are you sure you want to remove the comment content of this review? The rating score will be preserved, but the comment text will be deleted.')
    if (!confirmed) return

    setActionLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/reviews/${claimId}/${reviewType}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (response.ok) {
        showToast('success', 'Inappropriate review comment removed successfully.')
        loadReviews()
        loadAnalytics()
      } else {
        showToast('error', 'Failed to remove review comment.')
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'An error occurred.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSidebarNavigation = (itemId) => {
    if (itemId === 'overview') onBack?.()
    else if (itemId === 'user-management') onOpenUserManagement?.()
    else if (itemId === 'reports') onOpenReportManagement?.()
    else if (itemId === 'matches') onOpenMatchManagement?.()
    else if (itemId === 'claims') onOpenClaimManagement?.()
    else if (itemId === 'reviews') { /* already here */ }
  }

  // Calculate rating bars
  const totalDistribution = analytics?.ratingDistribution 
    ? Object.values(analytics.ratingDistribution).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div className='min-h-screen bg-gray-900 text-gray-100'>
      <div className='flex'>
        <AdminSidebar
          activeItemId='reviews'
          onNavigate={handleSidebarNavigation}
          onSignOut={onSignOut}
        />

        <main className='flex-1 p-6'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6'>
            <div>
              <h1 className='text-2xl font-bold'>Reviews & Feedback</h1>
              <p className='text-sm text-gray-400'>Monitor customer experiences, moderate inappropriate text, and view feedback analytics</p>
            </div>
            <button onClick={onBack} className='px-3 py-2 bg-slate-800 rounded text-gray-100 hover:bg-slate-700 transition-colors'>
              Back to Dashboard
            </button>
          </div>

          {toast && (
            <div className='fixed top-6 right-6 z-50 animate-in slide-in-from-right-10 duration-300'>
              <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl ${
                toast.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' : 'border-rose-500/20 bg-rose-500/10 text-rose-100'
              }`}>
                <div className='text-sm font-bold'>{toast.type === 'success' ? 'Success' : 'Error'}</div>
                <div className='text-xs opacity-80'>{toast.message}</div>
              </div>
            </div>
          )}

          {/* Sub Navigation Tabs */}
          <div className='flex border-b border-slate-700 mb-6'>
            <button
              onClick={() => { setActiveTab('all'); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all' ? 'border-indigo-500 text-white bg-indigo-600/5' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              View Reviews
            </button>
            <button
              onClick={() => { setActiveTab('moderate'); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'moderate' ? 'border-indigo-500 text-white bg-indigo-600/5' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Moderate Flagged
            </button>
            <button
              onClick={() => { setActiveTab('remove'); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'remove' ? 'border-indigo-500 text-white bg-indigo-600/5' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Remove Inappropriate
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'analytics' ? 'border-indigo-500 text-white bg-indigo-600/5' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Feedback Analytics
            </button>
          </div>

          {activeTab !== 'analytics' ? (
            <>
              {/* Filters Panel */}
              <div className='bg-slate-800 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div className='md:col-span-2'>
                  <label className='block text-xs text-gray-400 mb-1'>Search Reviews</label>
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder='Search comments, reviewer name or item...'
                    className='w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm focus:border-indigo-500 focus:outline-none'
                  />
                </div>
                <div>
                  <label className='block text-xs text-gray-400 mb-1'>Rating Filter</label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
                    className='w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm focus:border-indigo-500 focus:outline-none text-gray-300'
                  >
                    <option value=''>All Ratings</option>
                    <option value='5'>5 Stars</option>
                    <option value='4'>4 Stars</option>
                    <option value='3'>3 Stars</option>
                    <option value='2'>2 Stars</option>
                    <option value='1'>1 Star</option>
                  </select>
                </div>
                <div>
                  <label className='block text-xs text-gray-400 mb-1'>Reviewer Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                    className='w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm focus:border-indigo-500 focus:outline-none text-gray-300'
                  >
                    <option value=''>All Reviewers</option>
                    <option value='claimer'>Claimers (Lost Owners)</option>
                    <option value='reporter'>Reporters (Founders)</option>
                  </select>
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className='p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm'>
                  {error}
                </div>
              )}

              {/* Reviews List */}
              {loading ? (
                <div className='grid place-items-center py-12 bg-slate-800 rounded-lg'>
                  <div className='text-gray-400 text-sm'>Loading reviews...</div>
                </div>
              ) : reviews.length === 0 ? (
                <div className='grid place-items-center py-12 bg-slate-800 rounded-lg text-gray-400 text-sm'>
                  {activeTab === 'moderate'
                    ? 'No flagged reviews found.'
                    : 'No reviews found matching your search criteria.'}
                </div>
              ) : (
                <div className='space-y-4'>
                  {reviews.map((review) => {
                    const reviewKey = `${review.claimId}-${review.reviewType}`
                    return (
                      <div
                        key={reviewKey}
                        className={`bg-slate-800 rounded-lg p-5 border transition-all ${
                          review.flagged
                            ? 'border-rose-500/40 bg-rose-950/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3'>
                          <div>
                            <div className='flex items-center gap-2 flex-wrap'>
                              <StarRating rating={review.rating} />
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                review.reviewType === 'claimer' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-teal-500/20 text-teal-300'
                              }`}>
                                {review.reviewType === 'claimer' ? 'Claimer' : 'Reporter'}
                              </span>
                              {review.flagged && (
                                <span className='px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30'>
                                  Flagged
                                </span>
                              )}
                              {review.moderated && (
                                <span className='px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-700 text-gray-300'>
                                  Moderated
                                </span>
                              )}
                            </div>
                            <div className='text-xs text-gray-400 mt-1'>
                              By <span className='font-semibold text-gray-200'>{review.reviewer?.name}</span> ({review.reviewer?.email}) • {formatDate(review.createdAt)}
                            </div>
                          </div>
                          <div className='text-xs text-right max-w-xs md:self-start'>
                            <div className='text-gray-400'>Associated Report:</div>
                            <div className='font-semibold text-gray-200 truncate'>{review.report?.title}</div>
                            <div className='text-slate-500 capitalize'>{review.report?.itemType} • {review.report?.category}</div>
                          </div>
                        </div>

                        {/* Comment text */}
                        <div className='bg-slate-900/40 rounded p-3 text-sm text-gray-200 italic mb-4 min-h-[44px] flex items-center border border-slate-700/30'>
                          {review.comment ? (
                            `"${review.comment}"`
                          ) : (
                            <span className='text-slate-500 font-medium not-italic'>[Review comment content removed by administrator]</span>
                          )}
                        </div>

                        {/* Actions Panel */}
                        <div className='flex flex-wrap items-center justify-end gap-2 border-t border-slate-700/50 pt-3 text-xs'>
                          {activeTab === 'moderate' || activeTab === 'all' ? (
                            <>
                              {review.flagged ? (
                                <button
                                  onClick={() => handleModerate(review.claimId, review.reviewType, false, true)}
                                  disabled={actionLoading}
                                  className='px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 font-semibold'
                                >
                                  Unflag & Approve
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleModerate(review.claimId, review.reviewType, true, false)}
                                  disabled={actionLoading}
                                  className='px-3 py-1.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors disabled:opacity-50'
                                >
                                  Flag Review
                                </button>
                              )}
                              {!review.moderated && (
                                <button
                                  onClick={() => handleModerate(review.claimId, review.reviewType, review.flagged, true)}
                                  disabled={actionLoading}
                                  className='px-3 py-1.5 rounded bg-slate-700 text-gray-200 hover:bg-slate-600 transition-colors disabled:opacity-50'
                                >
                                  Mark Moderated
                                </button>
                              )}
                            </>
                          ) : null}

                          {(activeTab === 'remove' || activeTab === 'all' || review.flagged) && review.comment ? (
                            <button
                              onClick={() => handleRemoveComment(review.claimId, review.reviewType)}
                              disabled={actionLoading}
                              className='px-3 py-1.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors disabled:opacity-50 font-semibold'
                            >
                              Remove Comment Content
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}

                  {/* Pagination footer */}
                  <div className='flex items-center justify-between mt-6 text-sm text-gray-400 bg-slate-800 p-4 rounded-lg'>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className='px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 transition-colors'
                    >
                      Previous
                    </button>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className='px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 transition-colors'
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Analytics Tab */
            <div className='space-y-6'>
              {analyticsLoading ? (
                <div className='grid place-items-center py-12 bg-slate-800 rounded-lg'>
                  <div className='text-gray-400 text-sm'>Computing feedback analytics...</div>
                </div>
              ) : analytics ? (
                <>
                  {/* Aggregates Dashboard */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div className='bg-slate-800 rounded-lg p-5 border border-slate-700/50 shadow-md'>
                      <div className='text-sm text-gray-400'>Total Reviews</div>
                      <div className='mt-2 text-3xl font-extrabold text-white'>{analytics.totalReviews}</div>
                      <div className='text-[11px] text-gray-500 mt-1'>Completed claims reviews</div>
                    </div>
                    <div className='bg-slate-800 rounded-lg p-5 border border-slate-700/50 shadow-md'>
                      <div className='text-sm text-gray-400'>Average Rating</div>
                      <div className='mt-1 flex items-baseline gap-2'>
                        <span className='text-3xl font-extrabold text-white'>{analytics.averageRating}</span>
                        <span className='text-yellow-500 font-bold text-lg'>★</span>
                        <span className='text-xs text-gray-400'>/ 5.0</span>
                      </div>
                      <div className='text-[11px] text-gray-500 mt-1'>Overall campus satisfaction</div>
                    </div>
                    <div className='bg-slate-800 rounded-lg p-5 border border-slate-700/50 shadow-md'>
                      <div className='text-sm text-gray-400'>Claimer Average</div>
                      <div className='mt-1 flex items-baseline gap-2'>
                        <span className='text-3xl font-extrabold text-indigo-400'>{analytics.claimerAverage}</span>
                        <span className='text-indigo-400 text-lg'>★</span>
                        <span className='text-xs text-gray-400'>({analytics.totalReviews - (analytics.flaggedCount + analytics.moderatedCount) >= 0 ? 'Verified claims' : ''})</span>
                      </div>
                      <div className='text-[11px] text-gray-500 mt-1'>Average rating given by claimants</div>
                    </div>
                    <div className='bg-slate-800 rounded-lg p-5 border border-slate-700/50 shadow-md'>
                      <div className='text-sm text-gray-400'>Reporter Average</div>
                      <div className='mt-1 flex items-baseline gap-2'>
                        <span className='text-3xl font-extrabold text-teal-400'>{analytics.reporterAverage}</span>
                        <span className='text-teal-400 text-lg'>★</span>
                      </div>
                      <div className='text-[11px] text-gray-500 mt-1'>Average rating given by founders</div>
                    </div>
                  </div>

                  {/* Flagged / Moderated Metrics */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='bg-slate-800 rounded-lg p-5 border border-slate-700/50 shadow-md flex items-center justify-between'>
                      <div>
                        <div className='text-sm text-gray-400'>Flagged Reviews</div>
                        <div className='text-xs text-gray-500 mt-1'>Awaiting moderator review</div>
                      </div>
                      <div className={`text-3xl font-bold px-4 py-1 rounded-lg ${
                        analytics.flaggedCount > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/35' : 'bg-slate-700/30 text-gray-400'
                      }`}>
                        {analytics.flaggedCount}
                      </div>
                    </div>

                    <div className='bg-slate-800 rounded-lg p-5 border border-slate-700/50 shadow-md flex items-center justify-between'>
                      <div>
                        <div className='text-sm text-gray-400'>Moderated Reviews</div>
                        <div className='text-xs text-gray-500 mt-1'>Reviews processed by admins</div>
                      </div>
                      <div className='text-3xl font-bold px-4 py-1 rounded-lg bg-slate-700/30 text-gray-300'>
                        {analytics.moderatedCount}
                      </div>
                    </div>
                  </div>

                  {/* Charts & Distributions */}
                  <div className='bg-slate-800 rounded-lg p-6 border border-slate-700/50 shadow-md'>
                    <h2 className='text-lg font-bold text-white mb-6 border-b border-slate-700 pb-2'>Rating Distribution</h2>
                    
                    <div className='space-y-4'>
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = analytics.ratingDistribution?.[rating] || 0
                        const percentage = totalDistribution > 0 ? Math.round((count / totalDistribution) * 100) : 0
                        
                        return (
                          <div key={rating} className='flex items-center gap-4 text-sm'>
                            <div className='w-14 text-right font-medium text-gray-300 flex items-center justify-end gap-1.5'>
                              <span>{rating}</span>
                              <span className='text-amber-400 text-xs'>★</span>
                            </div>
                            <div className='flex-1 h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800'>
                              <div
                                className='h-full rounded-full bg-amber-400 hover:bg-amber-300 transition-all duration-500'
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className='w-20 text-left text-gray-400 font-semibold'>
                              {count} review{count !== 1 ? 's' : ''} ({percentage}%)
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className='text-sm text-gray-400 text-center py-6'>Unable to load feedback metrics.</div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AdminReviewsPage
