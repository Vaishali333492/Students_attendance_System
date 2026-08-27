import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { FaStar } from "react-icons/fa";
export default function StudentDashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSummary = async () => {
    try {
      const res = await api.get(`/student/summary/${user.id}/`)
      setSummary(res.data)
    } catch {
      setError('Failed to load attendance data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchSummary()
      const poll = setInterval(fetchSummary, 8000) // real-time poll every 8s
      return () => clearInterval(poll)
    }
  }, [user])

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>
  if (error) return <div className="alert alert-error" style={{ margin: 32 }}>{error}</div>
  if (!summary) return null

  const { student, attendance } = summary

  return (
    <div className="dashboard-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Glassmorphism Premium Header */}
      <div className="glass-card" style={{ padding: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.2)' }}>
        <div>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '11px', fontWeight: 700, color: '#8b5cf6', display: 'block', marginBottom: '6px' }}>Student Profile Dashboard</span>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, var(--muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{student.username}</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span>Roll: <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{student.roll_number}</strong></span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(25, 207, 235, 0.2)' }} />
            <span>Dept: <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{student.department}</strong></span>
          </p>
        </div>
        <Link to="/student/scanner" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', boxShadow: 'var(--glow)', transition: 'all 0.2s', textDecoration: 'none' }}>
          📷 Open Live Scanner
        </Link>
      </div>
      <div
  className="glass-card"
  style={{
    padding: "20px",
    marginBottom: "20px",
    textAlign: "center",
  }}
>
  <h2>Teacher Rating</h2>

  <div
    style={{
      display: "flex",
      justifyContent: "center",
      gap: "8px",
      marginTop: "10px",
    }}
  >
    {[1, 2, 3, 4, 5].map((star) => (
      <FaStar
        key={star}
        size={35}
        color={star <= 4 ? "#FFD700" : "#555"}
      />
    ))}
  </div>

  <p
    style={{
      marginTop: "10px",
      color: "#ccc",
      fontWeight: "bold",
    }}
  >
    4 / 5 Rating
  </p>
</div>
      {/* Overall Attendance Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ transition: 'transform 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 54, 74, 0.15)', color: '#10b981' }}>✓</div>
          <div className="stat-val">{attendance.daily}</div>
          <div className="stat-lbl">Today</div>
        </div>
        <div className="stat-card" style={{ transition: 'transform 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,.15)', color: '#6366f1' }}>📅</div>
          <div className="stat-val">{attendance.weekly}</div>
          <div className="stat-lbl">This Week</div>
        </div>
        <div className="stat-card" style={{ transition: 'transform 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,.15)', color: '#06b6d4' }}>📈</div>
          <div className="stat-val">{attendance.monthly}</div>
          <div className="stat-lbl">This Month</div>
        </div>
        <div className="stat-card" style={{ transition: 'transform 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,.15)', color: '#8b5cf6' }}>📚</div>
          <div className="stat-val">{student.classes.length}</div>
          <div className="stat-lbl">Subjects</div>
        </div>
      </div>

      {/* Scan CTA */}
      <div className="scan-cta glass-card">
        <div>
          <h2>Ready to mark attendance?</h2>
          <p>Ask your teacher to generate a QR code and scan it within 60 seconds.</p>
          <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px' }}>📍 50m geo-restriction applies</small>
        </div>
        <Link to="/student/scanner" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>Open Scanner →</Link>
      </div>

      {/* Recent Attendance Activity Log */}
      <div>
        <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 700 }}>Recent Attendance Activity</h2>
        {(!summary.recent_records || summary.recent_records.length === 0) ? (
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
            No attendance records found for this month yet.
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {summary.recent_records.map((rec, index) => {
              const dateStr = new Date(rec.timestamp).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })
              return (
                <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: index === summary.recent_records.length - 1 ? 0 : '14px', borderBottom: index === summary.recent_records.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{rec.subject_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Code: {rec.subject_code}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                      ✓ PRESENT
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>{dateStr}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Real Per-Subject Monthly Attendance */}
      <div>
        <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 700 }}>Subject-wise Attendance (This Month)</h2>
        {student.classes.length === 0 ? (
          <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
            You are not enrolled in any class yet. Contact your teacher or admin.
          </div>
        ) : (
          <div className="class-grid">
            {student.classes.map((cls) => {
              const att = cls.attendance
              const pct = att.percentage
              const fill = pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'
              const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e'
              const statusMsg = pct >= 75
                ? '✓ Attendance is Good'
                : pct >= 50
                ? '⚠ Attendance Low'
                : att.total_sessions === 0
                ? '📭 No sessions held yet'
                : '✗ Critical – Attend Classes!'

              return (
                <div key={cls.id} className="class-card" style={{ transition: 'transform 0.2s' }}>
                  <div className="class-card-top">
                    <div className="class-code">{cls.code}</div>
                    <span style={{ fontSize: '22px', fontWeight: 900, color }}>
                      {att.total_sessions > 0 ? `${pct}%` : 'N/A'}
                    </span>
                  </div>
                  <h3 className="class-name">{cls.name}</h3>
                  <div className="class-stats">
                    <div className="class-stat">
                      <span className="cs-val">{att.daily}</span>
                      <span>Today</span>
                    </div>
                    <div className="class-stat">
                      <span className="cs-val">{att.weekly}</span>
                      <span>Week</span>
                    </div>
                    <div className="class-stat">
                      <span className="cs-val">{att.monthly}</span>
                      <span>Month</span>
                    </div>
                    <div className="class-stat">
                      <span className="cs-val">{att.total_sessions}</span>
                      <span>Sessions</span>
                    </div>
                  </div>
                  <div className="progress-bar" style={{ marginTop: '12px' }}>
                    <div className={`progress-fill ${fill}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: '12px', color, marginTop: '8px', fontWeight: 600 }}>
                    {statusMsg}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
