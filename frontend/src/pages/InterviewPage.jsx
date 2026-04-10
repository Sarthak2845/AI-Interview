import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiLogOut, FiUser, FiHome } from 'react-icons/fi'
import ResumeUpload from '../components/ResumeUpload'
import Interview from '../components/Interview'
import Analysis from '../components/Analysis'
import { useAuth } from '../context/authContext'
import logo from '../assets/Logo.png'

const STEPS = ['Upload', 'Interview', 'Analysis']

export default function InterviewPage() {
  const { user, logout } = useAuth()
  const [step, setStep]             = useState(0) // 0=upload, 1=interview, 2=analysis
  const [sessionData, setSessionData] = useState(null)

  const handleResumeUploaded = (data) => {
    setSessionData(data)
    setStep(1)
  }

  const handleInterviewComplete = () => {
    setStep(2)
  }

  const handleReset = () => {
    setSessionData(null)
    setStep(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/40 to-fuchsia-50/30">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Jankoti" className="h-7 w-auto" />
          </Link>

          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all
                  ${i === step
                    ? 'bg-violet-600 text-white'
                    : i < step
                    ? 'bg-violet-100 text-violet-600'
                    : 'bg-gray-100 text-gray-400'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black
                    ${i === step ? 'bg-white/30' : i < step ? 'bg-violet-200' : 'bg-gray-200'}`}>
                    {i < step ? '✓' : i + 1}
                  </span>
                  {label}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px ${i < step ? 'bg-violet-300' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200">
              <FiUser size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-600">{user?.name || user?.email}</span>
            </div>
            <Link to="/" className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
              <FiHome size={16} />
            </Link>
            <button onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                               text-red-500 hover:bg-red-50 transition-colors">
              <FiLogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {step === 0 && (
          <ResumeUpload onResumeUploaded={handleResumeUploaded} />
        )}
        {step === 1 && (
          <Interview
            sessionData={sessionData}
            onBack={handleReset}
            onComplete={handleInterviewComplete}
          />
        )}
        {step === 2 && (
          <Analysis
            sessionId={sessionData?.sessionId}
            onBack={() => setStep(1)}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  )
}
