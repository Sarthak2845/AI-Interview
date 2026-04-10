import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const API = import.meta.env.VITE_BACKEND_URL

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      })
      setUser(res.data.user)
    } catch (err) {
      setUser(null)
      console.log('Fetch user error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const login = async (form) => {
    try {
      const res = await axios.post(`${API}/auth/login`, form, {
        withCredentials: true
      })

      setUser(res.data.user)
      return { success: true }

    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed'
      }
    }
  }

  const signup = async (form) => {
    try {
      const res = await axios.post(`${API}/auth/signup`, form, {
        withCredentials: true
      })

      return { success: true }

    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Signup failed'
      }
    }
  }

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        withCredentials: true
      })
      setUser(null)
    } catch (err) {
      console.log('Logout error:', err)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        fetchUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// 🔹 Custom hook
export const useAuth = () => useContext(AuthContext)