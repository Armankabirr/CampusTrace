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
