import { useEffect, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

function formatDate(value) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusTone(status) {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'confirmed') return 'bg-emerald-100 text-emerald-700'
  if (normalized === 'rejected') return 'bg-red-100 text-red-700'
  return 'bg-amber-100 text-amber-700'
}

function scoreTone(score) {
  if (score >= 80) return 'bg-emerald-500 text-white'
  if (score >= 50) return 'bg-amber-500 text-white'
  return 'bg-slate-500 text-white'
}

function ItemSummary({ item, label, fallbackTone }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${fallbackTone || ''}`}>
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 overflow-hidden rounded-xl bg-white">
          {item?.imageUrl ? (
            <img src={item.imageUrl} alt={item.title || label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl text-slate-400">📷</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <h3 className="mt-1 truncate text-sm font-bold text-slate-900">{item?.title || 'Untitled item'}</h3>
          <p className="mt-1 text-xs text-slate-500">{item?.category || 'Uncategorized'}</p>
        </div>
      </div>
    </div>
  )
}

function MatchCard({ match, onViewMatch }) {
  const scoreClass = scoreTone(match.matchScore || 0)
  const statusClass = statusTone(match.status)

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <ItemSummary item={match.lostItem} label="Lost Item" />

        <div className="flex flex-col items-center justify-center gap-3">
          <span className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ${scoreClass}`}>
            {Math.round(match.matchScore || 0)}% Match
          </span>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
            {(match.status || 'pending').charAt(0).toUpperCase() + (match.status || 'pending').slice(1)}
          </span>
        </div>

        <ItemSummary item={match.foundItem} label="Found Item" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(match.matchReasons || []).map((reason) => (
          <span key={reason} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {reason}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Created {formatDate(match.createdAt)}</p>
        <button
          type="button"
          onClick={() => onViewMatch(match._id)}
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          View Details
        </button>
      </div>
    </article>
  )
}

