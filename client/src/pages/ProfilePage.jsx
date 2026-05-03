import { useEffect, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

const profileMetrics = [
  { value: '3', label: 'Items Reported', tone: 'bg-orange-500' },
  { value: '3', label: 'Matches Found', tone: 'bg-violet-500' },
  { value: '1', label: 'Claims Approved', tone: 'bg-emerald-500' },
  { value: '2', label: 'Pending Claims', tone: 'bg-amber-500' },
]

const activityTabs = ['Recent Activity', 'My Claims', 'Account Settings']

// Department codes mapping
const departmentCodes = {
  '011': 'Computer Science & Engineering',
  '012': 'Electrical & Electronics Engineering',
  '013': 'Business Administration',
  // Add more department codes as needed
}

function getDepartmentFromStudentId(studentId) {
  if (!studentId || studentId.length < 3) return 'Loading...'
  const deptCode = studentId.substring(0, 3)
  return departmentCodes[deptCode] || 'Unknown Department'
}

function getBatchFromStudentId(studentId) {
  if (!studentId || studentId.length < 6) return 'Loading...'
  const batchCode = studentId.substring(3, 6)
  const batchNum = parseInt(batchCode, 10)
  return `${batchNum} Batch`
}

function formatJoinedDate(dateValue) {
  if (!dateValue) {
    return 'September 2021'
  }

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return 'September 2021'
  }

  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatActivityDate(dateValue) {
  if (!dateValue) return 'Unknown date'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ProfilePage({ authUser, onHome, onReportItem, onSignOut, onAvatarClick }) {
  const [userData, setUserData] = useState(null)
  const [userReports, setUserReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reportsLoading, setReportsLoading] = useState(true)
  const [reportsError, setReportsError] = useState(null)
  const [activeTab, setActiveTab] = useState('Recent Activity')
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    location: '',
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState(null)
  const [editSuccess, setEditSuccess] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('accessToken')

        if (!token) {
          setError('No access token found')
          setLoading(false)
          return
        }

        const response = await fetch('/api/auth/get-me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }

        const data = await response.json()
        setUserData(data.user || null)
        setError(null)
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  useEffect(() => {
    const fetchUserReports = async () => {
      try {
        setReportsLoading(true)
        const token = localStorage.getItem('accessToken')

        if (!token) {
          setReportsError('No access token found')
          setReportsLoading(false)
          return
        }

        const response = await fetch('/api/reports/my-reports', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch your reports')
        }

        const data = await response.json()
        setUserReports(data.reports || [])
        setReportsError(null)
      } catch (err) {
        console.error('Error fetching user reports:', err)
        setReportsError(err.message)
      } finally {
        setReportsLoading(false)
      }
    }

    fetchUserReports()
  }, [])

  const handleOpenEdit = () => {
    const currentUser = displayUser
    setEditFormData({
      name: currentUser?.name || '',
      phone: currentUser?.phone || '',
      location: currentUser?.location || 'Dhaka, Bangladesh',
    })
    setIsEditMode(true)
    setEditError(null)
    setEditSuccess(false)
  }

  const handleCloseEdit = () => {
    setIsEditMode(false)
    setEditFormData({ name: '', phone: '', location: '' })
    setEditError(null)
    setEditSuccess(false)
  }

  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    setEditError(null)
    setEditSuccess(false)

    try {
      const token = localStorage.getItem('accessToken')

      if (!token) {
        setEditError('No access token found')
        setEditLoading(false)
        return
      }

      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          phone: editFormData.phone.trim(),
          location: editFormData.location.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update profile')
      }

      const data = await response.json()
      setUserData(data.user || null)
      setEditSuccess(true)
      setTimeout(() => {
        handleCloseEdit()
      }, 1500)
    } catch (err) {
      console.error('Error updating profile:', err)
      setEditError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  const displayUser = userData || authUser
  const userName = displayUser?.name || 'Profile'
  const studentId = displayUser?.studentId || 'Loading...'
  const email = displayUser?.email || 'Loading...'
  const phone = displayUser?.phone || 'Loading...'
  const joinedLabel = formatJoinedDate(displayUser?.createdAt)
  const initial = userName.charAt(0).toUpperCase()

  const personalFields = [
    { label: 'Full Name', value: displayUser?.name || 'Loading...', icon: 'S' },
    { label: 'Student ID', value: displayUser?.studentId || 'Loading...', icon: '#' },
    { label: 'Department', value: getDepartmentFromStudentId(displayUser?.studentId), icon: 'D' },
    { label: 'Batch', value: getBatchFromStudentId(displayUser?.studentId), icon: 'B' },
    { label: 'Joined', value: joinedLabel, icon: 'J' },
  ]

  const personalContactFields = [
    { label: 'Email Address', value: displayUser?.email || 'Loading...', icon: '@' },
    { label: 'Phone Number', value: displayUser?.phone || 'Loading...', icon: 'P' },
    { label: 'Location', value: displayUser?.location || 'Dhaka, Bangladesh', icon: 'L' },
  ]

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 font-sora">
        <Navbar
          authUser={authUser}
          activePage="profile"
          onHome={onHome}
          onBrowse={onHome}
          onMatches={onHome}
          onAvatarClick={onAvatarClick}
          onReportItem={onReportItem || onHome}
        />
        <main className="pt-24">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-600 font-semibold">Error loading profile: {error}</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sora">
      <Navbar
        authUser={authUser}
        activePage="profile"
        onHome={onHome}
        onBrowse={onHome}
        onMatches={onHome}
        onAvatarClick={onAvatarClick}
        onReportItem={onReportItem || onHome}
      />

      <main className="pt-24">
        <section className="relative w-full -mt-24 bg-[#E8612C] px-4 pb-12 pt-12 text-white">
          {/* decorative faint circles */}
          <div className="pointer-events-none absolute -right-16 -top-10 z-0 hidden md:block">
            <div className="h-64 w-64 rounded-full bg-[#F18A62] opacity-10" />
          </div>
          <div className="pointer-events-none absolute -left-12 top-6 z-0 hidden md:block">
            <div className="h-44 w-44 rounded-full bg-[#F18A62] opacity-08" />
          </div>

          <div className="relative z-10 mx-auto flex max-w-6xl items-start justify-between gap-4">
            <div className="space-y-2 text-sm text-white/95">
              <p className="font-medium">Home › Profile</p>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-6xl rounded-[1.25rem] bg-white p-5 text-slate-900 shadow-soft sm:p-6 lg:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="relative flex-shrink-0">
                <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-[1.5rem] border-4 border-white bg-gradient-to-br from-orange-100 via-amber-50 to-white shadow-lg sm:h-36 sm:w-36">
                  <div className="flex h-[88%] w-[88%] items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-brand-500 to-brand-700 text-5xl font-bold text-white">
                    {initial}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onAvatarClick}
                  className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-full border-4 border-white bg-brand-500 text-white shadow-md transition hover:bg-brand-600"
                  aria-label="Change profile photo"
                >
                  Edit
                </button>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-900">{userName}</h1>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    Verified Student
                  </span>
                </div>

                <p className="mt-2 inline-flex rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-brand-600">
                  {studentId}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span>{getDepartmentFromStudentId(studentId)}</span>
                  <span>{getBatchFromStudentId(studentId)}</span>
                  <span>Joined {joinedLabel}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span>{email}</span>
                  <span>{phone}</span>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
                    <p className="text-3xl font-bold text-brand-600">96</p>
                    <p className="text-xs text-slate-500">Trust Score</p>
                  </div>
                </div>

                <div className="mt-8 max-w-3xl rounded-3xl bg-slate-900 px-5 py-4 text-white shadow-lg">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">United International University</p>
                      <p className="text-xs text-slate-300">CampusTrace Member Card</p>
                    </div>
                    <div className="text-right text-xs text-slate-300">
                      <p>Student ID</p>
                      <p className="font-bold tracking-[0.3em] text-white">{studentId}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-600"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 pt-6">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-4">
            {profileMetrics.map((item) => (
              <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${item.tone} text-white`} />
                <p className="mt-4 text-3xl font-bold text-slate-900">{item.value}</p>
                <p className="text-sm text-slate-500">{item.label}</p>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-6 max-w-6xl rounded-full bg-white p-2 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {activityTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 transition ${tab === activeTab ? 'bg-orange-50 font-semibold text-brand-600 shadow-sm' : 'hover:bg-slate-50'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'Recent Activity' && (
            <div className="mx-auto mt-6 max-w-6xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {userReports.length} Reports
                </span>
              </div>

              {reportsLoading && <p className="text-sm text-slate-500">Loading your reports...</p>}

              {!reportsLoading && reportsError && (
                <p className="text-sm font-medium text-red-600">Error loading activity: {reportsError}</p>
              )}

              {!reportsLoading && !reportsError && userReports.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-600">You have not posted any lost or found reports yet.</p>
                </div>
              )}

              {!reportsLoading && !reportsError && userReports.length > 0 && (
                <div className="space-y-3">
                  {userReports.map((report) => (
                    <article
                      key={report._id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {report.imageUrl ? (
                            <img
                              src={report.imageUrl}
                              alt={report.title || 'Report image'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl text-slate-400">
                              📷
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                                report.itemType?.toLowerCase() === 'lost'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {report.itemType || 'Unknown'}
                            </span>
                            <span className="text-xs text-slate-500">{formatActivityDate(report.createdAt || report.date)}</span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{report.title || 'Untitled report'}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {report.category || 'Uncategorized'} • {report.lastSeenLocation || 'Unknown location'}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Status: {report.status || 'active'}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'My Claims' && (
            <div className="mx-auto mt-6 max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">My Claims</h2>
              <p className="mt-2 text-sm text-slate-600">
                Claim tracking will appear here when claim requests are available.
              </p>
            </div>
          )}

          {activeTab === 'Account Settings' && (
            <>
          <div className="mx-auto mt-6 grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                <button type="button" onClick={handleOpenEdit} className="text-xs font-semibold text-brand-500 hover:text-brand-600">
                  Edit
                </button>
              </div>

              <div className="grid gap-4 px-5 py-6 sm:grid-cols-2">
                {personalFields.map((field) => (
                  <div key={field.label} className="flex items-start gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-orange-50 text-xs font-bold text-brand-500">
                      {field.icon}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{field.label}</p>
                      <p className="text-sm font-medium text-slate-800">{field.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-900">Contact Details</h2>
                <button type="button" onClick={handleOpenEdit} className="text-xs font-semibold text-brand-500 hover:text-brand-600">
                  Edit
                </button>
              </div>

              <div className="space-y-4 px-5 py-6">
                {personalContactFields.map((field) => (
                  <div key={field.label} className="flex items-start gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-orange-50 text-xs font-bold text-brand-500">
                      {field.icon}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{field.label}</p>
                      <p className="text-sm font-medium text-slate-800">{field.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="mx-auto mt-6 max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-brand-500 via-orange-500 to-brand-600 px-6 py-8 text-white shadow-soft">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-full border border-white/30 bg-white/10 text-lg font-bold">
                UIU
              </div>
              <div>
                <h3 className="text-xl font-bold">Account Verified</h3>
                <p className="mt-1 text-sm text-white/90">
                  Your student ID has been verified by UIU administration. Your reports carry a higher trust score.
                </p>
              </div>
            </div>
          </div>
            </>
          )}
        </section>

        {isEditMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-3xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">Edit Profile</h2>

              {editError && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{editError}</p>
                </div>
              )}

              {editSuccess && (
                <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3">
                  <p className="text-sm text-emerald-700">Profile updated successfully!</p>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={editFormData.location}
                    onChange={handleEditInputChange}
                    placeholder="e.g., Dhaka, Bangladesh"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    disabled={editLoading}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Footer />
      </main>
    </div>
  )
}

export default ProfilePage
