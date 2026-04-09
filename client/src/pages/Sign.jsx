import { useState } from 'react'

function Sign({ onBack }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name'
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Signup successful', data)
        // You can redirect to dashboard or home page here
        // navigate('/dashboard')
      } else {
        const error = await response.json()
        setErrors({ form: error.message || 'An error occurred' })
      }
    } catch (error) {
      console.error('Signup error:', error)
      setErrors({ form: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen w-full flex items-center justify-center relative overflow-hidden'>
      {/* Background with gradient and optional image */}
      <div
        className='absolute inset-0 bg-gradient-to-br from-orange-400 via-red-400 to-rose-500 opacity-90'
        style={{
          backgroundImage: `url('/images/campus-2.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay for better text readability */}
        <div className='absolute inset-0 bg-black/40'></div>
      </div>

      {/* Content */}
      <div className='relative z-10 w-full max-w-md mx-4'>
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className='mb-4 flex items-center gap-2 text-white/80 hover:text-white transition text-sm'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
            Back to Home
          </button>
        )}

        {/* Card */}
        <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20'>
          {/* Header */}
          <div className='text-center mb-8'>
            <div className='inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full text-white font-bold text-lg mb-4'>
              CT
            </div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>CampusTrace</h1>
            <p className='text-gray-600 text-sm'>Join our lost & found community</p>
          </div>

          {/* Error Message */}
          {errors.form && (
            <div className='mb-6 p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-red-700 text-sm'>{errors.form}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Full Name Field */}
            <div>
              <label htmlFor='fullName' className='block text-sm font-medium text-gray-700 mb-1'>
                Full Name
              </label>
              <input
                type='text'
                id='fullName'
                name='fullName'
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder='John Doe'
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                  errors.fullName
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-orange-500'
                }`}
              />
              {errors.fullName && <p className='text-red-600 text-xs mt-1'>{errors.fullName}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>
                Email Address
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                placeholder='your@college.edu'
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-orange-500'
                }`}
              />
              {errors.email && <p className='text-red-600 text-xs mt-1'>{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-1'>
                Password
              </label>
              <input
                type='password'
                id='password'
                name='password'
                value={formData.password}
                onChange={handleInputChange}
                placeholder='••••••••'
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                  errors.password
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-orange-500'
                }`}
              />
              {errors.password && <p className='text-red-600 text-xs mt-1'>{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Confirm Password
              </label>
              <input
                type='password'
                id='confirmPassword'
                name='confirmPassword'
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder='••••••••'
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-orange-500'
                }`}
              />
              {errors.confirmPassword && (
                <p className='text-red-600 text-xs mt-1'>{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={loading}
              className='w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium py-2.5 rounded-lg hover:from-orange-600 hover:to-red-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
            >
              {loading ? 'Processing...' : 'Create Account'}
            </button>
          </form>

          {/* Toggle to Login */}
          <div className='text-center mt-6'>
            <p className='text-gray-700 text-sm'>
              Already have an account?{' '}
              <a href='/login' className='text-orange-600 hover:text-orange-700 font-bold transition'>
                Sign In
              </a>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <p className='text-center text-white/80 text-xs mt-6'>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default Sign
