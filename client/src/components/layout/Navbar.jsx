function Navbar({
  authUser,
  activePage = 'home',
  onHome,
  onBrowse,
  onMatches,
  onLogin,
  onSignup,
  onAvatarClick,
  onReportItem,
  unreadNotifications = 0,
  onNotificationClick,
}) {
  const userInitial = authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'U'

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-white/60 bg-white/90 px-4 py-3 shadow-soft backdrop-blur">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2 text-left transition hover:opacity-90"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
            Q
          </span>
          <div>
            <p className="text-sm font-bold leading-none">CampusTrace</p>
            <p className="text-[11px] text-slate-500">UIU Lost and Found</p>
          </div>
        </button>

        <div className="hidden items-center gap-2 rounded-full bg-slate-100 p-1 text-sm text-slate-500 lg:flex">
          <button
            className={`rounded-full px-4 py-1.5 transition ${activePage === 'home' ? 'bg-white text-brand-600 shadow' : 'hover:bg-white'}`}
            onClick={onHome}
            type="button"
          >
            Home
          </button>
          <button className="rounded-full px-4 py-1.5 transition hover:bg-white" onClick={onBrowse} type="button">
            Browse
          </button>
          <button className="rounded-full px-4 py-1.5 transition hover:bg-white" onClick={onMatches} type="button">
            Matches
          </button>
        </div>

        <div className="flex items-center gap-2">
          {authUser ? (
            <>
              {onNotificationClick && (
                <button
                  type="button"
                  onClick={onNotificationClick}
                  title="Notifications"
                  className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white transition hover:border-brand-300 hover:bg-slate-50"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={onReportItem}
                className="hidden rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 md:block"
              >
                + Report Item
              </button>
              <button
                type="button"
                onClick={onAvatarClick}
                title={authUser.name || 'User profile'}
                className="grid h-10 w-10 place-items-center rounded-full border border-orange-100 bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {userInitial}
              </button>
            </>
          ) : (
            <>
              <button
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-700 md:block"
                onClick={onLogin}
                type="button"
              >
                Sign In
              </button>
              <button
                className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
                onClick={onSignup}
                type="button"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
