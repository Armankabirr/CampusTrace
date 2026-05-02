import { useState } from 'react'
import loginBg from '../assets/Login_background.jpg'

function ForgotPassword({ onBack, onBackToLogin }) {
  const [stage, setStage] = useState('email') // 'email', 'verify-otp', or 'password'
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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

  const validateEmailStage = () => {
    const newErrors = {}

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateOtpStage = () => {
    const newErrors = {}

    if (!formData.otp || formData.otp.length !== 6 || !/^\d+$/.test(formData.otp)) {
      newErrors.otp = 'Please enter a valid 6-digit OTP'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordStage = () => {
    const newErrors = {}

    if (!formData.newPassword || formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()

    if (!validateEmailStage()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      })

      if (response.ok) {
        setSuccessMessage('OTP sent to your email. Please check your inbox.')
        setErrors({})
        setTimeout(() => {
          setStage('verify-otp')
          setSuccessMessage('')
        }, 2000)
      } else {
        try {
          const error = await response.json()
          setErrors({ form: error.message || 'An error occurred' })
        } catch {
          setErrors({ form: `Error: ${response.status} ${response.statusText}` })
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setErrors({ form: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()

    if (!validateOtpStage()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
        }),
      })

      if (response.ok) {
        setSuccessMessage('OTP verified! Now create your new password.')
        setErrors({})
        setTimeout(() => {
          setStage('password')
          setSuccessMessage('')
        }, 1500)
      } else {
        try {
          const error = await response.json()
          setErrors({ form: error.message || 'Invalid OTP' })
        } catch {
          setErrors({ form: `Error: ${response.status} ${response.statusText}` })
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      setErrors({ form: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (!validatePasswordStage()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword,
        }),
      })

      if (response.ok) {
        setSuccessMessage('Password reset successfully! Redirecting to login...')
        setErrors({})
        setTimeout(() => {
          onBackToLogin()
        }, 2000)
      } else {
        try {
          const error = await response.json()
          setErrors({ form: error.message || 'An error occurred' })
        } catch {
          setErrors({ form: `Error: ${response.status} ${response.statusText}` })
        }
      }
    } catch (error) {
      console.error('Reset password error:', error)
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
                  Reset Your Password
                </h2>
                <p className='text-lg text-white/90'>
                  We'll help you regain access to your CampusTrace account securely.
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
                    <h3 className='text-lg font-semibold'>Secure Process</h3>
                    <p className='text-white/80 text-sm'>Your account security is our priority</p>
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
                    <h3 className='text-lg font-semibold'>Email Verification</h3>
                    <p className='text-white/80 text-sm'>Verify your email with OTP for added security</p>
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
                    <h3 className='text-lg font-semibold'>Quick Access</h3>
                    <p className='text-white/80 text-sm'>Get back to your account in just a few steps</p>
                  </div>
                </div>
              </div>

              <div className='pt-6 border-t border-white/20'>
                <p className='text-sm text-white/80'>
                  Having trouble? Contact our support team for assistance.
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
                <h1 className='text-2xl sm:text-[2rem] font-bold text-gray-900 mb-2'>
                  {stage === 'email' ? 'Forgot Password?' : stage === 'verify-otp' ? 'Verify OTP' : 'Create New Password'}
                </h1>
                <p className='text-sm text-gray-600'>
                  {stage === 'email'
                    ? 'Enter your email to receive a verification code'
                    : stage === 'verify-otp'
                    ? 'Enter the OTP sent to your email'
                    : 'Enter your new password'}
                </p>
              </div>

              {errors.form && (
                <div className='mb-5 p-3 bg-red-50 border border-red-200 rounded-lg'>
                  <p className='text-red-700 text-sm'>{errors.form}</p>
                </div>
              )}

              {successMessage && (
                <div className='mb-5 p-3 bg-green-50 border border-green-200 rounded-lg'>
                  <p className='text-green-700 text-sm'>{successMessage}</p>
                </div>
              )}

              {stage === 'email' && (
                <form onSubmit={handleEmailSubmit} className='space-y-4'>
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

                  <button
                    type='submit'
                    disabled={loading}
                    className='w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium py-2.5 rounded-lg hover:from-orange-600 hover:to-red-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              )}

              {stage === 'verify-otp' && (
                <form onSubmit={handleVerifyOtp} className='space-y-4'>
                  <div>
                    <label htmlFor='otp' className='block text-sm font-medium text-gray-700 mb-1'>
                      Verification Code
                    </label>
                    <input
                      type='text'
                      id='otp'
                      name='otp'
                      value={formData.otp}
                      onChange={handleInputChange}
                      placeholder='000000'
                      maxLength='6'
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition text-center tracking-widest ${
                        errors.otp
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-orange-500'
                      }`}
                    />
                    {errors.otp && <p className='text-red-600 text-xs mt-1'>{errors.otp}</p>}
                  </div>

                  <div className='flex gap-3'>
                    <button
                      type='button'
                      onClick={() => setStage('email')}
                      className='flex-1 border-2 border-orange-500 text-orange-600 font-medium py-2.5 rounded-lg hover:bg-orange-50 transition'
                    >
                      Back
                    </button>
                    <button
                      type='submit'
                      disabled={loading}
                      className='flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium py-2.5 rounded-lg hover:from-orange-600 hover:to-red-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
                    >
                      {loading ? 'Verifying OTP...' : 'Next'}
                    </button>
                  </div>
                </form>
              )}

              {stage === 'password' && (
                <form onSubmit={handlePasswordSubmit} className='space-y-4'>
                  <div>
                    <label htmlFor='newPassword' className='block text-sm font-medium text-gray-700 mb-1'>
                      New Password
                    </label>
                    <input
                      type='password'
                      id='newPassword'
                      name='newPassword'
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder='••••••••'
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.newPassword
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-orange-500'
                      }`}
                    />
                    {errors.newPassword && <p className='text-red-600 text-xs mt-1'>{errors.newPassword}</p>}
                  </div>

                  <div>
                    <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700 mb-1'>
                      Confirm Password
                    </label>
                    <input
                      type='password'
                      id='confirmPassword'
                      name='confirmPassword'
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder='••••••••'
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.confirmPassword
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-orange-500'
                      }`}
                    />
                    {errors.confirmPassword && <p className='text-red-600 text-xs mt-1'>{errors.confirmPassword}</p>}
                  </div>

                  <div className='flex gap-3'>
                    <button
                      type='button'
                      onClick={() => setStage('verify-otp')}
                      className='flex-1 border-2 border-orange-500 text-orange-600 font-medium py-2.5 rounded-lg hover:bg-orange-50 transition'
                    >
                      Back
                    </button>
                    <button
                      type='submit'
                      disabled={loading}
                      className='flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium py-2.5 rounded-lg hover:from-orange-600 hover:to-red-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
                    >
                      {loading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                  </div>
                </form>
              )}

              <div className='text-center mt-5'>
                <p className='text-gray-700 text-sm'>
                  Remember your password?{' '}
                  <button
                    type='button'
                    onClick={onBackToLogin}
                    className='text-orange-600 hover:text-orange-700 font-bold transition'
                  >
                    Back to Login
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
