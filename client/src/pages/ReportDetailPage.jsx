import { useEffect, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

function ReportDetailPage({ authUser, onHome, onBack, reportId, unreadNotifications, onNotificationClick }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showVerificationView, setShowVerificationView] = useState(false)
  const [claimData, setClaimData] = useState({})
  const [claimPhoto, setClaimPhoto] = useState(null)
  const [submittingClaim, setSubmittingClaim] = useState(false)
  const [claimMessage, setClaimMessage] = useState('')

  useEffect(() => {
    fetchReportDetails()
  }, [reportId])

  const fetchReportDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/get/${reportId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch report details')
      }

      const data = await response.json()
      setReport(data.report)
      setError(null)
      setShowVerificationView(false)

      if (data.report.itemType === 'lost') {
        setClaimData({ secretIdentifier: '', description: '' })
        setClaimPhoto(null)
      } else {
        const answerObj = {}
        const proofQuestions = data.report.verificationDetails?.proofQuestions || []
        proofQuestions.forEach((_, idx) => {
          answerObj[`answer${idx}`] = ''
        })
        setClaimData(answerObj)
        setClaimPhoto(null)
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching report:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimChange = (field, value) => {
    setClaimData((prev) => ({ ...prev, [field]: value }))
  }

  const handleClaimPhotoChange = (event) => {
    const file = event.target.files?.[0] || null
    setClaimPhoto(file)
  }

  const openVerificationView = () => {
    setClaimMessage('')
    setShowVerificationView(true)
  }

  const closeVerificationView = () => {
    setShowVerificationView(false)
  }

  const handleSubmitClaim = async (e) => {
    e.preventDefault()
    setSubmittingClaim(true)
    setClaimMessage('')

    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        throw new Error('Please sign in to verify this item')
      }

      const claimPayload = new FormData()
      claimPayload.append('reportId', reportId)

      if (isLostItem) {
        claimPayload.append('secretIdentifierProvided', claimData.secretIdentifier || '')
      } else {
        const answers = []
        report.verificationDetails.proofQuestions.forEach((_, idx) => {
          answers.push(claimData[`answer${idx}`])
        })
        claimPayload.append('answersProvided', JSON.stringify(answers))
      }

      claimPayload.append('description', claimData.description || '')

      if (claimPhoto) {
        claimPayload.append('photo', claimPhoto)
      }

      const response = await fetch('/api/claims/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: claimPayload,
      })

      const text = await response.text()
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch (err) {
        // Non-JSON response (HTML or empty). Provide a helpful error.
        if (!response.ok) {
          throw new Error(`Server error ${response.status}: ${response.statusText}`)
        }
        throw new Error('Invalid server response')
      }

      if (!response.ok) {
        throw new Error(data.message || `Failed to submit verification (${response.status})`)
      }

      setClaimMessage(data.message || 'Verification submitted successfully.')
      setShowVerificationView(false)
    } catch (error) {
      setClaimMessage(`Error: ${error.message}`)
      console.error('Verification submission error:', error)
    } finally {
      setSubmittingClaim(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Unknown'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar authUser={authUser} activePage="browse" onHome={onHome} />
        <main className="pt-24 pb-12 px-4">
          <div className="mx-auto max-w-4xl">
            <div className="animate-pulse space-y-4">
              <div className="h-96 bg-slate-200 rounded-lg"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar authUser={authUser} activePage="browse" onHome={onHome} />
        <main className="pt-24 pb-12 px-4">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-red-600 font-medium">Error: {error || 'Report not found'}</p>
            <button
              onClick={onBack}
              className="mt-4 px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition"
            >
              Back to Browse
            </button>
          </div>
        </main>
      </div>
    )
  }

  const isLostItem = report.itemType?.toLowerCase() === 'lost'
  const proofQuestions = report.verificationDetails?.proofQuestions || []

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sora">
      <Navbar 
        authUser={authUser} 
        activePage="browse" 
        onHome={onHome}
        unreadNotifications={unreadNotifications}
        onNotificationClick={onNotificationClick}
      />

      <main className="pt-24 pb-12 px-4">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium mb-6"
          >
            ← Back to Browse
          </button>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="bg-slate-100 rounded-lg overflow-hidden mb-6 aspect-video flex items-center justify-center">
                {report.imageUrl ? (
                  <img
                    src={report.imageUrl}
                    alt={report.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl">📷</span>
                )}
              </div>

              <div className="flex gap-2 mb-6">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-bold text-white ${
                    isLostItem ? 'bg-red-500' : 'bg-green-500'
                  }`}
                >
                  {report.itemType?.toUpperCase() || 'UNKNOWN'}
                </span>
                <span className="inline-block px-4 py-2 rounded-full text-sm font-bold text-slate-700 bg-slate-100">
                  {report.category || 'Uncategorized'}
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-4">{report.title}</h1>

              <div className="bg-white rounded-lg p-6 mb-6">
                <h2 className="font-bold text-lg mb-2">Description</h2>
                <p className="text-slate-600 leading-relaxed">{report.description}</p>
              </div>

              {/* Show verification questions on the page for found items (debug / UX) */}
              {!isLostItem && proofQuestions.length > 0 && (
                <div className="bg-white rounded-lg p-6 mb-6">
                  <h2 className="font-bold text-lg mb-2">Verification Questions</h2>
                  <ol className="list-decimal list-inside text-slate-700 space-y-2">
                    {proofQuestions.map((q, i) => (
                      <li key={i}>{q.question}</li>
                    ))}
                  </ol>
                  <p className="mt-2 text-sm text-slate-500">Click the button to answer these questions and claim this item.</p>
                </div>
              )}

              <div className="bg-white rounded-lg p-6 mb-6 space-y-3">
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">Last Seen / Found Location</p>
                  <p className="text-slate-900 font-medium">{report.lastSeenLocation || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">Date</p>
                  <p className="text-slate-900 font-medium">{formatDate(report.date)}</p>
                </div>
              </div>

              {claimMessage && (
                <div
                  className={`rounded-lg p-4 mb-6 ${
                    claimMessage.includes('Error')
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-green-50 border border-green-200 text-green-700'
                  }`}
                >
                  {claimMessage}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 mb-6">
                <h3 className="font-bold text-lg mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium">Name</p>
                    <p className="text-slate-900">{report.contactName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium">Email</p>
                    <p className="text-slate-900 break-all">{report.contactEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium">Phone</p>
                    <p className="text-slate-900">{report.contactPhone}</p>
                  </div>
                </div>
              </div>

              {!showVerificationView && (
                <button
                  onClick={openVerificationView}
                  className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold transition"
                >
                  {isLostItem ? 'I have found' : 'It is mine'}
                </button>
              )}

              {showVerificationView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                  <button
                    type="button"
                    aria-label="Close verification overlay"
                    onClick={closeVerificationView}
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                  />

                  <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
                    <div className="border-b border-slate-100 px-6 py-5 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Verification</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {isLostItem
                            ? 'Enter the secret identifier to continue.'
                            : 'Answer the questions to continue.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeVerificationView}
                        className="rounded-full px-3 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      >
                        Close
                      </button>
                    </div>

                    <div className="px-6 py-6">
                      <form onSubmit={handleSubmitClaim} className="space-y-4">
                        {isLostItem ? (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Secret Identifier
                            </label>
                            <input
                              type="text"
                              value={claimData.secretIdentifier || ''}
                              onChange={(e) => handleClaimChange('secretIdentifier', e.target.value)}
                              placeholder="Enter the secret identifier"
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                              required
                            />
                            <label className="block text-sm font-medium text-slate-700 mb-2 mt-4">
                              Optional Description
                            </label>
                            <textarea
                              value={claimData.description || ''}
                              onChange={(e) => handleClaimChange('description', e.target.value)}
                              placeholder="Share details that help the reporter confirm you found it"
                              className="w-full min-h-28 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <label className="block text-sm font-medium text-slate-700 mb-2 mt-4">
                              Optional Photo
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleClaimPhotoChange}
                              className="w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-medium file:text-brand-700 hover:file:bg-brand-100"
                            />
                            {claimPhoto && (
                              <p className="mt-2 text-xs text-slate-500">Selected: {claimPhoto.name}</p>
                            )}
                          </div>
                        ) : (
                          proofQuestions.map((question, idx) => (
                            <div key={idx}>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                {question.question}
                              </label>
                              <input
                                type="text"
                                value={claimData[`answer${idx}`] || ''}
                                onChange={(e) => handleClaimChange(`answer${idx}`, e.target.value)}
                                placeholder="Your answer"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                required
                              />
                            </div>
                          ))
                        )}

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Optional Description
                          </label>
                          <textarea
                            value={claimData.description || ''}
                            onChange={(e) => handleClaimChange('description', e.target.value)}
                            placeholder={
                              isLostItem
                                ? 'Share details that help the reporter confirm you found it'
                                : 'Add any details that help the reporter understand your claim'
                            }
                            className="w-full min-h-28 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Optional Photo
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleClaimPhotoChange}
                            className="w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-medium file:text-brand-700 hover:file:bg-brand-100"
                          />
                          {claimPhoto && (
                            <p className="mt-2 text-xs text-slate-500">Selected: {claimPhoto.name}</p>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            disabled={submittingClaim}
                            className="flex-1 py-2 px-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition disabled:opacity-50"
                          >
                            {submittingClaim ? 'Submitting...' : 'Submit Claim'}
                          </button>
                          <button
                            type="button"
                            onClick={closeVerificationView}
                            className="flex-1 py-2 px-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg p-6 mt-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Views</span>
                    <span className="font-medium">{report.views || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Posted</span>
                    <span className="font-medium">{formatDate(report.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status</span>
                    <span className="font-medium capitalize">{report.status || 'Active'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ReportDetailPage
