import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

function Stairs({ children }) {
  const stairParentRef = useRef(null)
  const pageRef = useRef(null)
  const stairRefs = useRef([])
  const [showOverlay, setShowOverlay] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)

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

  useGSAP(() => {
    const stairs = stairRefs.current.filter(Boolean)

    const tl = gsap.timeline({
      onComplete: () => {
        setShowOverlay(false)
      },
    })

    gsap.set(pageRef.current, {
      opacity: 0,
      scale: 1.03,
      transformOrigin: 'center center',
    })

    gsap.set(stairs, {
      transformOrigin: 'bottom center',
      yPercent: 110,
      scaleY: 0.25,
      opacity: 0,
      willChange: 'transform, opacity',
    })

    tl.set(stairParentRef.current, {
      display: 'block',
      autoAlpha: 1,
    })

    tl.to(stairs, {
      yPercent: 0,
      scaleY: 1,
      opacity: 1,
      duration: 1.05,
      stagger: {
        each: 0.1,
      },
      ease: 'power4.out',
    })

    tl.to(stairs, {
      yPercent: 112,
      scaleY: 0.96,
      duration: 0.9,
      stagger: {
        each: 0.08,
        from: 'end',
      },
      ease: 'power3.inOut',
    }, '+=0.18')

    tl.to(
      stairParentRef.current,
      {
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power2.out',
      },
      '-=0.12',
    )

    tl.to(
      pageRef.current,
      {
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: 'power3.out',
      },
      '-=0.45',
    )
  }, [])

  return (
    <div className='relative min-h-screen overflow-hidden'>
      <div ref={pageRef}>{children}</div>

      <button
        type='button'
        onClick={handleScrollToTop}
        aria-label='Scroll to top'
        className={`fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full border border-orange-200 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl ${
          showScrollTop ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 15l7-7 7 7' />
        </svg>
      </button>

      {showOverlay && (
        <div ref={stairParentRef} className='pointer-events-none fixed inset-0 z-50 hidden h-screen w-full bg-white'>
          <div className='flex h-full w-full overflow-hidden'>
            <div ref={(node) => { stairRefs.current[0] = node }} className='stair h-full w-1/5 bg-black' />
            <div ref={(node) => { stairRefs.current[1] = node }} className='stair h-full w-1/5 bg-black' />
            <div ref={(node) => { stairRefs.current[2] = node }} className='stair h-full w-1/5 bg-black' />
            <div ref={(node) => { stairRefs.current[3] = node }} className='stair h-full w-1/5 bg-black' />
            <div ref={(node) => { stairRefs.current[4] = node }} className='stair h-full w-1/5 bg-black' />
          </div>
        </div>
      )}
    </div>
  )
}

export default Stairs