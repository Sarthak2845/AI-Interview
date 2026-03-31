import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'

const Analysis = ({ sessionId, onBack }) => {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sessionData, setSessionData] = useState(null)

  useEffect(() => {
    fetchAnalysis()
    fetchSessionData()
  }, [sessionId])

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/session/${sessionId}/qa`)
      const data = await response.json()
      if (data.success) {
        setSessionData(data)
      }
    } catch (error) {
      console.error('Error fetching session data:', error)
    }
  }

  const fetchAnalysis = async () => {
    try {
      // First check if analysis already exists
      const existingResponse = await fetch(`http://localhost:8080/api/analysis/${sessionId}`)
      
      if (existingResponse.ok) {
        const existingData = await existingResponse.json()
        if (existingData.success) {
          setAnalysis(existingData.analysis)
          setLoading(false)
          return
        }
      }

      // If no existing analysis, check if we can generate one
      const statusResponse = await fetch(`http://localhost:8080/api/analysis-status/${sessionId}`)
      const statusData = await statusResponse.json()
      
      if (!statusData.success || !statusData.canAnalyze) {
        setError('Cannot generate analysis. Complete the interview first.')
        setLoading(false)
        return
      }

      // Generate new analysis only if user explicitly requests it
      // This will be called when user clicks "Generate Analysis" button
      setError('Analysis not found. Click "Generate Analysis" to create one.')
      setLoading(false)
      
    } catch (error) {
      setError('Network error. Please ensure the backend is running.')
      console.error('Analysis fetch error:', error)
      setLoading(false)
    }
  }

  const generateNewAnalysis = async () => {
    setLoading(true)
    setError('')
    
    try {
      const generateResponse = await fetch(`http://localhost:8080/api/analyze/${sessionId}`, {
        method: 'POST'
      })
      
      const data = await generateResponse.json()
      
      if (data.success) {
        setAnalysis(data.analysis)
      } else {
        setError(data.error || 'Failed to generate analysis')
      }
    } catch (error) {
      setError('Network error. Please ensure the backend is running.')
      console.error('Analysis generation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const decodeHtmlEntities = (text) => {
    if (!text) return text
    const textarea = document.createElement('textarea')
    textarea.innerHTML = text
    return textarea.value
  }

  const cleanAnalysisText = (text) => {
    if (!text) return text
    
    // Decode HTML entities
    let cleaned = decodeHtmlEntities(text)
    
    // Remove JSON code blocks
    cleaned = cleaned.replace(/```json[\s\S]*?```/g, '')
    
    // Remove extra markdown formatting
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1')
    
    // Clean up multiple newlines
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n')
    
    // Remove leading/trailing whitespace
    cleaned = cleaned.trim()
    
    return cleaned
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBackground = (score) => {
    if (score >= 80) return 'from-green-500 to-green-600'
    if (score >= 60) return 'from-blue-500 to-blue-600'
    if (score >= 40) return 'from-yellow-500 to-yellow-600'
    return 'from-red-500 to-red-600'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  const getScoreIcon = (score) => {
    if (score >= 80) return '🏆'
    if (score >= 60) return '👍'
    if (score >= 40) return '📈'
    return '💪'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-bounce text-8xl mb-8">🤖</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Analyzing Your Performance
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Our AI is reviewing your answers and generating personalized feedback...
            </p>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-purple-600 font-semibold text-lg">Processing Analysis...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="text-8xl mb-8">🤖</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Ready to Analyze Your Performance?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {error}
            </p>
            <div className="space-x-4">
              <Button 
                onClick={generateNewAnalysis} 
                size="lg"
                className="px-8 py-4 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <span className="mr-2 text-xl">🚀</span>
                Generate Analysis
              </Button>
              <Button onClick={onBack} size="lg" variant="outline">
                Back to Interview
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="text-8xl mb-8">❌</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Analysis Not Available
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Unable to generate analysis for this session.
          </p>
          <Button onClick={onBack} size="lg" variant="outline">
            Back to Interview
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="text-8xl mb-6">{getScoreIcon(analysis.overallScore)}</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Interview Performance Analysis
            </h1>
            <p className="text-xl text-gray-600">
              AI-powered insights to help you improve your interview skills
            </p>
          </div>

          {/* Overall Score Card */}
          <Card className="mb-8 border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold">Overall Performance Score</CardTitle>
            </CardHeader>
            <CardContent className="p-12 text-center">
              <div className={`text-8xl font-bold mb-6 ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}/100
              </div>
              <Badge 
                variant="secondary" 
                className={`text-xl px-6 py-3 bg-gradient-to-r ${getScoreBackground(analysis.overallScore)} text-white font-semibold`}
              >
                {getScoreLabel(analysis.overallScore)}
              </Badge>
              <div className="mt-8 max-w-md mx-auto">
                <Progress value={analysis.overallScore} className="h-4" />
              </div>
            </CardContent>
          </Card>

          {/* Session Summary */}
          {sessionData && (
            <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <span className="mr-3">📊</span>
                  Session Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {sessionData.answeredQuestions}
                    </div>
                    <div className="text-sm font-medium text-gray-600">Questions Answered</div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">
                      {sessionData.totalQuestions}
                    </div>
                    <div className="text-sm font-medium text-gray-600">Total Questions</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2 capitalize">
                      {sessionData.difficulty}
                    </div>
                    <div className="text-sm font-medium text-gray-600">Difficulty Level</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {Math.round((sessionData.answeredQuestions / sessionData.totalQuestions) * 100)}%
                    </div>
                    <div className="text-sm font-medium text-gray-600">Completion Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths and Improvements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Strengths */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <span className="mr-3 text-2xl">💪</span>
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {analysis.strengths && analysis.strengths.length > 0 ? (
                  <ul className="space-y-4">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start p-3 bg-white/60 rounded-lg">
                        <span className="mr-3 text-green-500 text-xl">✓</span>
                        <span className="text-green-800 font-medium">{cleanAnalysisText(strength)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🌟</div>
                    <p className="text-green-700 font-medium">Keep working on building your strengths!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-yellow-50">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <span className="mr-3 text-2xl">🎯</span>
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {analysis.improvements && analysis.improvements.length > 0 ? (
                  <ul className="space-y-4">
                    {analysis.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start p-3 bg-white/60 rounded-lg">
                        <span className="mr-3 text-orange-500 text-xl">→</span>
                        <span className="text-orange-800 font-medium">{cleanAnalysisText(improvement)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎉</div>
                    <p className="text-orange-700 font-medium">Great job! Keep up the excellent work.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          {analysis.detailedAnalysis && (
            <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <span className="mr-3 text-2xl">📝</span>
                  Detailed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="prose max-w-none text-gray-700 leading-relaxed text-lg">
                  {cleanAnalysisText(analysis.detailedAnalysis).split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <span className="mr-3 text-2xl">💡</span>
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-6">
                  {analysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start p-6 bg-white/70 rounded-xl border border-blue-200">
                      <div className="mr-4 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-blue-800 font-medium text-lg leading-relaxed">
                          {cleanAnalysisText(recommendation)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={onBack}
                size="lg"
                variant="outline"
                className="px-8 py-3 text-lg border-2 border-gray-300 hover:border-gray-400"
              >
                ← Back to Interview
              </Button>
              <Button
                onClick={() => window.print()}
                size="lg"
                variant="outline"
                className="px-8 py-3 text-lg border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                📄 Print Analysis
              </Button>
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                className="px-8 py-3 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                🚀 Start New Interview
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Analysis