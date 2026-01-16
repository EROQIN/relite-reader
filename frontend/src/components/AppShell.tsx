import { Link, Outlet } from 'react-router-dom'

export default function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          Relite Reader
        </Link>
        <nav className="app-nav">
          <Link to="/">Library</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
