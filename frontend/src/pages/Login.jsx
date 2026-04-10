import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi'
import logo from '../assets/Logo.png'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'
const API = import.meta.env.VITE_BACKEND_URL

export default function Login() {
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState({})
  const navigate = useNavigate();
  const { login } = useAuth()
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!validate()) return
  setError({})
  setLoading(true)

  const res = await login(form)

  if (res.success) {
    navigate('/interview')
  } else {
    setError(prev => ({
      ...prev,
      api: res.message
    }))
  }

  setLoading(false)
}
  const validate = () => {
    const newError = {}
    if (!form.email.trim()) {
      newError.email = 'Email is required'
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newError.email = 'Email is invalid'
    }
    if (!form.password) {
      newError.password = 'Password is required'
    }
    setError(newError)
    return Object.keys(newError).length === 0
  }
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-purple-50 to-indigo-100">

      {/* ── Left panel (decorative) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden
                      bg-gradient-to-br from-violet-600 to-fuchsia-500 p-12 flex-col justify-center">
        {/* blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-white/10 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl translate-x-1/3 translate-y-1/3" />

        <Link to="/" className="relative flex items-center gap-2">
          <img src={logo} alt="Jankoti" className="h-16 w-auto " />
        </Link>

        <div className="relative">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Land your dream job<br />with AI-powered prep
          </h2>
          <p className="text-white/70 leading-relaxed max-w-sm">
            Upload your resume, get personalized questions, and practice until you're ready to impress.
          </p>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <img src={logo} alt="Jankoti" className="h-8 w-auto" />
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-800 mt-1.5">Sign in to continue your interview prep</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {
              error.api && (
                <div className="w-full text-center text-white bg-red-500 py-2 rounded-md">
                  {error.api}
                </div>
              )
            }
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <div className="relative">
                <FiMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" required placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white
                             text-sm text-gray-900 placeholder-gray-400
                             focus:outline-none transition-all duration-150"
                />
              </div>
              {error.email && <p className="text-xs text-red-600">{error.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <a href="#" className="text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={show ? 'text' : 'password'} required placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full pl-11 pr-12 py-3 rounded-2xl bg-white
                             text-sm text-gray-900 placeholder-gray-400
                             focus:outline-none"
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {error.password && <p className="text-xs text-red-600">{error.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl
                               text-sm font-bold text-white mt-2
                               bg-gradient-to-r from-violet-600 to-fuchsia-500
                               shadow-[0_6px_20px_rgba(109,40,217,0.4)]
                               hover:shadow-[0_8px_28px_rgba(109,40,217,0.5)]
                               hover:scale-[1.02] active:scale-95
                               disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
                               transition-all duration-200">
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <> Sign In <FiArrowRight size={14} /> </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-800 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-violet-600 font-semibold hover:text-violet-700 transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
