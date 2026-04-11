import { useState } from 'react'
import { FiCode, FiPlus, FiX, FiUsers, FiTrendingUp } from 'react-icons/fi'
import { Button } from '../ui/button'

const Skills = ({ data = { technical: [], soft: [] }, onChange, onNext, onPrev }) => {
  const [newTechnicalSkill, setNewTechnicalSkill] = useState('')
  const [newSoftSkill, setNewSoftSkill] = useState('')

  const addTechnicalSkill = () => {
    if (newTechnicalSkill.trim()) {
      const updated = {
        ...data,
        technical: [...data.technical, { name: newTechnicalSkill.trim(), level: 'Intermediate' }]
      }
      onChange('skills', null, updated)
      setNewTechnicalSkill('')
    }
  }

  const addSoftSkill = () => {
    if (newSoftSkill.trim()) {
      const updated = {
        ...data,
        soft: [...data.soft, newSoftSkill.trim()]
      }
      onChange('skills', null, updated)
      setNewSoftSkill('')
    }
  }

  const removeTechnicalSkill = (index) => {
    const updated = {
      ...data,
      technical: data.technical.filter((_, i) => i !== index)
    }
    onChange('skills', null, updated)
  }

  const removeSoftSkill = (index) => {
    const updated = {
      ...data,
      soft: data.soft.filter((_, i) => i !== index)
    }
    onChange('skills', null, updated)
  }

  const updateTechnicalSkillLevel = (index, level) => {
    const updated = {
      ...data,
      technical: data.technical.map((skill, i) => 
        i === index ? { ...skill, level } : skill
      )
    }
    onChange('skills', null, updated)
  }

  const handleNext = () => {
    if (data.technical.length === 0 && data.soft.length === 0) {
      alert('Please add at least one skill')
      return
    }
    onNext()
  }

  const commonTechnicalSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML/CSS', 
    'Git', 'AWS', 'Docker', 'MongoDB', 'TypeScript', 'Vue.js', 'Angular'
  ]

  const commonSoftSkills = [
    'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 
    'Project Management', 'Critical Thinking', 'Adaptability', 'Time Management',
    'Creativity', 'Analytical Skills', 'Customer Service', 'Presentation Skills'
  ]

  return (
    <div className="space-y-8">
      {/* Technical Skills */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiCode size={24} className="text-violet-600" />
          <h3 className="text-xl font-semibold text-gray-800">Technical Skills</h3>
        </div>

        <div className="mb-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTechnicalSkill}
              onChange={(e) => setNewTechnicalSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTechnicalSkill()}
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="Add a technical skill..."
            />
            <Button onClick={addTechnicalSkill} className="flex items-center gap-2">
              <FiPlus size={16} />
              Add
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Quick add popular skills:</p>
            <div className="flex flex-wrap gap-2">
              {commonTechnicalSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => {
                    if (!data.technical.some(s => s.name.toLowerCase() === skill.toLowerCase())) {
                      const updated = {
                        ...data,
                        technical: [...data.technical, { name: skill, level: 'Intermediate' }]
                      }
                      onChange('skills', null, updated)
                    }
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-violet-100 text-gray-700 rounded-full transition-colors"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {data.technical.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiCode size={32} className="mx-auto mb-2 opacity-50" />
            <p>No technical skills added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.technical.map((skill, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="flex-1 font-medium text-gray-800">{skill.name}</span>
                <select
                  value={skill.level}
                  onChange={(e) => updateTechnicalSkillLevel(index, e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:border-violet-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
                <Button
                  onClick={() => removeTechnicalSkill(index)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                >
                  <FiX size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Soft Skills */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiUsers size={24} className="text-fuchsia-600" />
          <h3 className="text-xl font-semibold text-gray-800">Soft Skills</h3>
        </div>

        <div className="mb-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSoftSkill}
              onChange={(e) => setNewSoftSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSoftSkill()}
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-fuchsia-500 transition-colors"
              placeholder="Add a soft skill..."
            />
            <Button onClick={addSoftSkill} className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700">
              <FiPlus size={16} />
              Add
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Quick add popular skills:</p>
            <div className="flex flex-wrap gap-2">
              {commonSoftSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => {
                    if (!data.soft.includes(skill)) {
                      const updated = {
                        ...data,
                        soft: [...data.soft, skill]
                      }
                      onChange('skills', null, updated)
                    }
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-fuchsia-100 text-gray-700 rounded-full transition-colors"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {data.soft.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiUsers size={32} className="mx-auto mb-2 opacity-50" />
            <p>No soft skills added yet</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.soft.map((skill, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-2 bg-fuchsia-100 text-fuchsia-800 rounded-full">
                <span className="font-medium">{skill}</span>
                <Button
                  onClick={() => removeSoftSkill(index)}
                  variant="ghost"
                  size="sm"
                  className="w-5 h-5 p-0 text-fuchsia-600 hover:bg-fuchsia-200"
                >
                  <FiX size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills Summary */}
      <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <FiTrendingUp size={20} className="text-violet-600" />
          <h4 className="font-semibold text-gray-800">Skills Summary</h4>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Technical Skills:</span>
            <span className="ml-2 text-violet-600 font-semibold">{data.technical.length}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Soft Skills:</span>
            <span className="ml-2 text-fuchsia-600 font-semibold">{data.soft.length}</span>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Total: <span className="font-semibold">{data.technical.length + data.soft.length}</span> skills
          {data.technical.length + data.soft.length >= 10 && (
            <span className="ml-2 text-green-600 font-medium">✓ Great skill diversity!</span>
          )}
        </div>
      </div>

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

export default Skills