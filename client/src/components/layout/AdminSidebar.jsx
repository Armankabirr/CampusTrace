const navigationItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'user-management', label: 'User Management' },
  { id: 'reports', label: 'Report Management' },
  { id: 'matches', label: 'Matches' },
  { id: 'claims', label: 'Claims' },
  { id: 'reviews', label: 'Reviews & Feedback' },
  { id: 'notifications', label: 'Notifications' },
]

function AdminSidebar({ activeItemId = 'overview', onNavigate, theme, onSignOut }) {
  return (
    <aside className='w-64 bg-slate-950 p-6 hidden md:block h-screen'>
      <div className='flex items-center justify-between'>
        <div className='text-lg font-bold'>CampusTrace</div>
      </div>
      <nav className='mt-8 space-y-1'>
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md ${activeItemId === item.id ? 'bg-indigo-600/30 text-white' : 'text-gray-300 hover:bg-slate-800/40'}`}
          >
            <span className='w-2 h-2 rounded-full bg-indigo-400' />
            <span className='flex-1'>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className='mt-8 text-xs text-gray-400'>Admin</div>
      {onSignOut ? (
        <button
          onClick={onSignOut}
          className='mt-6 w-full rounded-md bg-rose-600/90 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-600'
        >
          Sign Out
        </button>
      ) : null}
    </aside>
  )
}

export default AdminSidebar
