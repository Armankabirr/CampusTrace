import { useState } from 'react'
import loginBg from '../assets/Login_background.jpg'

function Login({ onBack }) {
  const [formData, setFormData] = useState({
    studentId: '',
    email: '',
    password: '',
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

    if (!formData.studentId || formData.studentId.trim().length < 3) {
      newErrors.studentId = 'Please enter your student ID'
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: formData.studentId,
          email: formData.email,
          password: formData.password,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Login successful', data)
        // You can redirect to dashboard or home page here
        // navigate('/dashboard')
      } else {
        const error = await response.json()
        setErrors({ form: error.message || 'An error occurred' })
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ form: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen w-full flex items-center justify-center relative overflow-hidden'>
      {/* Background with gradient and optional image */}
      <div
        className='absolute inset-0 bg-gradient-to-br from-orange-400 via-red-400 to-rose-500'
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay for better text readability */}
        <div className='absolute inset-0 bg-black/30'></div>
      </div>

      {/* Content */}
      <div className='relative z-10 w-full h-screen flex items-center'>
        <div className='w-full max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
          {/* Left Side - Text Content */}
          <div className='hidden lg:block text-white pr-6'>
            <div className='space-y-6 max-w-xl'>
              <div>
                <h2 className='text-4xl md:text-5xl font-bold mb-4'>
                  Find Your Lost Items On Campus
                </h2>
                <p className='text-lg text-white/90'>
                  CampusTrace is the smart solution for UIU students to reunite with their lost belongings.
                </p>
              </div>

              <div className='space-y-4'>
                <div className='flex gap-4'>
                  <div className='flex-shrink-0'>
                    <div className='flex items-center justify-center h-10 w-10 rounded-lg bg-orange-500'>
                      <svg className='h-6 w-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold'>Smart Matching</h3>
                    <p className='text-white/80 text-sm'>Our AI matches lost items with found items instantly</p>
                  </div>
                </div>

                <div className='flex gap-4'>
                  <div className='flex-shrink-0'>
                    <div className='flex items-center justify-center h-10 w-10 rounded-lg bg-orange-500'>
                      <svg className='h-6 w-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold'>Secure Verification</h3>
                    <p className='text-white/80 text-sm'>Verify ownership with photo evidence and details</p>
                  </div>
                </div>

                <div className='flex gap-4'>
                  <div className='flex-shrink-0'>
                    <div className='flex items-center justify-center h-10 w-10 rounded-lg bg-orange-500'>
                      <svg className='h-6 w-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold'>Real-time Updates</h3>
                    <p className='text-white/80 text-sm'>Get notified instantly when matches are found</p>
                  </div>
                </div>
              </div>

              <div className='pt-6 border-t border-white/20'>
                <p className='text-sm text-white/80'>
                  Join 500+ UIU students who have successfully recovered their lost items using CampusTrace.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className='lg:justify-self-end lg:w-full lg:max-w-md'>
            {onBack && (
              <button
                onClick={onBack}
                className='mb-5 flex items-center gap-2 text-white/90 hover:text-white transition text-sm'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                </svg>
                Back to Home
              </button>
            )}

            <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-7 border border-white/20'>
              <div className='mb-6'>
                <div className='inline-flex items-center justify-center w-11 h-11 bg-gradient-to-br from-orange-500 to-red-500 rounded-full text-white font-bold text-base mb-4'>
                  CT
                </div>
                <h1 className='text-2xl sm:text-[2rem] font-bold text-gray-900 mb-2'>Welcome Back</h1>
                <p className='text-sm text-gray-600'>Sign in to your CampusTrace account</p>
              </div>

              {errors.form && (
                <div className='mb-5 p-3 bg-red-50 border border-red-200 rounded-lg'>
                  <p className='text-red-700 text-sm'>{errors.form}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label htmlFor='studentId' className='block text-sm font-medium text-gray-700 mb-1'>
                    Student ID
                  </label>
                  <input
                    type='text'
                    id='studentId'
                    name='studentId'
                    value={formData.studentId}
                    onChange={handleInputChange}
                    placeholder='011231000'
                    required
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.studentId
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                  />
                  {errors.studentId && <p className='text-red-600 text-xs mt-1'>{errors.studentId}</p>}
                </div>

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
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                  />
                  {errors.email && <p className='text-red-600 text-xs mt-1'>{errors.email}</p>}
                </div>

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
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.password
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                  />
                  {errors.password && <p className='text-red-600 text-xs mt-1'>{errors.password}</p>}
                </div>

                <div className='flex justify-end'>
                  <a href='#' className='text-sm text-orange-600 hover:text-orange-700 font-medium'>
                    Forgot password?
                  </a>
                </div>

                <button
                  type='submit'
                  disabled={loading}
                  className='w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium py-2.5 rounded-lg hover:from-orange-600 hover:to-red-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
                >
                  {loading ? 'Processing...' : 'Sign In'}
                </button>
              </form>

              <div className='text-center mt-5'>
                <p className='text-gray-700 text-sm'>
                  Don't have an account?{' '}
                  <a href='/signup' className='text-orange-600 hover:text-orange-700 font-bold transition'>
                    Sign Up
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
