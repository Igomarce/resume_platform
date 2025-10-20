import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { companyAPI } from '@/lib/api'
import { Loader2, Building2, Globe, Link as LinkIcon, Target, CheckCircle } from 'lucide-react'
import '../App.css'

export default function AnalyzeCompany({ user, onLogout }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [company, setCompany] = useState(null)

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setAnalyzing(true)
    setError('')
    setCompany(null)

    try {
      const response = await companyAPI.analyze(name, website, jobUrl)
      setCompany(response.company)
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleReset = () => {
    setName('')
    setWebsite('')
    setJobUrl('')
    setCompany(null)
    setError('')
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analyze Company</h1>
          <p className="mt-2 text-gray-600">
            Research a target company to understand their business and requirements
          </p>
        </div>

        {/* Input Form */}
        {!company && (
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Enter the company details to analyze
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Tesla, Inc."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobUrl">Job Posting URL (Optional)</Label>
                  <Input
                    id="jobUrl"
                    type="url"
                    placeholder="https://www.example.com/careers/job-123"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                  />
                </div>
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}
                <Button type="submit" disabled={analyzing} className="w-full">
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Company...
                    </>
                  ) : (
                    <>
                      <Building2 className="mr-2 h-4 w-4" />
                      Analyze Company
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {company && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Analysis Complete</h2>
                  <p className="text-sm text-gray-600">Company information extracted successfully</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleReset}>
                Analyze Another
              </Button>
            </div>

            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {company.name}
                </CardTitle>
                {(company.website || company.source_url) && (
                  <CardDescription className="flex flex-col gap-1 mt-2">
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-indigo-600 hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                        {company.website}
                      </a>
                    )}
                    {company.source_url && (
                      <a
                        href={company.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-indigo-600 hover:underline"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Job Posting
                      </a>
                    )}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {company.summary || 'No summary available'}
                </p>
              </CardContent>
            </Card>

            {/* Focus Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Focus Areas & Technologies
                </CardTitle>
                <CardDescription>
                  Key areas of business and technologies used
                </CardDescription>
              </CardHeader>
              <CardContent>
                {company.focus_areas && company.focus_areas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {company.focus_areas.map((area, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {area}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No focus areas identified</p>
                )}
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Key Requirements
                </CardTitle>
                <CardDescription>
                  Skills and qualifications the company is looking for
                </CardDescription>
              </CardHeader>
              <CardContent>
                {company.requirements && company.requirements.length > 0 ? (
                  <ul className="space-y-2">
                    {company.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No requirements identified</p>
                )}
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Ready to generate a personalized cover letter for this company?
                  </p>
                  <Button onClick={() => navigate('/generate-letter')}>
                    Generate Cover Letter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  )
}

