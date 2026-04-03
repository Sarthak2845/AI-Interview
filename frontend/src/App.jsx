import { useState } from 'react'
import ResumeUpload from './components/ResumeUpload'
import Interview from './components/Interview'
import Analysis from './components/Analysis'
import ViewQA from './components/ViewQA'
import TestEndpoints from './components/TestEndpoints'
import Leaderboard from './components/Leaderboard'
import { Card, CardContent } from './components/ui/card'
import { Button } from './components/ui/button'
import './jankoti-theme.css'

function App() {
  const [currentView, setCurrentView] = useState('upload')
  const [sessionData, setSessionData] = useState(null)
  const [allSessions, setAllSessions] = useState([])
  const [showSessionList, setShowSessionList] = useState(false)

  // Check URL for direct navigation
  const urlParams = new URLSearchParams(window.location.search)
  const viewParam = urlParams.get('view')
  
  if (viewParam === 'qa') {
    return <ViewQA />
  }
  
  if (viewParam === 'test') {
    return <TestEndpoints />
  }

  const handleResumeUploaded = (data) => {
    setSessionData(data)
    setCurrentView('interview')
    setShowSessionList(false)
  }

  const handleBackToUpload = () => {
    setCurrentView('upload')
    setSessionData(null)
    setShowSessionList(false)
  }

  const fetchAllSessions = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/sessions/all')
      const data = await response.json()
      if (data.success) {
        setAllSessions(data.sessions)
        setShowSessionList(true)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const loadSession = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/session/${sessionId}/qa`)
      const data = await response.json()
      if (data.success) {
        // Convert to expected format
        const questions = data.questionsAndAnswers.map(qa => ({ question: qa.questionText }))
        setSessionData({
          sessionId: data.sessionId,
          questions: questions,
          difficulty: data.difficulty
        })
        setCurrentView('interview')
        setShowSessionList(false)
      }
    } catch (error) {
      console.error('Error loading session:', error)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="jankoti-fade-in">
              <div className="flex items-center space-x-4">
                <img src="https://jankoti.com/jankoti.png" alt="Jankoti" className="w-14 h-14 rounded-full object-contain bg-white p-2 shadow-md border border-gray-100" />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#462a67' }}>
                    Jankoti
                  </h1>
                  <p className="text-sm font-medium" style={{ color: '#6e727a' }}>
                    AI-Powered Interview Platform
                  </p>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setCurrentView('upload')
                  setShowSessionList(false)
                }}
                className="px-6 py-3 font-medium rounded-full transition-all duration-300 hover:shadow-lg bg-white border-2 hover:bg-gray-50"
                style={{ color: '#462a67', borderColor: '#462a67' }}
              >
                <span className="mr-2">📄</span>
                New Interview
              </Button>
              <Button
                onClick={fetchAllSessions}
                className="px-6 py-3 text-white font-medium rounded-full transition-all duration-300 hover:shadow-lg"
                style={{ background: '#462a67' }}
              >
                <span className="mr-2">📊</span>
                My Sessions
              </Button>
              <Button
                onClick={() => {
                  setCurrentView('leaderboard')
                  setShowSessionList(false)
                }}
                className="px-6 py-3 font-medium rounded-full transition-all duration-300 hover:shadow-lg bg-white border-2 hover:bg-gray-50"
                style={{ color: '#462a67', borderColor: '#462a67' }}
              >
                <span className="mr-2">🏆</span>
                Leaderboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-0 shadow-xl rounded-2xl jankoti-fade-in" style={{ background: '#f2edfa' }}>
            <CardContent className="p-0">
              {showSessionList ? (
                <div className="p-10">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#462a67' }}>
                      <span className="text-3xl text-white">📊</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-2" style={{ color: '#462a67' }}>Your Interview Sessions</h2>
                    <p className="text-lg" style={{ color: '#6e727a' }}>Continue where you left off or review your performance</p>
                  </div>
                  
                  {allSessions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-gray-100">
                        <span className="text-4xl">📁</span>
                      </div>
                      <h3 className="text-2xl font-semibold mb-2" style={{ color: '#462a67' }}>No Sessions Yet</h3>
                      <p className="text-lg mb-6" style={{ color: '#6e727a' }}>Start your first interview by uploading a resume</p>
                      <Button
                        onClick={() => setShowSessionList(false)}
                        className="px-8 py-4 text-lg font-semibold rounded-full text-white transition-all duration-300 hover:shadow-lg"
                        style={{ background: '#462a67' }}
                      >
                        <span className="mr-2">🚀</span>
                        Upload Resume
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {allSessions.map((session) => (
                        <Card key={session.sessionId} className="bg-white border-0 hover:shadow-lg transition-all duration-300 rounded-2xl">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#462a67' }}>
                                    <span className="text-lg text-white">📄</span>
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold" style={{ color: '#462a67' }}>
                                      {session.fileName || session.resumeText}
                                    </h3>
                                    <div className="flex items-center space-x-4 text-sm" style={{ color: '#6e727a' }}>
                                      <span className="px-3 py-1 rounded-full capitalize" style={{ background: '#f2edfa', color: '#462a67' }}>
                                        🎯 {session.difficulty}
                                      </span>
                                      <span>📊 {session.answeredQuestions}/{session.totalQuestions} answered</span>
                                      <span>📅 {new Date(session.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex-1 h-2 rounded-full" style={{ background: '#f2edfa' }}>
                                      <div 
                                        className="h-2 rounded-full transition-all duration-500"
                                        style={{ 
                                          width: `${session.completionPercentage}%`,
                                          background: '#462a67'
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: '#462a67' }}>
                                      {session.completionPercentage}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-3 ml-6">
                                <Button
                                  onClick={() => loadSession(session.sessionId)}
                                  className="px-6 py-3 rounded-full font-medium transition-all duration-300 bg-white border-2 hover:shadow-md"
                                  style={{ color: '#462a67', borderColor: '#462a67' }}
                                >
                                  Continue
                                </Button>
                                {session.completionPercentage === 100 && (
                                  <Button
                                    onClick={() => {
                                      setSessionData({ sessionId: session.sessionId })
                                      setCurrentView('analysis')
                                      setShowSessionList(false)
                                    }}
                                    className="px-6 py-3 rounded-full font-medium text-white transition-all duration-300 hover:shadow-md"
                                    style={{ background: '#6f9ca8' }}
                                  >
                                    {session.isAnalyzed ? 'View Analysis' : 'Generate Analysis'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : currentView === 'upload' ? (
                <ResumeUpload onResumeUploaded={handleResumeUploaded} />
              ) : currentView === 'analysis' ? (
                <Analysis 
                  sessionId={sessionData?.sessionId} 
                  onBack={() => setCurrentView('upload')}
                />
              ) : currentView === 'leaderboard' ? (
                <Leaderboard onBack={() => setCurrentView('upload')} />
              ) : (
                <Interview 
                  sessionData={sessionData} 
                  onBack={handleBackToUpload}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default App