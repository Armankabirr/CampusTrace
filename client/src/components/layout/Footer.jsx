function Footer() {
  return (
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
  )
}

export default Footer
