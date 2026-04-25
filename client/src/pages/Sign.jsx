import { useState } from 'react'
import signupBg from '../assets/signUp-background.jpg'

function Sign({ onBack, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    studentId: '',
  })
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [otp, setOtp] = useState('')
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

  const validateStepOne = () => {
    const newErrors = {}

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your user name'
    }

    if (!formData.studentId || formData.studentId.trim().length < 3) {
      newErrors.studentId = 'Please enter your student ID'
    }

    if (!formData.phone || !/^(?:\+8801|01)[3-9]\d{8}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid Bangladeshi phone number'
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStepTwo = () => {
    const newErrors = {}

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (!validateStepOne()) {
      return
    }

    setErrors({})
    setCurrentStep(2)
  }

  const handlePreviousStep = () => {
    setErrors({})
    setCurrentStep(1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateStepTwo()) {
      return
    }

    setLoading(true)
    setErrors({})
    setSuccessMessage('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          name: formData.fullName,
          studentId: formData.studentId,
        }),
      })

      if (response.ok) {
        setCurrentStep(3)
        setSuccessMessage('OTP sent to your email. Enter it below to finish account creation.')
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault()

    if (!otp || otp.trim().length !== 6) {
      setErrors({ otp: 'Please enter your 6 digit OTP' })
      return
    }

    setLoading(true)
    setErrors({})
    setSuccessMessage('')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otp.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        setErrors({ form: error.message || 'OTP verification failed' })
        return
      }

      setSuccessMessage('Email verified and account created. Redirecting to login...')
      onSwitchToLogin(formData.email)
    } catch (error) {
      console.error('OTP verification error:', error)
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
          backgroundImage: `url(${signupBg})`,
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
                  Start Recovering Your Lost Items
                </h2>
                <p className='text-lg text-white/90'>
                  Join thousands of UIU students using CampusTrace to find their lost belongings on campus.
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
                    <h3 className='text-lg font-semibold'>Quick Registration</h3>
                    <p className='text-white/80 text-sm'>Create your account in just a few clicks</p>
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
                    <h3 className='text-lg font-semibold'>Report Items Instantly</h3>
                    <p className='text-white/80 text-sm'>Upload photos and details of your lost items</p>
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
                    <h3 className='text-lg font-semibold'>Get Matched Instantly</h3>
                    <p className='text-white/80 text-sm'>Our system automatically finds your lost items</p>
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
                    <h3 className='text-lg font-semibold'>Secure Handoff</h3>
                    <p className='text-white/80 text-sm'>Safe verification ensures rightful ownership</p>
                  </div>
                </div>
              </div>

              <div className='pt-6 border-t border-white/20'>
                <p className='text-sm text-white/80'>
                  Take the first step and join our community of students helping each other recover lost items on campus.
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
                <h1 className='text-2xl sm:text-[2rem] font-bold text-gray-900 mb-2'>Create Account</h1>
                <p className='text-sm text-gray-600'>Join our lost & found community</p>
              </div>

              {errors.form && (
                <div className='mb-5 p-3 bg-red-50 border border-red-200 rounded-lg'>
                  <p className='text-red-700 text-sm'>{errors.form}</p>
                </div>
              )}

              {successMessage && (
                <div className='mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg'>
                  <p className='text-emerald-700 text-sm'>{successMessage}</p>
                </div>
              )}

              <form onSubmit={currentStep === 3 ? handleVerifyOtp : handleSubmit} className='space-y-4'>
                <div className='text-xs text-gray-500'>Step {currentStep} of 3</div>

                {currentStep === 1 ? (
                  <>
                    <div>
                      <label htmlFor='fullName' className='block text-sm font-medium text-gray-700 mb-1'>
                        User Name
                      </label>
                      <input
                        type='text'
                        id='fullName'
                        name='fullName'
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder='John Doe'
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                          errors.fullName
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-orange-500'
                        }`}
                      />
                      {errors.fullName && <p className='text-red-600 text-xs mt-1'>{errors.fullName}</p>}
                    </div>

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
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                          errors.studentId
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-orange-500'
                        }`}
                      />
                      {errors.studentId && <p className='text-red-600 text-xs mt-1'>{errors.studentId}</p>}
                    </div>

                    <div>
                      <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-1'>
                        Phone Number
                      </label>
                      <input
                        type='tel'
                        id='phone'
                        name='phone'
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder='01XXXXXXXXX or +8801XXXXXXXXX'
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                          errors.phone
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-orange-500'
                        }`}
                      />
                      {errors.phone && <p className='text-red-600 text-xs mt-1'>{errors.phone}</p>}
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

                    <button
                      type='button'
                      onClick={handleNextStep}
                      className='w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium py-2.5 rounded-lg hover:from-orange-600 hover:to-red-600 transition transform hover:scale-105 shadow-lg'
                    >
                      Next
                    </button>
                  </>
                ) : currentStep === 2 ? (
                  <>
                    <div>
                      <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-1'>
                        Password
                      </label>
                      <div className='relative'>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id='password'
                          name='password'
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder='••••••••'
                          className={`w-full px-4 py-2.5 pr-11 border rounded-lg focus:outline-none focus:ring-2 transition ${
                            errors.password
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-orange-500'
                          }`}
                        />
                        <button
                          type='button'
                          onClick={() => setShowPassword((prev) => !prev)}
                          className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700'
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.959 9.959 0 012.233-3.592M6.228 6.228A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.96 9.96 0 01-4.293 5.187M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 9L3 3'
                              />
                            </svg>
                          ) : (
                            <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                              />
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z'
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.password && <p className='text-red-600 text-xs mt-1'>{errors.password}</p>}
                    </div>

                    <div>
                      <label
                        htmlFor='confirmPassword'
                        className='block text-sm font-medium text-gray-700 mb-1'
                      >
                        Confirm Password
                      </label>
                      <div className='relative'>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id='confirmPassword'
                          name='confirmPassword'
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder='••••••••'
                          className={`w-full px-4 py-2.5 pr-11 border rounded-lg focus:outline-none focus:ring-2 transition ${
                            errors.confirmPassword
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-orange-500'
                          }`}
                        />
                        <button
                          type='button'
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700'
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? (
                            <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.959 9.959 0 012.233-3.592M6.228 6.228A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.96 9.96 0 01-4.293 5.187M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 9L3 3'
                              />
                            </svg>
                          ) : (
                            <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                              />
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z'
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className='text-red-600 text-xs mt-1'>{errors.confirmPassword}</p>
                      )}
                    </div>

                    <div className='flex gap-3'>
                      <button
                        type='button'
                        onClick={handlePreviousStep}
                        className='w-1/3 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition'
                      >
                        Back
                      </button>

                      <button
                        type='submit'
                        disabled={loading}
                        className='w-2/3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium py-2.5 rounded-lg hover:from-orange-600 hover:to-red-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
                      >
                        {loading ? 'Processing...' : 'Create Account'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor='otp' className='block text-sm font-medium text-gray-700 mb-1'>
                        Enter OTP
                      </label>
                      <input
                        type='text'
                        id='otp'
                        name='otp'
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, ''))
                          if (errors.otp) {
                            setErrors((prev) => ({ ...prev, otp: '' }))
                          }
                        }}
                        placeholder='123456'
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
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
                        onClick={() => setCurrentStep(2)}
                        className='w-1/3 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition'
                      >
                        Back
                      </button>

                      <button
                        type='submit'
                        disabled={loading}
                        className='w-2/3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium py-2.5 rounded-lg hover:from-orange-600 hover:to-red-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
                      >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </div>
                  </>
                )}
              </form>

              <div className='text-center mt-5'>
                <p className='text-gray-700 text-sm'>
                  Already have an account?{' '}
                  <button
                    type='button'
                    onClick={() => onSwitchToLogin(formData.email)}
                    className='text-orange-600 hover:text-orange-700 font-bold transition'
                  >
                    Sign In
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

export default Sign
