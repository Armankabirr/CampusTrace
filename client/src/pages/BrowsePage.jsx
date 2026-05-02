import { useEffect, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

function BrowsePage({ authUser, onHome, onBrowse, onReportItem, onAvatarClick }) {
  const [reports, setReports] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'lost', 'found'
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    'All categories',
    'ID Card',
    'Wallet',
    'Keys',
    'Phone',
    'Bag',
    'Laptop',
    'Accessories',
    'Other',
  ]

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports/get-all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const data = await response.json()
      setReports(data.reports || [])
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = reports

    // Filter by type (Lost/Found)
    if (filterType !== 'all') {
      filtered = filtered.filter((report) => report.itemType?.toLowerCase() === filterType)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (report) => report.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (report) =>
          report.title?.toLowerCase().includes(search) ||
          report.description?.toLowerCase().includes(search) ||
          report.lastSeenLocation?.toLowerCase().includes(search)
      )
    }

    setFilteredReports(filtered)
  }, [reports, filterType, selectedCategory, searchTerm])

  const formatDate = (date) => {
    if (!date) return 'Unknown'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sora">
      <Navbar
        authUser={authUser}
        activePage="browse"
        onHome={onHome}
        onBrowse={onBrowse}
        onMatches={onHome}
        onLogin={onHome}
        onSignup={onHome}
        onAvatarClick={onAvatarClick}
        onReportItem={onReportItem}
      />

      <main className="pt-28 pb-16 px-4">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Browse Items</h1>
            <p className="text-slate-600">Search through 5 reported items on UIU campus</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search by title, description or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
              </div>
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat.toLowerCase()}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  filterType === 'all'
                    ? 'bg-brand-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                All Items ({reports.length})
              </button>
              <button
                onClick={() => setFilterType('lost')}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  filterType === 'lost'
                    ? 'bg-red-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Lost (
                {reports.filter((r) => r.itemType?.toLowerCase() === 'lost').length})
              </button>
              <button
                onClick={() => setFilterType('found')}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  filterType === 'found'
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Found (
                {reports.filter((r) => r.itemType?.toLowerCase() === 'found').length})
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6 text-sm text-slate-600">
            Showing {filteredReports.length} items
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 aspect-video rounded-lg mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-red-600 font-medium">Error: {error}</p>
              <button
                onClick={fetchReports}
                className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredReports.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">No items found matching your criteria.</p>
            </div>
          )}

          {/* Reports Grid */}
          {!loading && !error && filteredReports.length > 0 && (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredReports.map((report) => (
                <div
                  key={report._id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  {/* Image Container */}
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    {report.imageUrl ? (
                      <img
                        src={report.imageUrl}
                        alt={report.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <span className="text-4xl">📷</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${
                          report.itemType?.toLowerCase() === 'lost'
                            ? 'bg-red-500'
                            : 'bg-green-500'
                        }`}
                      >
                        {report.itemType?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>

                    {/* Match Badge */}
                    {report.status === 'matched' && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-blue-500">
                          Matched
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Category */}
                    <p className="text-xs text-slate-500 uppercase font-medium mb-1">
                      {report.category || 'Uncategorized'}
                    </p>

                    {/* Title */}
                    <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">
                      {report.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {report.description}
                    </p>

                    {/* Location and Date */}
                    <div className="space-y-1 mb-3 text-sm text-slate-600">
                      <p className="flex items-start gap-2">
                        <span>📍</span>
                        <span className="line-clamp-1">{report.lastSeenLocation || 'Unknown'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{formatDate(report.date)}</span>
                      </p>
                    </div>

                    {/* Contact Info Indicator */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>👤 {report.contactName || 'Contact'}</span>
                    </div>

                    {/* View Details Button */}
                    <button className="mt-4 w-full py-2 px-3 bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-600 rounded-lg font-medium transition text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default BrowsePage
