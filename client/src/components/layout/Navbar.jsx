function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-white/60 bg-white/90 px-4 py-3 shadow-soft backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
            Q
          </span>
          <div>
            <p className="text-sm font-bold leading-none">CampusTrace</p>
            <p className="text-[11px] text-slate-500">UIU Lost and Found</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full bg-slate-100 p-1 text-sm text-slate-500 lg:flex">
          <button className="rounded-full bg-white px-4 py-1.5 text-brand-600 shadow" type="button">
            Home
          </button>
          <button className="rounded-full px-4 py-1.5 transition hover:bg-white" type="button">
            Browse
          </button>
          <button className="rounded-full px-4 py-1.5 transition hover:bg-white" type="button">
            Matches
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-700 md:block" type="button">
            Sign In
          </button>
          <button className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600" type="button">
            Get Started
          </button>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
