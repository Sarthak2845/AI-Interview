import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'

const Interview = ({ sessionData, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timeSpent, setTimeSpent] = useState({})
  const [startTime, setStartTime] = useState(Date.now())
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

  if (isCompleted) {
    const totalTime = Object.values(timeSpent).reduce((sum, time) => sum + time, 0)
    const avgTimePerQuestion = totalTime / questions.length
    const answeredCount = Object.keys(answers).length

    return (
      <div className="p-8 text-center">
        <div className="animate-fade-in">
          <div className="text-6xl mb-6">🎉</div>
          <CardTitle className="text-3xl font-bold text-gray-800 mb-4">
            Interview Completed Successfully!
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 mb-8">
            You've completed the interview with {answeredCount} out of {questions.length} questions answered.
          </CardDescription>
          
          {/* Interview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {answeredCount}/{questions.length}
                </div>
                <div className="text-sm text-gray-600">Questions Answered</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {formatTime(Math.floor(totalTime / 1000))}
                </div>
                <div className="text-sm text-gray-600">Total Time</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {formatTime(Math.floor(avgTimePerQuestion / 1000))}
                </div>
                <div className="text-sm text-gray-600">Avg per Question</div>
              </CardContent>
            </Card>
          </div>
          
          {/* ATS Score Summary */}
          {atsQuality.score && (
            <Card className="max-w-md mx-auto mb-8 border border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl">Resume ATS Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getATSScoreColor(atsQuality.score)}`}>
                    {atsQuality.score}/100
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`bg-gradient-to-r ${getATSScoreBackground(atsQuality.score)} text-white`}
                  >
                    {atsQuality.rating}
                  </Badge>
                  <Progress value={atsQuality.score} className="mt-4" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="mr-4"
            >
              Upload Another Resume
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              Start New Interview
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const answerQuality = getAnswerQuality(currentAnswer)

  return (
    <div className="p-8">
      {/* Header with Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Interview Session</h2>
            <div className="flex items-center space-x-4 text-gray-600">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <Badge variant="secondary" className="capitalize">
                {sessionData.difficulty}
              </Badge>
              {savedAnswers.has(currentQuestionIndex) && (
                <Badge variant="outline" className="text-green-600 border-green-300">
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
                <div className={`text-2xl font-bold ${getATSScoreColor(atsQuality.score)}`}>
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
        
        <Progress value={progress} className="h-3" />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>Progress: {Math.round(progress)}%</span>
          <span>{questions.length - currentQuestionIndex - 1} remaining</span>
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <Card className="mb-6 border-l-4 border-l-purple-500 animate-slide-in">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-purple-700 border-purple-300">
                Question {currentQuestionIndex + 1}
              </Badge>
            </div>
            <CardTitle className="text-xl leading-relaxed text-gray-800">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Answer Input */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here... Be specific and provide examples from your experience."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Answer Statistics */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-500">
                  {currentAnswer.length} characters • {currentAnswer.trim().split(/\s+/).filter(word => word.length > 0).length} words
                </span>
                <Badge 
                  variant="outline" 
                  className={`${answerQuality.color} ${answerQuality.bg} border-current`}
                >
                  {answerQuality.quality}
                </Badge>
              </div>
              <div className="text-sm text-gray-500">
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <Button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            ← Previous
          </Button>
          <Button
            onClick={handleSkipQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            variant="ghost"
            className="text-gray-500"
          >
            Skip Question
          </Button>
        </div>

        <div className="flex space-x-4">
          <Button
            onClick={onBack}
            variant="outline"
          >
            Back to Upload
          </Button>
          
          <Button
            onClick={handleAnswerSubmit}
            disabled={!currentAnswer.trim() || loading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Question Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer transition-all ${
                  index === currentQuestionIndex
                    ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                    : answers[index]
                    ? 'bg-green-500 text-white'
                    : savedAnswers.has(index)
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
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
          <div className="flex items-center space-x-6 mt-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Submitted</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Auto-saved</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              <span>Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Interview