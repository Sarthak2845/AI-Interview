import { useState, useEffect } from 'react'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { FiUser, FiEdit3, FiBriefcase, FiBook, FiCode, FiTarget, FiAward, FiEye, FiSave, FiClock } from 'react-icons/fi'
import { useAuth } from '../context/authContext'
import { saveResumeData, loadResumeData, getDefaultResumeData, mergeWithUserData, useAutoSave } from '../utils/resumeStorage'

// Import modular components
import PersonalInfo from './resume/PersonalInfo'
import Experience from './resume/Experience'
import Education from './resume/Education'
import Skills from './resume/Skills'
import Projects from './resume/Projects'
import Certifications from './resume/Certifications'
import Summary from './resume/Summary'
import PDFPreview from './resume/PDFPreview'

const ResumeBuilder = ({ onBack }) => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [resumeData, setResumeData] = useState(getDefaultResumeData())
  const [atsScore, setAtsScore] = useState(0)
  const [loading, setLoading] = useState(true)

  // Auto-save functionality
  const { lastSaved, isSaving } = useAutoSave(resumeData, true)

  const steps = [
    { title: 'Personal Info', icon: FiUser, component: PersonalInfo },
    { title: 'Experience', icon: FiBriefcase, component: Experience },
    { title: 'Education', icon: FiBook, component: Education },
    { title: 'Skills', icon: FiCode, component: Skills },
    { title: 'Projects', icon: FiTarget, component: Projects },
    { title: 'Certifications', icon: FiAward, component: Certifications },
    { title: 'Summary', icon: FiEdit3, component: Summary },
    { title: 'Preview & Download', icon: FiEye, component: PDFPreview }
  ]

  // Load saved data and merge with user data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load saved resume data
        const savedData = loadResumeData()
        
        // Create initial data with user info
        const initialData = getDefaultResumeData()
        if (user) {
          initialData.personalInfo.fullName = user.name || ''
          initialData.personalInfo.email = user.email || ''
        }

        // Merge saved data with user data
        const finalData = mergeWithUserData(savedData, user)
        setResumeData(finalData)
        
        // Calculate initial ATS score
        calculateATSScore(finalData)
      } catch (error) {
        console.error('Error initializing resume data:', error)
        // Fallback to default data
        const defaultData = getDefaultResumeData()
        setResumeData(defaultData)
        calculateATSScore(defaultData)
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [user])

  // Calculate ATS score whenever data changes
  useEffect(() => {
    calculateATSScore(resumeData)
  }, [resumeData])

  const calculateATSScore = (data) => {
    if (!data || !data.personalInfo) {
      setAtsScore(0)
      return
    }
    
    let score = 0
    const { personalInfo, summary, experience, education, skills, projects } = data

    // Personal info (20 points)
    const requiredFields = ['fullName', 'email', 'phone', 'location']
    const completedFields = requiredFields.filter(field => personalInfo?.[field]?.trim()).length
    score += (completedFields / requiredFields.length) * 20

    // Summary (20 points)
    if (summary?.trim()) {
      const wordCount = summary.trim().split(/\s+/).length
      if (wordCount >= 50 && wordCount <= 150) {
        score += 20
      } else if (wordCount >= 30) {
        score += 15
      } else if (wordCount >= 15) {
        score += 10
      }
    }

    // Experience (25 points)
    if (experience?.length >= 2) score += 25
    else if (experience?.length === 1) score += 15

    // Education (15 points)
    if (education?.length >= 1) score += 15

    // Skills (15 points)
    const totalSkills = (skills?.technical?.length || 0) + (skills?.soft?.length || 0)
    if (totalSkills >= 10) score += 15
    else if (totalSkills >= 5) score += 10

    // Projects (5 points)
    if (projects?.length >= 1) score += 5

    setAtsScore(Math.min(100, Math.round(score)))
  }

  const handleDataChange = (section, field, value, index = null) => {
    setResumeData(prev => {
      if (section === null) {
        // Direct field update (like summary)
        return { ...prev, [field]: value }
      } else if (index !== null) {
        // Array item update
        const newArray = [...prev[section]]
        newArray[index] = { ...newArray[index], [field]: value }
        return { ...prev, [section]: newArray }
      } else if (section === 'personalInfo') {
        // Personal info update
        return {
          ...prev,
          personalInfo: { ...prev.personalInfo, [field]: value }
        }
      } else {
        // Direct section update (like education array)
        return { ...prev, [section]: value }
      }
    })
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const manualSave = async () => {
    const success = saveResumeData(resumeData)
    if (success) {
      // Show success message or toast
      console.log('Resume saved successfully')
    }
  }

  const renderStepContent = () => {
    const StepComponent = steps[currentStep].component
    
    if (!StepComponent) {
      return (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600 mb-4">
            {steps[currentStep].title} - Coming Soon
          </h3>
          <p className="text-gray-500 mb-8">
            This section is under development. You can navigate to other sections.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={handlePrev} disabled={currentStep === 0} variant="outline">
              ← Previous
            </Button>
            <Button onClick={handleNext} disabled={currentStep === steps.length - 1}>
              Next →
            </Button>
          </div>
        </div>
      )
    }

    const getStepData = () => {
      switch (currentStep) {
        case 0: return resumeData.personalInfo
        case 1: return resumeData.experience
        case 2: return resumeData.education
        case 3: return resumeData.skills
        case 4: return resumeData.projects
        case 5: return resumeData.certifications
        case 6: return resumeData.summary
        case 7: return resumeData
        default: return resumeData
      }
    }

    const commonProps = {
      data: getStepData(),
      onChange: handleDataChange,
      onNext: handleNext,
      onPrev: handlePrev,
      resumeData: resumeData
    }

    // Special handling for PDFPreview
    if (currentStep === 7) {
      return (
        <StepComponent
          {...commonProps}
          onComplete={() => {
            alert('Resume completed successfully! 🎉')
            // You can add navigation logic here
          }}
        />
      )
    }

    return <StepComponent {...commonProps} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your resume...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🚀 ATS Resume Builder
              </h1>
              <p className="text-xl text-gray-600">
                Create a perfect resume with 100% ATS compatibility
              </p>
              <div className="mt-2 text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Auto-save indicator */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <FiClock size={16} />
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </>
                ) : null}
              </div>
              <Button onClick={manualSave} variant="outline" className="flex items-center gap-2">
                <FiSave size={16} />
                Save
              </Button>
              <Button onClick={onBack} variant="outline">
                ← Back
              </Button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                    index === currentStep
                      ? 'bg-violet-600 text-white shadow-lg'
                      : index < currentStep
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  {React.createElement(step.icon, { size: 16 })}
                  <span className="font-medium hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>
            <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
          </div>

          {/* ATS Score Display */}
          <Card className="mb-8 border-0 shadow-xl bg-white/90">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{atsScore}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">ATS Compatibility Score</h3>
                    <p className="text-gray-600">
                      {atsScore >= 90 ? 'Excellent! Your resume is highly optimized' :
                       atsScore >= 70 ? 'Good! Your resume should pass most ATS systems' :
                       atsScore >= 50 ? 'Fair. Add more details to improve your score' :
                       'Needs improvement. Complete more sections'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl">
                    {atsScore >= 90 ? '🏆' : atsScore >= 70 ? '⭐' : atsScore >= 50 ? '📈' : '⚠️'}
                  </div>
                </div>
              </div>
              <Progress value={atsScore} className="mt-4 h-3" />
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card className="border-0 shadow-xl bg-white/90">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                {React.createElement(steps[currentStep].icon, { size: 24 })}
                {steps[currentStep].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}

export default ResumeBuilder