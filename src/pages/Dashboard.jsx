import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { resumeAPI, companyAPI, letterAPI } from '@/lib/api'
import { 
  FileText, 
  Building2, 
  Mail, 
  Upload,
  Loader2,
  Plus
} from 'lucide-react'
import '../App.css'

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState([])
  const [companies, setCompanies] = useState([])
  const [letters, setLetters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [profilesData, companiesData, lettersData] = await Promise.all([
        resumeAPI.listProfiles(),
        companyAPI.listCompanies(),
        letterAPI.listLetters()
      ])
      
      setProfiles(profilesData.profiles || [])
      setCompanies(companiesData.companies || [])
      setLetters(lettersData.letters || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      title: 'Resumes',
      value: profiles.length,
      icon: FileText,
      color: 'bg-blue-500',
      action: () => navigate('/upload')
    },
    {
      title: 'Companies',
      value: companies.length,
      icon: Building2,
      color: 'bg-green-500',
      action: () => navigate('/analyze-company')
    },
    {
      title: 'Letters',
      value: letters.length,
      icon: Mail,
      color: 'bg-purple-500',
      action: () => navigate('/generate-letter')
    }
  ]

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.name}! Manage your resumes, companies, and cover letters.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card 
                key={stat.title}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={stat.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with your job application workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => navigate('/upload')}
              >
                <Upload className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Upload Resume</div>
                  <div className="text-sm text-gray-500">
                    Upload and analyze your resume
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => navigate('/analyze-company')}
              >
                <Building2 className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Analyze Company</div>
                  <div className="text-sm text-gray-500">
                    Research a target company
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => navigate('/generate-letter')}
              >
                <Mail className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Generate Letter</div>
                  <div className="text-sm text-gray-500">
                    Create a personalized cover letter
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => navigate('/settings')}
              >
                <Plus className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Configure AI</div>
                  <div className="text-sm text-gray-500">
                    Set up your API keys
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Letters */}
        {letters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Cover Letters</CardTitle>
              <CardDescription>
                Your latest generated cover letters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {letters.slice(0, 5).map((letter) => (
                  <div
                    key={letter.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {letter.subject}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(letter.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={letter.status === 'draft' ? 'secondary' : 'default'}>
                        {letter.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/generate-letter?letter=${letter.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}

