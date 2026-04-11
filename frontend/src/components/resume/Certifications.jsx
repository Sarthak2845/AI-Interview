import { useState } from 'react'
import { FiAward, FiPlus, FiTrash2, FiCalendar, FiExternalLink } from 'react-icons/fi'
import { Button } from '../ui/button'

const Certifications = ({ data = [], onChange, onNext, onPrev }) => {
  const [errors, setErrors] = useState({})

  const addCertification = () => {
    const newCert = {
      id: Date.now(),
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
      neverExpires: false
    }
    onChange('certifications', null, [...data, newCert])
  }

  const updateCertification = (index, field, value) => {
    const updated = [...data]
    updated[index][field] = value
    onChange('certifications', null, updated)
  }

  const removeCertification = (index) => {
    const updated = data.filter((_, i) => i !== index)
    onChange('certifications', null, updated)
  }

  const validate = () => {
    const newErrors = {}
    data.forEach((cert, index) => {
      if (!cert.name?.trim()) newErrors[`${index}_name`] = 'Certification name is required'
      if (!cert.issuer?.trim()) newErrors[`${index}_issuer`] = 'Issuing organization is required'
      if (!cert.issueDate) newErrors[`${index}_issueDate`] = 'Issue date is required'
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (data.length > 0 && !validate()) {
      return
    }
    onNext()
  }

  const popularCertifications = [
    { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services' },
    { name: 'Google Cloud Professional', issuer: 'Google Cloud' },
    { name: 'Microsoft Azure Fundamentals', issuer: 'Microsoft' },
    { name: 'Certified Kubernetes Administrator', issuer: 'Cloud Native Computing Foundation' },
    { name: 'PMP - Project Management Professional', issuer: 'Project Management Institute' },
    { name: 'Certified ScrumMaster', issuer: 'Scrum Alliance' },
    { name: 'CompTIA Security+', issuer: 'CompTIA' },
    { name: 'Cisco Certified Network Associate', issuer: 'Cisco' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Certifications & Licenses</h3>
          <p className="text-sm text-gray-600">Add your professional certifications and licenses</p>
        </div>
        <Button onClick={addCertification} className="flex items-center gap-2">
          <FiPlus size={16} />
          Add Certification
        </Button>
      </div>

      {/* Quick Add Popular Certifications */}
      {data.length === 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-800 mb-3">Popular Certifications</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {popularCertifications.map((cert, index) => (
              <button
                key={index}
                onClick={() => {
                  const newCert = {
                    id: Date.now(),
                    name: cert.name,
                    issuer: cert.issuer,
                    issueDate: '',
                    expiryDate: '',
                    credentialId: '',
                    credentialUrl: '',
                    neverExpires: false
                  }
                  onChange('certifications', null, [newCert])
                }}
                className="text-left p-3 bg-white hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors"
              >
                <div className="font-medium text-gray-800 text-sm">{cert.name}</div>
                <div className="text-xs text-gray-600">{cert.issuer}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FiAward size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No certifications added yet</p>
          <p className="text-sm text-gray-500 mb-4">Certifications can significantly boost your resume's ATS score</p>
          <Button onClick={addCertification}>Add Your First Certification</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((cert, index) => (
            <div key={cert.id} className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <FiAward size={20} className="text-amber-600" />
                  <h4 className="text-lg font-semibold text-gray-800">Certification {index + 1}</h4>
                </div>
                <Button
                  onClick={() => removeCertification(index)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                >
                  <FiTrash2 size={16} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Certification Name *</label>
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) => updateCertification(index, 'name', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors[`${index}_name`] ? 'border-red-300' : 'border-gray-200 focus:border-amber-500'
                    }`}
                    placeholder="AWS Certified Solutions Architect"
                  />
                  {errors[`${index}_name`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}_name`]}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Issuing Organization *</label>
                  <input
                    type="text"
                    value={cert.issuer}
                    onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors[`${index}_issuer`] ? 'border-red-300' : 'border-gray-200 focus:border-amber-500'
                    }`}
                    placeholder="Amazon Web Services"
                  />
                  {errors[`${index}_issuer`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}_issuer`]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Date *</label>
                  <div className="relative">
                    <FiCalendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="month"
                      value={cert.issueDate}
                      onChange={(e) => updateCertification(index, 'issueDate', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        errors[`${index}_issueDate`] ? 'border-red-300' : 'border-gray-200 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors[`${index}_issueDate`] && <p className="text-sm text-red-600 mt-1">{errors[`${index}_issueDate`]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                  <div className="relative">
                    <FiCalendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="month"
                      value={cert.expiryDate}
                      onChange={(e) => updateCertification(index, 'expiryDate', e.target.value)}
                      disabled={cert.neverExpires}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        cert.neverExpires ? 'bg-gray-100 text-gray-500' : 'border-gray-200 focus:border-amber-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={cert.neverExpires}
                      onChange={(e) => {
                        updateCertification(index, 'neverExpires', e.target.checked)
                        if (e.target.checked) {
                          updateCertification(index, 'expiryDate', '')
                        }
                      }}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-700">This certification never expires</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Credential ID</label>
                  <input
                    type="text"
                    value={cert.credentialId}
                    onChange={(e) => updateCertification(index, 'credentialId', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="ABC123XYZ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Credential URL</label>
                  <div className="relative">
                    <FiExternalLink size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      value={cert.credentialUrl}
                      onChange={(e) => updateCertification(index, 'credentialUrl', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="https://verify.certification.com/abc123"
                    />
                  </div>
                </div>
              </div>

              {/* Certification Status */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cert.neverExpires ? 'bg-green-100 text-green-800' :
                    cert.expiryDate && new Date(cert.expiryDate) > new Date() ? 'bg-green-100 text-green-800' :
                    cert.expiryDate && new Date(cert.expiryDate) <= new Date() ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {cert.neverExpires ? 'Never Expires' :
                     cert.expiryDate && new Date(cert.expiryDate) > new Date() ? 'Active' :
                     cert.expiryDate && new Date(cert.expiryDate) <= new Date() ? 'Expired' :
                     'No Expiry Set'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certifications Summary */}
      {data.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <FiAward size={20} className="text-amber-600" />
            <h4 className="font-semibold text-gray-800">Certifications Summary</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Total:</span>
              <span className="ml-2 text-amber-600 font-semibold">{data.length}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Active:</span>
              <span className="ml-2 text-green-600 font-semibold">
                {data.filter(cert => 
                  cert.neverExpires || (cert.expiryDate && new Date(cert.expiryDate) > new Date())
                ).length}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">With URLs:</span>
              <span className="ml-2 text-blue-600 font-semibold">
                {data.filter(cert => cert.credentialUrl).length}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">ATS Boost:</span>
              <span className="ml-2 text-violet-600 font-semibold">+{data.length * 5} pts</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button onClick={onPrev} variant="outline">
          ← Previous
        </Button>
        <Button onClick={handleNext}>
          Next Step →
        </Button>
      </div>
    </div>
  )
}

export default Certifications