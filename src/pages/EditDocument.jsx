import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ocrAPI, resumeAPI } from '@/lib/api'
import { Loader2, Save, Sparkles } from 'lucide-react'
import '../App.css'

export default function EditDocument({ user, onLogout }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState(null)
  const [editedText, setEditedText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDocument()
  }, [id])

  const loadDocument = async () => {
    try {
      const response = await ocrAPI.getDocument(id)
      setDocument(response.document)
      setEditedText(response.edited_text || response.raw_text || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      await ocrAPI.editDocument(id, editedText)
      // Reload document to get updated version
      await loadDocument()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError('')

    try {
      // First save the current edits
      await ocrAPI.editDocument(id, editedText)
      
      // Then analyze the resume
      const response = await resumeAPI.analyze(id)
      
      // Navigate to analyze page
      navigate(`/analyze-resume/${response.profile.id}`)
    } catch (err) {
      setError(err.message)
      setAnalyzing(false)
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

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Document</h1>
            <p className="mt-2 text-gray-600">
              Review and edit the extracted text from your resume
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze with AI
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {/* Editor */}
        <div className="grid grid-cols-2 gap-6">
          {/* Original Text */}
          <Card>
            <CardHeader>
              <CardTitle>Original OCR Text</CardTitle>
              <CardDescription>
                Text extracted from your document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 h-[600px] overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {document?.raw_text || 'No text extracted'}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Editable Text */}
          <Card>
            <CardHeader>
              <CardTitle>Edited Text</CardTitle>
              <CardDescription>
                Make corrections and improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="h-[600px] font-mono text-sm"
                placeholder="Edit the text here..."
              />
              <div className="mt-2 text-sm text-gray-500 text-right">
                {editedText.length} characters
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">
              <strong>Tip:</strong> Review the extracted text carefully and make any necessary corrections. 
              Once you're satisfied, click "Analyze with AI" to extract structured information like skills, 
              experience, and education from your resume.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

