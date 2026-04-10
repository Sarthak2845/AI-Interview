import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiMenu, FiX, FiZap } from 'react-icons/fi'
import logo from '../assets/Logo.png'

const NAV_LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'Features',     href: '#features' },
  { label: 'Leaderboard',  href: '/leaderboard' },
]

export default function Navbar() {
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex flex-col items-center px-4 pt-4">
      <nav className={`w-full max-w-5xl flex items-center justify-between px-5 py-2.5
                       rounded-2xl border transition-all duration-300
                       ${scrolled
                         ? 'bg-white/95 backdrop-blur-xl border-violet-100 shadow-xl shadow-violet-200/30'
                         : 'bg-white/75 backdrop-blur-md border-white/60 shadow-md'}`}>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="Jankoti" className="h-8 w-auto" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href}
               className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500
                          hover:text-violet-700 hover:bg-violet-50 transition-all duration-150">
              {label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/login"
                className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-xl
                           hover:text-violet-700 hover:bg-violet-50 transition-all duration-150">
            Log in
          </Link>
          <Link to="/interview"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white
                           bg-gradient-to-r from-violet-600 to-fuchsia-500
                           shadow-[0_4px_14px_rgba(109,40,217,0.4)]
                           hover:shadow-[0_6px_20px_rgba(109,40,217,0.55)]
                           hover:scale-[1.03] active:scale-95 transition-all duration-150">
            <FiZap size={13} /> Start Interview
          </Link>
        </div>

        {/* Hamburger */}
        <button onClick={() => setOpen(o => !o)} aria-label="Toggle menu"
                className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-violet-50
                           hover:text-violet-700 transition-colors">
          {open ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`md:hidden w-full max-w-5xl transition-all duration-300 ease-in-out overflow-hidden
                       ${open ? 'max-h-80 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl p-3 flex flex-col gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} onClick={() => setOpen(false)}
               className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600
                          hover:bg-violet-50 hover:text-violet-700 transition-colors">
              {label}
            </a>
          ))}
          <div className="h-px bg-gray-100 my-1" />
          <Link to="/login" onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Log in
          </Link>
          <Link to="/interview" onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                           text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-500">
            <FiZap size={13} /> Start Interview
          </Link>
        </div>
      </div>
    </header>
  )
}
