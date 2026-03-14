import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'

const ResumeUpload = ({ onResumeUploaded }) => {
  const [file, setFile] = useState(null)
  const [difficulty, setDifficulty] = useState('medium')
  const [numQuestions, setNumQuestions] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewData, setPreviewData] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\\.(pdf|docx|txt)$/i)) {
      setError('Please upload a PDF, DOCX, or TXT file')
      return
    }

    // Validate file size
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
    setError('')
    
    // Get preview of resume content
    await getResumePreview(selectedFile)
  }

  const getResumePreview = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/parse-resume', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewData(data)
      }
    } catch (error) {
      console.error('Preview failed:', error)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a resume file')
      return
    }

    setLoading(true)
    setError('')
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('difficulty', difficulty)
    formData.append('numQuestions', numQuestions)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 10
        })
      }, 200)

      const response = await fetch('http://localhost:8080/api/upload-resume', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (data.success) {
        setTimeout(() => {
          onResumeUploaded(data)
        }, 500)
      } else {
        setError(data.error || 'Failed to process resume')
        setUploadProgress(0)
      }
    } catch (err) {
      setError('Network error. Please ensure all services are running.')
      setUploadProgress(0)
    } finally {
      setTimeout(() => {
        setLoading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-red-500'
      default: return 'bg-purple-500'
    }
  }

  const getDifficultyDescription = (level) => {
    switch (level) {
      case 'easy': return 'Basic concepts and fundamental questions'
      case 'medium': return 'Practical application and problem-solving'
      case 'hard': return 'Advanced concepts and system design'
      default: return ''
    }
  }

  const getATSScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="p-8">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
          Upload Your Resume
        </CardTitle>
        <CardDescription className="text-lg text-gray-600">
          Get personalized AI-generated interview questions based on your experience
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
            dragOver
              ? 'border-purple-500 bg-purple-50 scale-105'
              : file
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {file ? (
            <div className="animate-slide-in">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {file.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {formatFileSize(file.size)}
              </p>
              <p className="text-sm text-purple-600 font-medium">
                Click to change file
              </p>
              
              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-gray-500 mt-2">
                    Processing... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Drop your resume here
              </h3>
              <p className="text-gray-600 mb-2">
                or <span className="text-purple-600 font-medium">click to browse</span>
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF, DOCX, TXT (max 10MB)
              </p>
            </div>
          )}
        </div>

        {/* Resume Preview */}
        {previewData && (
          <Card className="border border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800 flex items-center justify-between">
                📊 Resume Analysis Preview
                {previewData.ats_quality && (
                  <Badge 
                    variant="outline" 
                    className={`${getATSScoreColor(previewData.ats_quality.score)} border-current`}
                  >
                    ATS Score: {previewData.ats_quality.score}/100
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-blue-700">
                    {previewData.extracted_data?.skills?.count || 0}
                  </div>
                  <div className="text-blue-600">Skills Found</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-700">
                    {previewData.extracted_data?.project_names?.count || 0}
                  </div>
                  <div className="text-blue-600">Projects</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-700">
                    {previewData.extracted_data?.experience?.count || 0}
                  </div>
                  <div className="text-blue-600">Experience</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-700">
                    {previewData.extracted_data?.education?.count || 0}
                  </div>
                  <div className="text-blue-600">Education</div>
                </div>
              </div>
              
              {previewData.ats_quality?.suggestions && previewData.ats_quality.suggestions.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">💡 Resume Suggestions:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {previewData.ats_quality.suggestions.slice(0, 2).map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Difficulty Level</CardTitle>
              <CardDescription>
                {getDifficultyDescription(difficulty)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['easy', 'medium', 'hard'].map((level) => (
                  <label key={level} className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="difficulty"
                      value={level}
                      checked={difficulty === level}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getDifficultyColor(level)}`}></div>
                      <span className="capitalize font-medium">{level}</span>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Number of Questions</CardTitle>
              <CardDescription>
                More questions provide comprehensive coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="range"
                  min="5"
                  max="20"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((numQuestions - 5) / 15) * 100}%, #e5e7eb ${((numQuestions - 5) / 15) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>5 min</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {numQuestions} questions (~{Math.round(numQuestions * 2.5)} min)
                  </Badge>
                  <span>20 max</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing Resume...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>🚀</span>
              <span>Generate Interview Questions</span>
            </div>
          )}
        </Button>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="text-center border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="text-3xl mb-3">🤖</div>
              <h4 className="font-semibold text-gray-800 mb-2">AI-Powered Analysis</h4>
              <p className="text-sm text-gray-600">Advanced AI analyzes your resume content and generates relevant questions</p>
            </CardContent>
          </Card>
          <Card className="text-center border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-semibold text-gray-800 mb-2">Personalized Questions</h4>
              <p className="text-sm text-gray-600">Questions tailored to your specific skills, projects, and experience</p>
            </CardContent>
          </Card>
          <Card className="text-center border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="text-3xl mb-3">📊</div>
              <h4 className="font-semibold text-gray-800 mb-2">ATS Score Analysis</h4>
              <p className="text-sm text-gray-600">Get insights on resume quality and improvement suggestions</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </div>
  )
}

export default ResumeUpload