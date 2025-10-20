import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { resumeAPI } from '@/lib/api'
import { Loader2, Briefcase, Award, Target, FileText } from 'lucide-react'
import '../App.css'

export default function AnalyzeResume({ user, onLogout }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [id])

  const loadProfile = async () => {
    try {
      const response = await resumeAPI.getProfile(id)
      setProfile(response.profile)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    )
  }

  if (error || !profile) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">{error || 'Profile not found'}</p>
              <Button className="mt-4" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resume Analysis</h1>
            <p className="mt-2 text-gray-600">
              AI-powered analysis of your professional profile
            </p>
          </div>
          <Button onClick={() => navigate('/generate-letter')}>
            Generate Cover Letter
          </Button>
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Professional Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {profile.summary || 'No summary available'}
            </p>
          </CardContent>
        </Card>

        {/* Sectors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Industry Sectors
            </CardTitle>
            <CardDescription>
              Industries and sectors you have experience in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile.sectors && profile.sectors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.sectors.map((sector, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {sector}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No sectors identified</p>
            )}
          </CardContent>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Professional Roles
            </CardTitle>
            <CardDescription>
              Positions and roles you have held
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile.roles && profile.roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.roles.map((role, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {role}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No roles identified</p>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Skills & Competencies
            </CardTitle>
            <CardDescription>
              Technical and professional skills extracted from your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile.skills && profile.skills.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {profile.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="p-3 bg-indigo-50 rounded-lg border border-indigo-100"
                  >
                    <p className="text-sm font-medium text-indigo-900">
                      {skill}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills identified</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Ready to create a personalized cover letter based on this profile?
              </p>
              <Button onClick={() => navigate('/generate-letter')}>
                Generate Cover Letter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

