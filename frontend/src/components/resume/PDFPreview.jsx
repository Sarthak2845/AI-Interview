import { useState, useEffect } from 'react'
import { FiEye, FiDownload, FiPrinter, FiShare2, FiCheck, FiRefreshCw, FiZap, FiAlertCircle } from 'react-icons/fi'
import { Button } from '../ui/button'
import { JankotiBranding, JankotiWatermark } from '../ui/JankotiLogo'
import './preview-styles.css'

const PDFPreview = ({ data, onPrev, onComplete }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState('desktop')
  const [templates, setTemplates] = useState([])
  const [previewHtml, setPreviewHtml] = useState('')
  const [error, setError] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Load templates on component mount
  useEffect(() => {
    loadTemplates()
  }, [])

  // Load preview when template or data changes
  useEffect(() => {
    if (selectedTemplate && data) {
      loadPreview()
    }
  }, [selectedTemplate, data])

  const loadTemplates = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/resume/templates')
      const result = await response.json()
      if (result.success) {
        setTemplates(result.templates)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      // Fallback templates
      setTemplates([
        {
          id: 'modern',
          name: 'Modern Professional',
          description: 'Clean design with modern typography and subtle colors',
          atsScore: 95,
          category: 'Professional',
          bestFor: 'General business roles, startups'
        },
        {
          id: 'classic',
          name: 'Classic Corporate',
          description: 'Traditional format preferred by large corporations',
          atsScore: 98,
          category: 'Corporate',
          bestFor: 'Fortune 500, banking, consulting'
        },
        {
          id: 'minimal',
          name: 'Minimal Clean',
          description: 'Ultra-clean design focusing purely on content',
          atsScore: 100,
          category: 'Minimal',
          bestFor: 'Any industry, maximum ATS compatibility'
        },
        {
          id: 'creative',
          name: 'Creative Professional',
          description: 'Balanced creativity with professional appeal',
          atsScore: 88,
          category: 'Creative',
          bestFor: 'Design, marketing, creative agencies'
        },
        {
          id: 'executive',
          name: 'Executive Leadership',
          description: 'Sophisticated design for senior positions',
          atsScore: 92,
          category: 'Executive',
          bestFor: 'C-level, VP, senior management'
        },
        {
          id: 'tech',
          name: 'Tech Specialist',
          description: 'Optimized for technical roles with skills focus',
          atsScore: 94,
          category: 'Technical',
          bestFor: 'Software engineering, IT, data science'
        }
      ])
    }
  }

  const loadPreview = async () => {
    setIsLoadingPreview(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:8080/api/resume/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: data,
          template: selectedTemplate
        })
      })

      if (response.ok) {
        const html = await response.text()
        setPreviewHtml(html)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load preview' }))
        throw new Error(errorData.error || 'Failed to load preview')
      }
    } catch (error) {
      console.error('Error loading preview:', error)
      setError(error.message)
      setPreviewHtml(`
        <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;">
          <h3 style="color: #dc2626; margin-bottom: 1rem;">Preview Error</h3>
          <p style="color: #6b7280;">${error.message}</p>
          <button onclick="window.parent.location.reload()" style="
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: #7c3aed;
            color: white;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
          ">Retry</button>
        </div>
      `)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const validateResumeData = () => {
    const errors = []
    const warnings = []
    
    if (!data.personalInfo?.fullName?.trim()) {
      errors.push('Full name is required')
    }
    if (!data.personalInfo?.email?.trim()) {
      errors.push('Email is required')
    }
    if (!data.personalInfo?.phone?.trim()) {
      errors.push('Phone number is required')
    }
    if (!data.summary?.trim()) {
      errors.push('Professional summary is required')
    }
    if (!data.experience?.length) {
      errors.push('At least one work experience is required')
    }
    if (!data.education?.length) {
      errors.push('At least one education entry is required')
    }
    
    // Warnings for optional but recommended fields
    if (!data.personalInfo?.profilePicture) {
      warnings.push('Consider adding a professional photo to make your resume stand out')
    }
    if (!data.personalInfo?.linkedin?.trim()) {
      warnings.push('LinkedIn profile URL is highly recommended')
    }
    if (!data.skills?.technical?.length && !data.skills?.soft?.length) {
      warnings.push('Adding skills will improve your ATS score')
    }
    
    return { errors, warnings }
  }

  const generatePDF = async (action = 'download') => {
    // Validate resume data first
    const validation = validateResumeData()
    if (validation.errors.length > 0) {
      alert(`Please complete the following required fields:\n\n${validation.errors.join('\n')}`)
      return
    }
    
    // Show warnings if any
    if (validation.warnings.length > 0) {
      const proceed = confirm(`Your resume is ready to generate! However, consider these improvements:\n\n${validation.warnings.join('\n')}\n\nDo you want to proceed with PDF generation?`)
      if (!proceed) return
    }

    setIsGenerating(true)
    setError(null)
    setDownloadProgress(0)
    
    try {
      // Try main PDF generation first
      let response = await fetch('http://localhost:8080/api/resume/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: data,
          template: selectedTemplate
        })
      })

      // If main method fails, try fallback
      if (!response.ok) {
        console.log('Main PDF generation failed, trying fallback...')
        response = await fetch('http://localhost:8080/api/resume/generate-pdf-fallback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resumeData: data,
            template: selectedTemplate
          })
        })
        
        if (response.ok) {
          // Get HTML and convert to PDF using browser's print function
          const html = await response.text()
          const printWindow = window.open('', '_blank')
          printWindow.document.write(html)
          printWindow.document.close()
          
          if (action === 'download') {
            // Use browser's print to PDF functionality
            printWindow.focus()
            setTimeout(() => {
              printWindow.print()
            }, 1000)
          } else if (action === 'print') {
            printWindow.focus()
            printWindow.print()
          }
          
          setIsGenerating(false)
          return
        }
      }

      if (response.ok) {
        setDownloadProgress(50)
        const blob = await response.blob()
        setDownloadProgress(75)
        
        const url = window.URL.createObjectURL(blob)
        
        if (action === 'download') {
          const a = document.createElement('a')
          a.href = url
          const fileName = `${data.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          setDownloadProgress(100)
        } else if (action === 'print') {
          const printWindow = window.open(url)
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print()
            }
          }
        }
        
        window.URL.revokeObjectURL(url)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate PDF' }))
        throw new Error(errorData.error || errorData.details || 'Failed to generate PDF')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      setError(error.message)
      
      // Show user-friendly error with fallback option
      const tryFallback = confirm(`PDF generation failed: ${error.message}\n\nWould you like to try opening your resume in a new window where you can print it as PDF?`)
      
      if (tryFallback) {
        try {
          const response = await fetch('http://localhost:8080/api/resume/generate-pdf-fallback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              resumeData: data,
              template: selectedTemplate
            })
          })
          
          if (response.ok) {
            const html = await response.text()
            const printWindow = window.open('', '_blank')
            printWindow.document.write(html)
            printWindow.document.close()
            printWindow.focus()
            
            alert('Your resume has opened in a new window. Use Ctrl+P (or Cmd+P on Mac) to print it as PDF.')
          }
        } catch (fallbackError) {
          alert('All PDF generation methods failed. Please try again later.')
        }
      }
    } finally {
      setIsGenerating(false)
      setDownloadProgress(0)
    }
  }

  const shareResume = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.personalInfo.fullName} - Resume`,
          text: 'Check out my professional resume',
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Resume link copied to clipboard!')
      } catch (error) {
        console.log('Could not copy to clipboard')
      }
    }
  }

  const getTemplatesByCategory = () => {
    const categories = {}
    templates.forEach(template => {
      if (!categories[template.category]) {
        categories[template.category] = []
      }
      categories[template.category].push(template)
    })
    return categories
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <JankotiBranding className="mb-4" />
        <h3 className="text-3xl font-bold text-gray-800 mb-2">Resume Preview & Download</h3>
        <p className="text-gray-600 text-lg">Choose your template and download your ATS-optimized resume</p>
      </div>

      {/* Template Selection */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <FiZap size={24} className="text-violet-600" />
          <h4 className="text-xl font-semibold text-gray-800">Choose Your Template</h4>
        </div>
        
        {Object.entries(getTemplatesByCategory()).map(([category, categoryTemplates]) => (
          <div key={category} className="mb-8">
            <h5 className="text-lg font-semibold text-gray-700 mb-4">{category} Templates</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`border-2 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg ${
                    selectedTemplate === template.id
                      ? 'border-violet-500 bg-violet-50 shadow-lg'
                      : 'border-gray-200 hover:border-violet-300'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10"></div>
                    <span className="text-gray-500 font-medium relative z-10">Preview</span>
                    {selectedTemplate === template.id && (
                      <div className="absolute top-2 right-2 bg-violet-600 text-white rounded-full p-1">
                        <FiCheck size={16} />
                      </div>
                    )}
                  </div>
                  
                  <h6 className="font-semibold text-gray-800 mb-2">{template.name}</h6>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-600">
                      ATS Score: {template.atsScore}%
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {template.category}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    <strong>Best for:</strong> {template.bestFor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Resume Data Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <FiEye size={24} className="text-blue-600" />
          <h4 className="text-xl font-semibold text-blue-800">Resume Summary</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Photo Preview */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-2 border-blue-200 bg-gray-100 flex items-center justify-center">
              {data.personalInfo?.profilePicture ? (
                <img 
                  src={data.personalInfo.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-2xl">👤</span>
              )}
            </div>
            <p className="text-sm font-medium text-blue-800">
              {data.personalInfo?.profilePicture ? 'Photo Added ✓' : 'No Photo'}
            </p>
            {!data.personalInfo?.profilePicture && (
              <p className="text-xs text-blue-600 mt-1">Go back to add a professional photo</p>
            )}
          </div>
          
          {/* Resume Stats */}
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {[
                data.experience?.length || 0,
                data.education?.length || 0,
                data.projects?.length || 0,
                data.certifications?.length || 0
              ].reduce((a, b) => a + b, 0)}
            </div>
            <p className="text-sm font-medium text-blue-800">Total Sections</p>
            <p className="text-xs text-blue-600 mt-1">
              {data.experience?.length || 0} Experience • {data.education?.length || 0} Education
            </p>
          </div>
          
          {/* Skills Count */}
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {(data.skills?.technical?.length || 0) + (data.skills?.soft?.length || 0)}
            </div>
            <p className="text-sm font-medium text-blue-800">Skills Listed</p>
            <p className="text-xs text-blue-600 mt-1">
              {data.skills?.technical?.length || 0} Technical • {data.skills?.soft?.length || 0} Soft
            </p>
          </div>
        </div>
      </div>

      {/* Preview Controls */}
      <div className="flex justify-between items-center bg-white border-2 border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Preview Mode:</span>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            {[
              { mode: 'desktop', label: 'Desktop', icon: '🖥️' },
              { mode: 'mobile', label: 'Mobile', icon: '📱' },
              { mode: 'print', label: 'Print', icon: '🖨️' }
            ].map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={() => setPreviewMode(mode)}
                className={`px-4 py-2 text-sm flex items-center gap-2 ${
                  previewMode === mode
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={loadPreview}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={isLoadingPreview}
          >
            <FiRefreshCw size={16} className={isLoadingPreview ? 'animate-spin' : ''} />
            Refresh
          </Button>
          
          <Button
            onClick={() => generatePDF('print')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={isGenerating}
          >
            <FiPrinter size={16} />
            Print
          </Button>
          
          <Button
            onClick={shareResume}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <FiShare2 size={16} />
            Share
          </Button>
          
          <Button
            onClick={() => generatePDF('download')}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FiDownload size={16} />
            )}
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Resume Preview */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Live Preview</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {isLoadingPreview && (
                <>
                  <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading preview...</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className={`transition-all duration-300 ${
          previewMode === 'desktop' ? 'max-w-none' :
          previewMode === 'mobile' ? 'max-w-sm mx-auto' :
          'max-w-4xl mx-auto'
        }`}>
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[800px] border-0"
              title="Resume Preview"
            />
          ) : (
            <div className="h-[800px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FiEye size={48} className="mx-auto mb-4 opacity-50" />
                <p>Loading preview...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ATS Compatibility Info */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <FiCheck size={24} className="text-white" />
          </div>
          <div>
            <h4 className="text-xl font-semibold text-green-800">ATS Compatibility Verified</h4>
            <p className="text-green-700">Your resume is optimized for Applicant Tracking Systems</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📄</span>
            </div>
            <h5 className="font-semibold text-green-800 mb-2">Machine Readable</h5>
            <p className="text-sm text-green-700">PDF with selectable text and proper structure</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎨</span>
            </div>
            <h5 className="font-semibold text-green-800 mb-2">ATS-Friendly Design</h5>
            <p className="text-sm text-green-700">Standard fonts, clear sections, proper formatting</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔍</span>
            </div>
            <h5 className="font-semibold text-green-800 mb-2">Keyword Optimized</h5>
            <p className="text-sm text-green-700">Industry-relevant terms and phrases included</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="flex justify-between items-center">
          <Button onClick={onPrev} variant="outline" size="lg">
            ← Previous Step
          </Button>
          <JankotiWatermark />
          <Button 
            onClick={onComplete} 
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Complete Resume ✓
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PDFPreview