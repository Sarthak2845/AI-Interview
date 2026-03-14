import { useState } from 'react'
import ResumeUpload from './components/ResumeUpload'
import Interview from './components/Interview'
import ViewQA from './components/ViewQA'
import TestEndpoints from './components/TestEndpoints'
import { Card, CardContent } from './components/ui/card'

function App() {
  const [currentView, setCurrentView] = useState('upload')
  const [sessionData, setSessionData] = useState(null)

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
  }

  const handleBackToUpload = () => {
    setCurrentView('upload')
    setSessionData(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
      {/* Header */}
      <header className="relative overflow-hidden bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20"></div>
        <div className="relative container mx-auto px-6 py-8 text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
              🎯 <span className="bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">Jankoti</span>
            </h1>
            <p className="text-xl text-purple-100 font-medium">
              AI-Powered Interview Platform
            </p>
            <div className="mt-4 h-1 w-24 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full mx-auto"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 animate-fade-in">
            <CardContent className="p-0">
              {currentView === 'upload' ? (
                <ResumeUpload onResumeUploaded={handleResumeUploaded} />
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