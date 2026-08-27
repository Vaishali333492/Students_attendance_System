import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar/Navbar'

// Pages
import Home from './pages/Home/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import TeacherDashboard from './pages/Teacher/Dashboard'
import TeacherAttendance from './pages/Teacher/Attendance'
import StudentDashboard from './pages/Student/Dashboard'
import StudentScanner from './pages/Student/Scanner'

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  )
}

function TeacherApp() {
  return (
    <Layout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="generate-qr" element={<TeacherDashboard />} />
      </Routes>
    </Layout>
  )
}

function StudentApp() {
  return (
    <Layout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="scanner" element={<StudentScanner />} />
        <Route path="attendance" element={<StudentDashboard />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Teacher protected */}
        <Route path="/teacher/*" element={
          <ProtectedRoute role="teacher"><TeacherApp /></ProtectedRoute>
        } />

        {/* Student protected */}
        <Route path="/student/*" element={
          <ProtectedRoute role="student"><StudentApp /></ProtectedRoute>
        } />

        <Route path="/scan/:token?" element={<StudentScanner publicMode />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
