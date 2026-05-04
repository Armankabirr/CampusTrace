import { useMemo, useRef, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

const itemTypes = [
  { label: 'Lost Item', value: 'lost' },
  { label: 'Found Item', value: 'found' },
]

const categories = ['ID Card', 'Wallet', 'Keys', 'Phone', 'Bag', 'Laptop', 'Accessories', 'Other']

const initialFormState = {
  itemType: 'lost',
  category: 'ID Card',
  title: '',
  description: '',
  lastSeenLocation: '',
  date: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
}

const initialSecretState = {
  privateIdentifier: '',
}

const initialFoundVerificationState = [
  { question: '', answer: '' },
]

function formatDate(value) {
  if (!value) return 'Today'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Today'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ReportItemPage({ authUser, onHome, onBrowse, onMatches, onReportItem, onBack, unreadNotifications, pendingMatchCount, onNotificationClick }) {
  const fileInputRef = useRef(null)
  const [formStep, setFormStep] = useState(1)
  const [formData, setFormData] = useState({
    ...initialFormState,
    contactName: authUser?.name || '',
    contactEmail: authUser?.email || '',
    contactPhone: authUser?.phone || '',
  })
  const [secretData, setSecretData] = useState(initialSecretState)
  const [foundVerificationData, setFoundVerificationData] = useState(initialFoundVerificationState)
  const [imageName, setImageName] = useState('')
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [submissionError, setSubmissionError] = useState('')
  const [submissionSuccess, setSubmissionSuccess] = useState('')
  const [recentPosts, setRecentPosts] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const submitTone = useMemo(
    () => (formData.itemType === 'lost' ? 'bg-slate-900' : 'bg-slate-800'),
    [formData.itemType],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleItemTypeChange = (itemType) => {
    setFormData((current) => ({ ...current, itemType }))
    setSecretData(initialSecretState)
    setFoundVerificationData(initialFoundVerificationState)
    setSubmissionError('')
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    setImageName(file ? file.name : '')
    setSelectedImageFile(file || null)
  }

  const handleSecretChange = (event) => {
    const { name, value } = event.target
    setSecretData((current) => ({ ...current, [name]: value }))
  }

  const handleFoundVerificationChange = (index, field, value) => {
    setFoundVerificationData((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item,
      ),
    )
  }

  const addFoundVerificationItem = () => {
    setFoundVerificationData((current) => [...current, { question: '', answer: '' }])
  }

  const removeFoundVerificationItem = (index) => {
    setFoundVerificationData((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const validatePublicDetails = () => {
    const title = formData.title.trim()
    const description = formData.description.trim()
    const location = formData.lastSeenLocation.trim()

    if (!title || !description || !location) {
      setSubmissionError('Please fill in the title, description, and location before moving to the next step.')
      setSubmissionSuccess('')
      return false
    }

    if (title.length < 3) {
      setSubmissionError('Title must be at least 3 characters long.')
      setSubmissionSuccess('')
      return false
    }

    if (description.length < 10) {
      setSubmissionError('Description must be at least 10 characters long.')
      setSubmissionSuccess('')
      return false
    }

    return true
  }

  const handleNextStep = () => {
    setSubmissionError('')
    if (!validatePublicDetails()) return
    setFormStep(2)
  }

  const handleBackToDetails = () => {
    setSubmissionError('')
    setFormStep(1)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmissionError('')
    setIsLoading(true)

    if (!validatePublicDetails()) {
      setIsLoading(false)
      return
    }

    if (
      (formData.itemType === 'lost' && !secretData.privateIdentifier.trim()) ||
      (formData.itemType === 'found' && !foundVerificationData.some((item) => item.question.trim() && item.answer.trim()))
    ) {
      setSubmissionError(
        formData.itemType === 'lost'
          ? 'Please provide a secret identifier before posting the lost item report.'
          : 'Please provide at least one verification question and expected answer before posting the found item report.'
      )
      setSubmissionSuccess('')
      setIsLoading(false)
      return
    }

    try {
      // Create FormData object to send file and form data
      const formDataToSend = new FormData()
      
      // Add form fields
      formDataToSend.append('itemType', formData.itemType)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('lastSeenLocation', formData.lastSeenLocation)
      formDataToSend.append('date', formData.date)
      formDataToSend.append('contactName', formData.contactName)
      formDataToSend.append('contactEmail', formData.contactEmail)
      formDataToSend.append('contactPhone', formData.contactPhone)
      const verificationDetails =
        formData.itemType === 'lost'
          ? { privateIdentifier: secretData.privateIdentifier }
          : {
              proofQuestions: foundVerificationData,
            }

      formDataToSend.append('verificationDetails', JSON.stringify(verificationDetails))

      // Add image file if selected
      if (selectedImageFile) {
        formDataToSend.append('image', selectedImageFile)
      }

      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        throw new Error('Authentication required. Please log in again.')
      }

      // Submit to backend
      const response = await fetch('http://localhost:3000/api/reports/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formDataToSend,
      }).catch((err) => {
        throw new Error(`Network error: Make sure the server is running on http://localhost:3000. ${err.message}`)
      })

      let data
      try {
        data = await response.json()
      } catch {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(data.message || `Failed to create report (HTTP ${response.status})`)
      }

      setSubmissionSuccess(`Your ${formData.itemType} report has been posted successfully. Check back soon for matches!`)
      
      // Add to recent posts for UI
      const entry = {
        id: data.report.id,
        ...formData,
        imageName,
        imageUrl: data.report.imageUrl,
        verificationDetails,
        createdAt: new Date().toISOString(),
      }
      setRecentPosts((current) => [entry, ...current].slice(0, 4))

      // Reset form
      setFormData((current) => ({
        ...initialFormState,
        itemType: current.itemType,
        contactName: authUser?.name || '',
        contactEmail: authUser?.email || '',
        contactPhone: authUser?.phone || '',
      }))
      setSecretData(initialSecretState)
      setImageName('')
      setSelectedImageFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setFormStep(1)
    } catch (error) {
      console.error('Report submission error:', error)
      setSubmissionError(error.message || 'Failed to create report. Please try again.')
      setSubmissionSuccess('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sora">
      <Navbar
        authUser={authUser}
        activePage="report"
        onHome={onHome}
        onBrowse={onBrowse || onHome}
        onMatches={onMatches || onBrowse || onHome}
        onAvatarClick={authUser ? onBack : onHome}
        onReportItem={onReportItem || onHome}
        unreadNotifications={unreadNotifications}
        pendingMatchCount={pendingMatchCount}
        onNotificationClick={onNotificationClick}
      />

      <main className="pt-24">
        <section className="relative w-full -mt-24 bg-[#FFF7F2] px-4 pb-14 pt-8 text-slate-900">
          <div className="pointer-events-none absolute -right-12 top-0 hidden h-56 w-56 rounded-full bg-[#E8612C] opacity-[0.04] md:block" />
          <div className="pointer-events-none absolute left-0 top-10 hidden h-36 w-36 rounded-full bg-[#E8612C] opacity-[0.03] md:block" />

          <div className="relative mx-auto max-w-6xl">
            <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
              <button type="button" onClick={onBack || onHome} className="font-medium hover:text-slate-900">
                Home › Report Item
              </button>
              <button
                type="button"
                onClick={onBack || onHome}
                className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-white"
              >
                Back
              </button>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div className="space-y-5">
                <span className="inline-flex w-fit rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                  Post a report
                </span>
                <h1 className="max-w-xl text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                  Report what you lost or found on campus.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Create a clean report with photos, a clear description, and last-seen details so students can find matches quickly.
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-bold">1</p>
                    <p className="mt-1 text-xs text-slate-500">Choose lost or found</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-bold">2</p>
                    <p className="mt-1 text-xs text-slate-500">Add item details</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-bold">3</p>
                    <p className="mt-1 text-xs text-slate-500">Submit and wait for matches</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-white p-5 text-slate-900 shadow-soft sm:p-6">
                <div className={`rounded-2xl ${submitTone} px-5 py-4 text-white`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Status</p>
                  <p className="mt-1 text-lg font-bold capitalize">{formData.itemType} item report</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {formStep === 1 ? (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Report Type</label>
                        <div className="grid grid-cols-2 gap-3">
                          {itemTypes.map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => handleItemTypeChange(item.value)}
                              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                                formData.itemType === item.value
                                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-700">
                          Category
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                          Item Title
                        </label>
                        <input
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          placeholder="e.g. Black wallet with student ID"
                          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                        />
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Describe the item, brand, color, unique marks, or condition."
                          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="lastSeenLocation" className="block text-sm font-medium text-slate-700">
                            Last Seen / Found Location
                          </label>
                          <input
                            id="lastSeenLocation"
                            name="lastSeenLocation"
                            value={formData.lastSeenLocation}
                            onChange={handleChange}
                            placeholder="e.g. Main campus cafeteria"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                          />
                        </div>
                        <div>
                          <label htmlFor="date" className="block text-sm font-medium text-slate-700">
                            Date
                          </label>
                          <input
                            id="date"
                            name="date"
                            type="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="itemImage" className="block text-sm font-medium text-slate-700">
                          Photo
                        </label>
                        <input
                          ref={fileInputRef}
                          id="itemImage"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                        <div className="mt-1 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            Choose file
                          </button>
                          <span className="text-sm text-slate-600">{imageName || 'No file chosen'}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">Optional, but photos improve match quality.</p>
                        {imageName ? <p className="mt-1 text-xs font-medium text-slate-600">Selected: {imageName}</p> : null}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="contactName" className="block text-sm font-medium text-slate-700">
                            Contact Name
                          </label>
                          <input
                            id="contactName"
                            name="contactName"
                            value={formData.contactName}
                            onChange={handleChange}
                            placeholder="Your name"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                          />
                        </div>
                        <div>
                          <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700">
                            Contact Email
                          </label>
                          <input
                            id="contactEmail"
                            name="contactEmail"
                            type="email"
                            value={formData.contactEmail}
                            onChange={handleChange}
                            placeholder="name@example.com"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="contactPhone" className="block text-sm font-medium text-slate-700">
                          Contact Phone
                        </label>
                        <input
                          id="contactPhone"
                          name="contactPhone"
                          type="tel"
                          value={formData.contactPhone}
                          onChange={handleChange}
                          placeholder="01XXXXXXXXX"
                          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {formData.itemType === 'lost' ? (
                        <>
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            For lost item reports, add one secret identifier that only the real owner would know.
                          </div>

                          <div>
                            <label htmlFor="privateIdentifier" className="block text-sm font-medium text-slate-700">
                              Secret Identifier
                            </label>
                            <input
                              id="privateIdentifier"
                              name="privateIdentifier"
                              value={secretData.privateIdentifier}
                              onChange={handleSecretChange}
                              placeholder="e.g. Last 4 digits, engraving text, hidden sticker, initials"
                              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            For found item reports, add one or more verification questions and expected answers.
                          </div>

                          <div className="space-y-4">
                            {foundVerificationData.map((item, index) => (
                              <div key={index} className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-slate-700">Question {index + 1}</p>
                                  {foundVerificationData.length > 1 ? (
                                    <button
                                      type="button"
                                      onClick={() => removeFoundVerificationItem(index)}
                                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                                    >
                                      Remove
                                    </button>
                                  ) : null}
                                </div>

                                <div className="mt-3 space-y-3">
                                  <div>
                                    <label htmlFor={`question-${index}`} className="block text-sm font-medium text-slate-700">
                                      Verification Question
                                    </label>
                                    <input
                                      id={`question-${index}`}
                                      name="question"
                                      value={item.question}
                                      onChange={(event) => handleFoundVerificationChange(index, 'question', event.target.value)}
                                      placeholder="e.g. What is inside the main pocket?"
                                      className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                                    />
                                  </div>

                                  <div>
                                    <label htmlFor={`answer-${index}`} className="block text-sm font-medium text-slate-700">
                                      Expected Answer
                                    </label>
                                    <textarea
                                      id={`answer-${index}`}
                                      name="answer"
                                      value={item.answer}
                                      onChange={(event) => handleFoundVerificationChange(index, 'answer', event.target.value)}
                                      rows={3}
                                      placeholder="Write the exact answer you expect from the claimant."
                                      className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={addFoundVerificationItem}
                              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Add another question
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {submissionError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submissionError}</div>
                  ) : null}
                  {submissionSuccess ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {submissionSuccess}
                    </div>
                  ) : null}

                  <div className="flex gap-3 pt-2">
                    {formStep === 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={onBack || onHome}
                          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isLoading}
                        >
                          Next
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleBackToDetails}
                          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          disabled={isLoading}
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Uploading...' : 'Post Report'}
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-12">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Posting Tips</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>Use a specific title with color, brand, or unique detail.</li>
                <li>Add the exact last-seen or found location if you remember it.</li>
                <li>Upload one clear photo when possible for better matching.</li>
                <li>Keep your contact details active so other students can reach you.</li>
              </ul>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Recent Posts</h2>
              {recentPosts.length ? (
                <div className="mt-4 space-y-4">
                  {recentPosts.map((post) => (
                    <article key={post.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold capitalize text-slate-600">{post.itemType}</p>
                          <h3 className="text-lg font-bold text-slate-900">{post.title}</h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          {formatDate(post.date)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{post.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1">{post.category}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">{post.lastSeenLocation}</span>
                        {post.imageName ? <span className="rounded-full bg-slate-100 px-3 py-1">{post.imageName}</span> : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  No reports posted yet. Submit your first item from the form above.
                </div>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  )
}

export default ReportItemPage
