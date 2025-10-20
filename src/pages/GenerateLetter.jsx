import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { resumeAPI, companyAPI, letterAPI, emailAPI } from '@/lib/api'
import { Loader2, Sparkles, Mail, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import '../App.css'

export default function GenerateLetter({ user, onLogout }) {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState([])
  const [companies, setCompanies] = useState([])
  const [selectedProfile, setSelectedProfile] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [language, setLanguage] = useState('en')
  const [tone, setTone] = useState('formal')
  const [generating, setGenerating] = useState(false)
  const [letter, setLetter] = useState(null)
  const [editedLetter, setEditedLetter] = useState('')
  const [saving, setSaving] = useState(false)
  const [toEmail, setToEmail] = useState('')
  const [creatingDraft, setCreatingDraft] = useState(false)
  const [emailDraft, setEmailDraft] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [profilesData, companiesData] = await Promise.all([
        resumeAPI.listProfiles(),
        companyAPI.listCompanies()
      ])
      setProfiles(profilesData.profiles || [])
      setCompanies(companiesData.companies || [])
    } catch (err) {
      setError(err.message)
    }
  }

  const handleGenerate = async () => {
    if (!selectedProfile || !selectedCompany) {
      setError('Please select both a profile and a company')
      return
    }

    setGenerating(true)
    setError('')
    setLetter(null)
    setEmailDraft(null)

    try {
      const response = await letterAPI.generate(
        selectedProfile,
        selectedCompany,
        language,
        tone
      )
      setLetter(response.letter)
      setEditedLetter(response.letter.body)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!letter) return

    setSaving(true)
    setError('')

    try {
      await letterAPI.updateLetter(letter.id, {
        body: editedLetter,
        status: 'edited'
      })
      setLetter({ ...letter, body: editedLetter, status: 'edited' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateDraft = async () => {
    if (!letter) return

    setCreatingDraft(true)
    setError('')

    try {
      // First save the letter if edited
      if (editedLetter !== letter.body) {
        await letterAPI.updateLetter(letter.id, { body: editedLetter })
      }

      // Create email draft
      const response = await emailAPI.createDraft(letter.id, toEmail)
      setEmailDraft(response.email_draft)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreatingDraft(false)
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(editedLetter)
  }

  const handleOpenEmail = () => {
    if (emailDraft && emailDraft.mailto_link) {
      window.location.href = emailDraft.mailto_link
    }
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generate Cover Letter</h1>
          <p className="mt-2 text-gray-600">
            Create a personalized cover letter using AI
          </p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {/* Configuration */}
        {!letter && (
          <Card>
            <CardHeader>
              <CardTitle>Letter Configuration</CardTitle>
              <CardDescription>
                Select your profile, target company, and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile">Your Profile</Label>
                  <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                    <SelectTrigger id="profile">
                      <SelectValue placeholder="Select a profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          Profile {profile.id.substring(0, 8)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {profiles.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No profiles found.{' '}
                      <button
                        onClick={() => navigate('/upload')}
                        className="text-indigo-600 hover:underline"
                      >
                        Upload a resume
                      </button>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Target Company</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger id="company">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {companies.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No companies found.{' '}
                      <button
                        onClick={() => navigate('/analyze-company')}
                        className="text-indigo-600 hover:underline"
                      >
                        Analyze a company
                      </button>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="lv">Latvian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger id="tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedProfile || !selectedCompany}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Letter...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Generated Letter */}
        {letter && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Generated Cover Letter</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLetter(null)
                    setEditedLetter('')
                    setEmailDraft(null)
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate New
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{letter.subject}</CardTitle>
                <CardDescription>
                  Edit the letter below to personalize it further
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editedLetter}
                  onChange={(e) => setEditedLetter(e.target.value)}
                  className="min-h-[400px] font-sans text-base"
                />
                <div className="mt-2 text-sm text-gray-500 text-right">
                  {editedLetter.split(/\s+/).length} words
                </div>
              </CardContent>
            </Card>

            {/* Email Draft */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Draft
                </CardTitle>
                <CardDescription>
                  Prepare your email for sending
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="toEmail">Recipient Email</Label>
                  <Input
                    id="toEmail"
                    type="email"
                    placeholder="hr@company.com"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                  />
                </div>

                {!emailDraft ? (
                  <Button
                    onClick={handleCreateDraft}
                    disabled={creatingDraft || !toEmail}
                    className="w-full"
                  >
                    {creatingDraft ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Draft...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Prepare Email
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">
                        Email draft created successfully!
                      </p>
                    </div>
                    <Button
                      onClick={handleOpenEmail}
                      className="w-full"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Email Client
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  )
}