function MatchesPage({
  authUser,
  onHome,
  onBrowse,
  onMatches,
  onReportItem,
  onAvatarClick,
  unreadNotifications,
  pendingMatchCount,
  onNotificationClick,
  matchId = null,
  onViewMatch,
  onBack,
  onStartVerification,
  onMatchesUpdated,
}) {
  const [matches, setMatches] = useState([])
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setStatusMessage('')

        const token = localStorage.getItem('accessToken')
        if (!token) {
          setError('Please sign in to view your matches.')
          return
        }

        const endpoint = matchId ? `/api/matches/${matchId}` : '/api/matches'
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.message || 'Failed to fetch matches.')
        }

        const data = await response.json()
        if (matchId) {
          setMatch(data.match || null)
        } else {
          setMatches(data.matches || [])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [matchId])

  const refreshAfterUpdate = async (nextMatch) => {
    if (matchId) {
      setMatch(nextMatch)
      setStatusMessage(`Match ${nextMatch.status} successfully.`)
    } else {
      setMatches((current) => current.map((item) => (item._id === nextMatch._id ? nextMatch : item)))
    }

    if (typeof onMatchesUpdated === 'function') {
      onMatchesUpdated()
    }
  }

  const handleUpdateStatus = async (nextStatus) => {
    try {
      setActionLoading(true)
      setStatusMessage('')

      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/matches/${matchId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to update match.')
      }

      const data = await response.json()
      await refreshAfterUpdate(data.match)
      setStatusMessage(data.message || `Match ${nextStatus} successfully.`)
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartVerification = () => {
    if (!match) return

    let targetReportId = null

    if (match.lostItemOwnedByCurrentUser && !match.foundItemOwnedByCurrentUser) {
      targetReportId = match.foundItem?._id
    } else if (match.foundItemOwnedByCurrentUser && !match.lostItemOwnedByCurrentUser) {
      targetReportId = match.lostItem?._id
    } else if (!match.lostItemOwnedByCurrentUser && !match.foundItemOwnedByCurrentUser) {
      targetReportId = match.foundItem?._id || match.lostItem?._id
    }

    if (!targetReportId) {
      setStatusMessage('Error: Unable to determine which item to verify for this match.')
      return
    }

    if (typeof onStartVerification === 'function') {
      onStartVerification(targetReportId)
      return
    }

    setStatusMessage('Error: Verification route is not available right now.')
  }

  const renderContacts = (item, title) => {
    if (match?.status !== 'confirmed') return null

    return (
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{title} Contact</p>
        <div className="mt-3 space-y-2 text-slate-700">
          <p><span className="font-semibold">Name:</span> {item?.contactName || 'N/A'}</p>
          <p><span className="font-semibold">Email:</span> {item?.contactEmail || 'N/A'}</p>
          <p><span className="font-semibold">Phone:</span> {item?.contactPhone || 'N/A'}</p>
        </div>
      </div>
    )
  }

  const detailItemCard = (item, label, muted = false) => (
    <article className={`rounded-3xl border p-5 ${muted ? 'border-slate-200 bg-slate-100 opacity-70 grayscale' : 'border-slate-200 bg-white'}`}>
      <div className="overflow-hidden rounded-2xl bg-slate-100 aspect-video mb-4">
        {item?.imageUrl ? (
          <img src={item.imageUrl} alt={item.title || label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl text-slate-300">📷</div>
        )}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <h3 className="mt-2 text-2xl font-bold text-slate-900">{item?.title || 'Untitled item'}</h3>
      <p className="mt-1 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        {item?.category || 'Uncategorized'}
      </p>
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p><span className="font-semibold text-slate-700">Location:</span> {item?.lastSeenLocation || 'Unknown'}</p>
        <p><span className="font-semibold text-slate-700">Date:</span> {formatDate(item?.date)}</p>
      </div>
      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{item?.description || 'No description provided.'}</p>
      {renderContacts(item, label)}
    </article>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sora">
      <Navbar
        authUser={authUser}
        activePage="matches"
        onHome={onHome}
        onBrowse={onBrowse}
        onMatches={onMatches || onHome}
        onLogin={onHome}
        onSignup={onHome}
        onAvatarClick={onAvatarClick}
        onReportItem={onReportItem}
        unreadNotifications={unreadNotifications}
        pendingMatchCount={pendingMatchCount}
        onNotificationClick={onNotificationClick}
      />

      <main className="pt-28 pb-16 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Matches</h1>
              <p className="mt-2 text-slate-600">Potential matches detected from your lost and found reports.</p>
            </div>
            {!matchId && (
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                {matches.length} Matches
              </span>
            )}
          </div>

          {loading && (
            <div className="space-y-4">
              <div className="h-36 animate-pulse rounded-3xl bg-slate-200" />
              <div className="h-36 animate-pulse rounded-3xl bg-slate-200" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && !matchId && matches.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-lg font-semibold text-slate-900">No potential matches yet.</p>
              <p className="mt-2 text-sm text-slate-500">New matches will appear here automatically.</p>
            </div>
          )}

          {!loading && !error && !matchId && matches.length > 0 && (
            <div className="space-y-4">
              {matches.map((item) => (
                <MatchCard key={item._id} match={item} onViewMatch={onViewMatch || (() => {})} />
              ))}
            </div>
          )}

          {!loading && !error && matchId && match && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium"
              >
                ← Back to Matches
              </button>

              <div className="grid gap-6 lg:grid-cols-2">
                {detailItemCard(match.lostItem, 'Lost Item', match.status === 'rejected')}
                {detailItemCard(match.foundItem, 'Found Item', match.status === 'rejected')}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-4 py-2 text-sm font-semibold ${scoreTone(match.matchScore || 0)}`}>
                    {Math.round(match.matchScore || 0)}% Match
                  </span>
                  <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusTone(match.status)}`}>
                    {(match.status || 'pending').charAt(0).toUpperCase() + (match.status || 'pending').slice(1)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(match.matchReasons || []).map((reason) => (
                    <span key={reason} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {reason}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-sm text-slate-500">Created {formatDate(match.createdAt)}</p>

                {statusMessage && (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    {statusMessage}
                  </div>
                )}

                {match.status === 'pending' && (
                  <div className="mt-5 space-y-3">
                    <p className="text-sm text-slate-600">
                      Complete the same lost/found claim verification flow to proceed with this potential match.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleStartVerification}
                        className="rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
                      >
                        Start Verification Flow
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus('rejected')}
                        className="rounded-full border border-red-300 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {actionLoading ? 'Updating...' : 'Reject Match'}
                      </button>
                    </div>
                  </div>
                )}

                {match.status !== 'pending' && (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    {match.status === 'confirmed'
                      ? 'This match was confirmed. Contact details are now visible above.'
                      : 'This match was rejected. The item cards are shown in a muted state.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default MatchesPage