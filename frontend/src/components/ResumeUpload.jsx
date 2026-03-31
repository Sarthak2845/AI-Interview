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
    
    // Note: Preview functionality will be added later
    // await getResumePreview(selectedFile)
  }

  // Preview functionality will be integrated with the main upload
  const getResumePreview = async (file) => {
    // This will be implemented when needed
    console.log('Preview for:', file.name)
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
    <div className="p-10" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7eeff 100%)' }}>
      <CardHeader className="text-center pb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #af19d7 0%, #df82ff 100%)' }}>
          <span className="text-4xl">📄</span>
        </div>
        <CardTitle className="text-4xl font-bold mb-4" style={{ color: '#462a67' }}>
          Upload Your Resume
        </CardTitle>
        <CardDescription className="text-xl" style={{ color: '#6e727a' }}>
          Get personalized AI-generated interview questions based on your experience
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer jankoti-card ${
            dragOver
              ? 'border-purple-500 scale-105'
              : file
              ? 'border-green-500'
              : 'hover:border-purple-400'
          }`}
          style={{
            borderColor: dragOver ? '#af19d7' : file ? '#6f9ca8' : '#c6bdd2',
            background: dragOver ? 'rgba(175, 25, 215, 0.05)' : file ? 'rgba(111, 156, 168, 0.05)' : 'rgba(255, 255, 255, 0.8)'
          }}
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
            <div className="jankoti-fade-in">
              <div className="text-6xl mb-6">📄</div>
              <h3 className="text-2xl font-semibold mb-3" style={{ color: '#462a67' }}>
                {file.name}
              </h3>
              <p className="text-lg mb-3" style={{ color: '#6e727a' }}>
                {formatFileSize(file.size)}
              </p>
              <p className="text-sm font-medium" style={{ color: '#af19d7' }}>
                Click to change file
              </p>
              
              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <div className="mt-6">
                  <div className="h-3 rounded-full" style={{ background: '#f4ecfb' }}>
                    <div 
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${uploadProgress}%`,
                        background: 'linear-gradient(90deg, #af19d7 0%, #7164bc 100%)'
                      }}
                    ></div>
                  </div>
                  <p className="text-sm mt-3" style={{ color: '#6e727a' }}>
                    Processing... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="jankoti-fade-in">
              <div className="text-6xl mb-6">📁</div>
              <h3 className="text-2xl font-semibold mb-3" style={{ color: '#462a67' }}>
                Drop your resume here
              </h3>
              <p className="text-lg mb-3" style={{ color: '#6e727a' }}>
                or <span className="font-semibold" style={{ color: '#af19d7' }}>click to browse</span>
              </p>
              <p className="text-sm" style={{ color: '#9c95a3' }}>
                Supports PDF, DOCX, TXT (max 10MB)
              </p>
            </div>
          )}
        </div>

        {/* Resume Preview - Will show after upload */}
        {file && (
          <Card className="border border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">
                📄 Ready to Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700">
                Your resume <strong>{file.name}</strong> is ready for AI analysis. 
                Click "Generate Interview Questions" to start the process.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="jankoti-card" style={{ border: '1px solid rgba(70, 42, 103, 0.1)' }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl" style={{ color: '#462a67' }}>Difficulty Level</CardTitle>
              <CardDescription style={{ color: '#6e727a' }}>
                {getDifficultyDescription(difficulty)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['easy', 'medium', 'hard'].map((level) => (
                  <label key={level} className="flex items-center space-x-4 cursor-pointer p-3 rounded-xl transition-all duration-300 hover:scale-105" style={{ background: difficulty === level ? 'rgba(175, 25, 215, 0.1)' : 'rgba(255, 255, 255, 0.5)' }}>
                    <input
                      type="radio"
                      name="difficulty"
                      value={level}
                      checked={difficulty === level}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-5 h-5"
                      style={{ accentColor: '#af19d7' }}
                    />
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full`} style={{ background: level === 'easy' ? '#6f9ca8' : level === 'medium' ? '#c97c42' : '#b944ac' }}></div>
                      <span className="capitalize font-semibold text-lg" style={{ color: '#462a67' }}>{level}</span>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="jankoti-card" style={{ border: '1px solid rgba(70, 42, 103, 0.1)' }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl" style={{ color: '#462a67' }}>Number of Questions</CardTitle>
              <CardDescription style={{ color: '#6e727a' }}>
                More questions provide comprehensive coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #af19d7 0%, #af19d7 ${((numQuestions - 5) / 45) * 100}%, #f4ecfb ${((numQuestions - 5) / 45) * 100}%, #f4ecfb 100%)`
                  }}
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: '#6e727a' }}>5 min</span>
                  <Badge className="px-4 py-2 text-lg font-semibold" style={{ background: 'linear-gradient(135deg, #af19d7 0%, #df82ff 100%)', color: 'white' }}>
                    {numQuestions} questions (~{Math.round(numQuestions * 2.5)} min)
                  </Badge>
                  <span className="text-sm font-medium" style={{ color: '#6e727a' }}>50 max</span>
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
          className="w-full h-16 text-xl font-bold rounded-2xl transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50"
          style={{ 
            background: loading ? '#9c95a3' : 'linear-gradient(135deg, #462a67 0%, #7164bc 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(70, 42, 103, 0.3)'
          }}
        >
          {loading ? (
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing Resume...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🚀</span>
              <span>Generate Interview Questions</span>
            </div>
          )}
        </Button>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="text-center jankoti-card transition-all duration-300 hover:transform hover:scale-105" style={{ border: '1px solid rgba(70, 42, 103, 0.1)', background: 'linear-gradient(135deg, #f7eeff 0%, #ffffff 100%)' }}>
            <CardContent className="p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #af19d7 0%, #df82ff 100%)' }}>
                <span className="text-3xl">🤖</span>
              </div>
              <h4 className="text-xl font-bold mb-3" style={{ color: '#462a67' }}>AI-Powered Analysis</h4>
              <p className="text-sm leading-relaxed" style={{ color: '#6e727a' }}>Advanced AI analyzes your resume content and generates relevant questions</p>
            </CardContent>
          </Card>
          <Card className="text-center jankoti-card transition-all duration-300 hover:transform hover:scale-105" style={{ border: '1px solid rgba(70, 42, 103, 0.1)', background: 'linear-gradient(135deg, #f7eeff 0%, #ffffff 100%)' }}>
            <CardContent className="p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6f9ca8 0%, #728cab 100%)' }}>
                <span className="text-3xl">🎯</span>
              </div>
              <h4 className="text-xl font-bold mb-3" style={{ color: '#462a67' }}>Personalized Questions</h4>
              <p className="text-sm leading-relaxed" style={{ color: '#6e727a' }}>Questions tailored to your specific skills, projects, and experience</p>
            </CardContent>
          </Card>
          <Card className="text-center jankoti-card transition-all duration-300 hover:transform hover:scale-105" style={{ border: '1px solid rgba(70, 42, 103, 0.1)', background: 'linear-gradient(135deg, #f7eeff 0%, #ffffff 100%)' }}>
            <CardContent className="p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #c97c42 0%, #ae805d 100%)' }}>
                <span className="text-3xl">📊</span>
              </div>
              <h4 className="text-xl font-bold mb-3" style={{ color: '#462a67' }}>ATS Score Analysis</h4>
              <p className="text-sm leading-relaxed" style={{ color: '#6e727a' }}>Get insights on resume quality and improvement suggestions</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </div>
  )
}

export default ResumeUpload