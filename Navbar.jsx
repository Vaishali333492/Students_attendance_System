import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/>
          <rect x="3" y="16" width="5" height="5"/>
          <path d="M16 16h2v2h-2zM20 16h1v1h-1zM16 20h1v1h-1zM20 20h1v1h-1z"/>
        </svg>
        QR Attendance
      </Link>
      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        {!user && <>
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="nav-link">Register</Link>
        </>}
        {user?.role === 'teacher' && <>
          <Link to="/teacher/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/teacher/generate-qr" className="nav-link">Generate QR</Link>
          <Link to="/teacher/attendance" className="nav-link">Attendance</Link>
        </>}
        {user?.role === 'student' && <>
          <Link to="/student/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/student/scanner" className="nav-link">Scan QR</Link>
          <Link to="/student/attendance" className="nav-link">Attendance</Link>
        </>}
      </div>
      <div className="navbar-auth">
        {user ? (
          <div className="user-info">
            <div className="user-avatar">{user.username[0].toUpperCase()}</div>
            <div className="user-meta">
              <span className="user-name">{user.username}</span>
              <span className={`user-role role-${user.role}`}>{user.role}</span>
            </div>
            <button className="btn btn-sm btn-danger" onClick={logout}>Logout</button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
        )}
      </div>
    </nav>
  )
}
