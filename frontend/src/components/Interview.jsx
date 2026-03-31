import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import Analysis from './Analysis'

const Interview = ({ sessionData, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timeSpent, setTimeSpent] = useState({})
  const [startTime, setStartTime] = useState(Date.now())
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [savedAnswers, setSavedAnswers] = useState(new Set())
  
  const textareaRef = useRef(null)

  const questions = sessionData?.questions || []
  const atsQuality = sessionData?.ats_quality || {}
  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (currentAnswer.trim() && !savedAnswers.has(currentQuestionIndex)) {
        handleAutoSave()
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [currentAnswer, currentQuestionIndex])

  // Track time spent on each question
  useEffect(() => {
    setStartTime(Date.now())
    return () => {
      const timeOnQuestion = Date.now() - startTime
      setTimeSpent(prev => ({
        ...prev,
        [currentQuestionIndex]: (prev[currentQuestionIndex] || 0) + timeOnQuestion
      }))
    }
  }, [currentQuestionIndex])

  const handleAutoSave = async () => {
    if (!currentAnswer.trim()) return

    try {
      const response = await fetch('http://localhost:8080/api/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          questionIndex: currentQuestionIndex,
          answer: currentAnswer,
          isAutoSave: true
        }),
      })

      if (response.ok) {
        setSavedAnswers(prev => new Set([...prev, currentQuestionIndex]))
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }

  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim()) {
      textareaRef.current?.focus()
      return
    }

    setLoading(true)
    
    try {
      const timeOnQuestion = Date.now() - startTime
      const wordCount = currentAnswer.trim().split(/\s+/).length
      const response = await fetch('http://localhost:8080/api/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          questionIndex: currentQuestionIndex,
          answer: currentAnswer,
          timeSpent: timeOnQuestion,
          wordCount: wordCount
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Save answer locally
        setAnswers(prev => ({
          ...prev,
          [currentQuestionIndex]: currentAnswer
        }))

        setSavedAnswers(prev => new Set([...prev, currentQuestionIndex]))

        // Move to next question or complete
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1)
          setCurrentAnswer('')
        } else {
          setIsCompleted(true)
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setCurrentAnswer(answers[currentQuestionIndex - 1] || '')
    }
  }

  const handleSkipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setCurrentAnswer('')
    }
  }

  const getATSScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getATSScoreBackground = (score) => {
    if (score >= 80) return 'from-green-500 to-green-600'
    if (score >= 60) return 'from-yellow-500 to-yellow-600'
    return 'from-red-500 to-red-600'
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAnswerQuality = (answer) => {
    const wordCount = answer.trim().split(/\s+/).length
    if (wordCount < 20) return { quality: 'Too Short', color: 'text-red-500', bg: 'bg-red-50' }
    if (wordCount < 50) return { quality: 'Brief', color: 'text-yellow-500', bg: 'bg-yellow-50' }
    if (wordCount < 100) return { quality: 'Good', color: 'text-green-500', bg: 'bg-green-50' }
    return { quality: 'Detailed', color: 'text-blue-500', bg: 'bg-blue-50' }
  }

  if (showAnalysis) {
    return <Analysis sessionId={sessionData.sessionId} onBack={() => setShowAnalysis(false)} />
  }

  if (isCompleted) {
    const totalTime = Object.values(timeSpent).reduce((sum, time) => sum + time, 0)
    const avgTimePerQuestion = totalTime / questions.length
    const answeredCount = Object.keys(answers).length

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <div className="text-8xl mb-8">🎉</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Interview Completed Successfully!
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Congratulations! You've completed the interview with {answeredCount} out of {questions.length} questions answered.
            </p>
            
            {/* Interview Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-3">
                    {answeredCount}/{questions.length}
                  </div>
                  <div className="text-lg font-medium text-gray-600">Questions Answered</div>
                  <div className="mt-4">
                    <Progress value={(answeredCount / questions.length) * 100} className="h-3" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-3">
                    {formatTime(Math.floor(totalTime / 1000))}
                  </div>
                  <div className="text-lg font-medium text-gray-600">Total Time</div>
                  <div className="text-sm text-gray-500 mt-2">
                    Avg: {formatTime(Math.floor(avgTimePerQuestion / 1000))} per question
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl font-bold text-green-600 mb-3 capitalize">
                    {sessionData.difficulty}
                  </div>
                  <div className="text-lg font-medium text-gray-600">Difficulty Level</div>
                  <div className="text-sm text-gray-500 mt-2">
                    {questions.length} questions total
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* ATS Score Summary */}
            {atsQuality.score && (
              <Card className="max-w-md mx-auto mb-12 border-0 shadow-xl bg-gradient-to-r from-purple-50 to-indigo-50">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="text-xl">Resume ATS Score</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className={`text-5xl font-bold mb-4 ${getATSScoreColor(atsQuality.score)}`}>
                      {atsQuality.score}/100
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-lg px-4 py-2 bg-gradient-to-r ${getATSScoreBackground(atsQuality.score)} text-white`}
                    >
                      {atsQuality.rating}
                    </Badge>
                    <Progress value={atsQuality.score} className="mt-6 h-3" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-6">
              <Button
                onClick={() => setShowAnalysis(true)}
                size="lg"
                className="px-8 py-4 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
              >
                <span className="mr-2 text-xl">📊</span>
                Generate Performance Analysis
              </Button>
              <Button
                onClick={onBack}
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg border-2 border-gray-300 hover:border-gray-400"
              >
                <span className="mr-2">📄</span>
                Upload Another Resume
              </Button>
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                className="px-8 py-4 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
              >
                <span className="mr-2">🚀</span>
                Start New Interview
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const answerQuality = getAnswerQuality(currentAnswer)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Progress */}
        <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Interview Session</h2>
                <div className="flex items-center space-x-6 text-gray-600">
                  <span className="text-lg font-medium">Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <Badge variant="secondary" className="capitalize text-lg px-3 py-1">
                    {sessionData.difficulty}
                  </Badge>
                  {savedAnswers.has(currentQuestionIndex) && (
                    <Badge variant="outline" className="text-green-600 border-green-300 text-lg px-3 py-1">
                      ✓ Saved
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* ATS Score Display */}
              {atsQuality.score && (
                <Card className="border border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">ATS Score</div>
                    <div className={`text-3xl font-bold ${getATSScoreColor(atsQuality.score)}`}>
                      {atsQuality.score}/100
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs bg-gradient-to-r ${getATSScoreBackground(atsQuality.score)} text-white`}
                    >
                      {atsQuality.rating}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <Progress value={progress} className="h-4 mb-4" />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Progress: {Math.round(progress)}%</span>
              <span>{questions.length - currentQuestionIndex - 1} remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        {currentQuestion && (
          <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-slide-in">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-white border-white/30 bg-white/10">
                  Question {currentQuestionIndex + 1}
                </Badge>
              </div>
              <CardTitle className="text-2xl leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {/* Answer Input */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here... Be specific and provide examples from your experience."
                  className="w-full h-48 p-6 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg leading-relaxed"
                  disabled={loading}
                />
              </div>

              {/* Answer Statistics */}
              <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-6 text-sm">
                  <span className="text-gray-600 font-medium">
                    {currentAnswer.length} characters • {currentAnswer.trim().split(/\s+/).filter(word => word.length > 0).length} words
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`${answerQuality.color} ${answerQuality.bg} border-current font-medium`}
                  >
                    {answerQuality.quality}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  💡 Aim for 50-150 words for detailed answers
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* ATS Suggestions */}
      {atsQuality.suggestions && atsQuality.suggestions.length > 0 && currentQuestionIndex === 0 && (
        <Card className="mb-6 border border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800 flex items-center">
              💡 Resume Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {atsQuality.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-yellow-700 flex items-start">
                  <span className="mr-2">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-4">
            <Button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              size="lg"
              className="px-6 py-3"
            >
              ← Previous
            </Button>
            <Button
              onClick={handleSkipQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              variant="ghost"
              size="lg"
              className="text-gray-500 px-6 py-3"
            >
              Skip Question
            </Button>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
              className="px-6 py-3"
            >
              Back to Upload
            </Button>
            
            <Button
              onClick={handleAnswerSubmit}
              disabled={!currentAnswer.trim() || loading}
              size="lg"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </div>
              ) : currentQuestionIndex === questions.length - 1 ? (
                'Complete Interview'
              ) : (
                'Submit & Next →'
              )}
            </Button>
          </div>
        </div>

        {/* Question Overview */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Question Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold cursor-pointer transition-all transform hover:scale-105 ${
                    index === currentQuestionIndex
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white ring-4 ring-purple-300 shadow-lg'
                      : answers[index]
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                      : savedAnswers.has(index)
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300 shadow-sm'
                  }`}
                  onClick={() => {
                    setCurrentQuestionIndex(index)
                    setCurrentAnswer(answers[index] || '')
                  }}
                  title={`Question ${index + 1}${answers[index] ? ' (Answered)' : savedAnswers.has(index) ? ' (Saved)' : ''}`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center space-x-8 mt-6 text-sm font-medium">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                <span>Submitted</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
                <span>Auto-saved</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                <span>Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Interview