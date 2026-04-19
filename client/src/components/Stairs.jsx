import { useEffect, useState } from 'react'

function Stairs({ children }) {
  const [showPreloader, setShowPreloader] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowPreloader(false)
    }, 1400)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className='relative min-h-screen overflow-hidden'>
      <div className={`transition-opacity duration-500 ${showPreloader ? 'opacity-0' : 'opacity-100'}`}>{children}</div>

      <button
        type='button'
        onClick={handleScrollToTop}
        aria-label='Scroll to top'
        className={`fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full border border-orange-200 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl ${
          !showPreloader && showScrollTop ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 15l7-7 7 7' />
        </svg>
      </button>

      {showPreloader && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-brand-50 via-orange-50 to-white'>
          <div className='flex flex-col items-center'>
            <div className='h-11 w-11 animate-spin rounded-full border-4 border-orange-200 border-t-brand-500' />

            <p className='mt-4 text-sm font-semibold tracking-wide text-slate-700'>Welcome to CampusTrace</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Stairs