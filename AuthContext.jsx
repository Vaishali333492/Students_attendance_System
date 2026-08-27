import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // On mount, restore user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.clear() }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const res = await api.post('/accounts/login/', { username, password })
    const data = res.data
    // Store token and full user object
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    const userObj = {
      id: data.id,
      username: data.username,
      role: data.role,
    }
    localStorage.setItem('user', JSON.stringify(userObj))
    setUser(userObj)
    const nextPath = new URLSearchParams(window.location.search).get('next')

    // Role-based redirect
    if (nextPath) navigate(nextPath, { replace: true })
    else if (data.role === 'teacher') navigate('/teacher/dashboard', { replace: true })
    else navigate('/student/dashboard', { replace: true })
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
