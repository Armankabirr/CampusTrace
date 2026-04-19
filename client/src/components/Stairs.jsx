import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

function Stairs({ children }) {
  const stairParentRef = useRef(null)
  const pageRef = useRef(null)
  const stairRefs = useRef([])
  const [showOverlay, setShowOverlay] = useState(true)

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