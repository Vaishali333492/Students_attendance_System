import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar/Navbar'

export default function Home() {
  const { user } = useAuth()
  return (
    <div className="home-page">
      <Navbar />
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🎓 Smart Campus Attendance</div>
          <h1>QR-Based Attendance<br /><span className="gradient-text">Real-Time &amp; Secure</span></h1>
          <p>
            Teachers generate QR codes per session (60 sec). Students scan within 50m to mark attendance.
            Supports A1–A7 classes across CE, AIDS, CSIT, IT, CSE &amp; AIML departments.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'}
                className="btn btn-primary btn-lg">Go to Dashboard →</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary btn-lg">Sign In</Link>
                <Link to="/register" className="btn btn-secondary btn-lg">Create Account</Link>
              </>
            )}
          </div>
          <div className="hero-links">
            <Link to="/login" className="hero-link">🔐 Teacher Login</Link>
            <Link to="/login" className="hero-link">🎓 Student Login</Link>
            <Link to={user ? '/student/scanner' : '/login'} className="hero-link">📷 QR Scanner</Link>
            <Link to="/register" className="hero-link">✏️ Register</Link>
          </div>
        </div>
        <div className="hero-orbs">
          <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Key Features</h2>
          <div className="features-grid">
            {[
              { icon: '⚡', title: '60-Second QR', desc: 'Auto-expires preventing proxy attendance fraud.' },
              { icon: '📍', title: '50m Geo-Lock', desc: 'Students must be physically inside the classroom.' },
              { icon: '📊', title: 'Live Analytics', desc: 'Real-time present/absent counts per class section.' },
              { icon: '🏫', title: 'A1–A7 Classes', desc: 'CE, AIDS, CSIT, IT, CSE, AIML departments.' },
              { icon: '👨‍🏫', title: 'Teacher Control', desc: 'Only teachers can generate QR sessions.' },
              { icon: '📱', title: 'Camera Scanner', desc: 'Students scan with device camera instantly.' },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
