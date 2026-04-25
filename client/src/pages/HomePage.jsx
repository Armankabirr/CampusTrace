import { useEffect, useState } from 'react'
import heroImage from '../assets/hero.jpg'

const stats = [
  { value: '150+', label: 'Items Reported' },
  { value: '89%', label: 'Match Success Rate' },
  { value: '120+', label: 'Items Reunited' },
]

const steps = [
  {
    title: 'Report Item',
    text: 'Upload photos and details about your lost or found item with location information.',
    tone: 'from-amber-500 to-orange-500',
    icon: 'Q',
  },
  {
    title: 'Auto-Matching',
    text: 'Our system automatically finds potential matches based on description and location.',
    tone: 'from-yellow-500 to-orange-500',
    icon: 'Z',
  },
  {
    title: 'Get Notified',
    text: 'Receive instant notifications when a potential match is found for your item.',
    tone: 'from-rose-500 to-red-500',
    icon: 'N',
  },
  {
    title: 'Verify and Claim',
    text: 'Secure verification ensures items are returned to the rightful owner safely.',
    tone: 'from-emerald-500 to-teal-500',
    icon: 'O',
  },
]

const reasons = [
  'Smart Matching Algorithm',
  'Secure Verification',
  'Photo Evidence',
  'Real-time Notifications',
]

function HomePage({ onLogin, onSignup, authUser }) {
  const [parallaxY, setParallaxY] = useState(0)
  const userInitial = authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'U'

  useEffect(() => {
    let ticking = false

    const updateParallax = () => {
      const scrollY = window.scrollY || 0
      const nextOffset = Math.min(140, scrollY * 0.28)
      setParallaxY(nextOffset)
      ticking = false
    }

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax)
        ticking = true
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sora">
      <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-white/70 bg-white/90 px-4 py-2.5 shadow-soft backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
              Q
            </span>
            <div>
              <p className="text-sm font-bold leading-none">CampusTrace</p>
              <p className="text-[11px] text-slate-500">UIU Lost and Found</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-slate-100 p-1 text-xs text-slate-500 lg:flex">
            <button className="rounded-full bg-white px-4 py-1.5 font-medium text-brand-600 shadow" type="button">
              Home
            </button>
            <button className="rounded-full px-4 py-1.5 font-medium transition hover:bg-white" type="button">
              Browse
            </button>
            <button className="rounded-full px-4 py-1.5 font-medium transition hover:bg-white" type="button">
              Matches
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {authUser ? (
              <button
                type="button"
                title={authUser.name || 'User'}
                className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow"
              >
                {userInitial}
              </button>
            ) : (
              <>
                <button onClick={onLogin} className="hidden rounded-full px-4 py-2 font-semibold text-slate-700 md:block hover:text-slate-900 transition" type="button">
                  Sign In
                </button>
                <button onClick={onSignup} className="rounded-full bg-brand-500 px-4 py-2 font-semibold text-white transition hover:bg-brand-600" type="button">
                  Get Started
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section className="relative min-h-[760px] overflow-hidden pt-28 text-white">
          <img
            src={heroImage}
            alt="Campus building"
            className="hero-parallax-image absolute inset-0 h-[114%] w-full object-cover"
            style={{ transform: `translate3d(0, ${parallaxY}px, 0) scale(1.08)` }}
          />
          <div className="absolute inset-0 bg-slate-950/58" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-slate-900/30 to-slate-950" />

          <div className="relative mx-auto flex min-h-[710px] w-full max-w-6xl flex-col items-center justify-center px-4 text-center">
            <p className="mb-7 rounded-full border border-amber-300/45 bg-amber-500/20 px-4 py-1 text-[11px] text-amber-100 shadow">
              United International University - Campus Lost and Found
            </p>
            <h1 className="max-w-4xl text-[42px] font-bold leading-[1.05] sm:text-6xl md:text-[68px]">
              Find What You <span className="text-brand-400">Lost</span>,
              <br />
              Return What You <span className="text-brand-400">Found</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
              CampusTrace helps UIU students reunite with their lost items through intelligent matching, photo
              evidence, and secure verification.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={onSignup} className="rounded-xl bg-brand-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-950/30 transition hover:bg-brand-600" type="button">
                Report an Item
              </button>
              <button onClick={onLogin} className="rounded-xl border border-white/30 bg-slate-800/35 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/20" type="button">
                Browse Items
              </button>
            </div>

            <div className="mt-14 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/20 bg-slate-800/40 p-6 shadow-soft backdrop-blur-sm"
                >
                  <p className="text-4xl font-bold text-amber-300">{item.value}</p>
                  <p className="mt-1 text-xs tracking-wide text-slate-200">{item.label}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[11px] text-slate-300">Scroll to explore</p>
          </div>

          <div className="hero-fade" />
        </section>

        <section className="bg-slate-100 px-4 pb-24 pt-20">
          <div className="mx-auto max-w-6xl text-center">
            <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-[11px] font-semibold text-brand-600">
              Simple Process
            </span>
            <h2 className="mt-4 text-5xl font-bold text-slate-900">How It Works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-500">
              Our intelligent system makes finding lost items faster and more secure than ever before.
            </p>

            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="group relative rounded-2xl border border-slate-200/70 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <span className="absolute right-5 top-5 text-5xl font-bold text-slate-200/70">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <span
                    className={`mb-5 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-base font-bold text-white ${step.tone}`}
                  >
                    {step.icon}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-slate-100 to-amber-50/70 px-4 pb-20">
          <div className="mx-auto grid max-w-6xl gap-8 rounded-3xl bg-white p-6 shadow-soft lg:grid-cols-2 lg:p-10">
            <div className="relative overflow-hidden rounded-3xl">
              <img src={heroImage} alt="UIU campus" className="h-full min-h-[320px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
              <div className="absolute bottom-4 right-4 rounded-2xl bg-white px-5 py-3 shadow-soft">
                <p className="text-sm font-bold text-slate-900">89% Success</p>
                <p className="text-xs text-slate-500">Match rate</p>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <span className="inline-block w-fit rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-600">
                Why Us
              </span>
              <h2 className="mt-3 text-5xl font-bold text-slate-900">Why Choose CampusTrace?</h2>

              <div className="mt-6 space-y-4">
                {reasons.map((reason) => (
                  <div key={reason} className="flex items-start gap-3">
                    <span className="mt-1 h-4 w-4 rounded-full border-2 border-brand-500" />
                    <div>
                      <h3 className="font-semibold text-slate-800">{reason}</h3>
                      <p className="text-sm text-slate-500">
                        Our system is optimized for campus workflows, reducing claim friction while keeping
                        identity verification secure.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-r from-brand-500 via-amber-500 to-brand-600 px-6 py-16 text-center text-white shadow-soft">
            <div className="cta-glow" />
            <div className="relative z-10">
              <h2 className="text-5xl font-bold">Ready to Get Started?</h2>
              <p className="mx-auto mt-3 max-w-2xl text-amber-50">
                Join hundreds of UIU students who have successfully reunited with their lost items.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button onClick={onSignup} className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-600 transition hover:bg-amber-50" type="button">
                  Report Your Item Now
                </button>
                <button onClick={onLogin} className="rounded-xl border border-white/60 bg-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/30" type="button">
                  Browse Items
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
              Q
            </span>
            <span className="text-sm font-bold text-slate-800">CampusTrace</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Copyright 2026 CampusTrace - United International University. Built for students, by students.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
