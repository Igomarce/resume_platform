import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { settingsAPI } from '@/lib/api'
import { Loader2, Key, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import '../App.css'

export default function Settings({ user, onLogout }) {
  const [models, setModels] = useState([])
  const [apiKeys, setApiKeys] = useState({})
  const [newApiKey, setNewApiKey] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const modelsData = await settingsAPI.getModels()
      setModels(modelsData.models || [])

      // Check API key status for each provider
      const providers = ['openai', 'google', 'anthropic']
      const keyStatuses = {}
      
      for (const provider of providers) {
        try {
          const status = await settingsAPI.getAPIKeyStatus(provider)
          keyStatuses[provider] = status.exists
        } catch (err) {
          keyStatuses[provider] = false
        }
      }
      
      setApiKeys(keyStatuses)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveApiKey = async () => {
    if (!newApiKey) {
      setError('Please enter an API key')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await settingsAPI.saveAPIKey(selectedProvider, newApiKey, false)
      setSuccess('API key saved successfully')
      setNewApiKey('')
      await loadSettings()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteApiKey = async (provider) => {
    if (!confirm(`Are you sure you want to delete the API key for ${provider}?`)) {
      return
    }

    try {
      await settingsAPI.deleteAPIKey(provider)
      setSuccess('API key deleted successfully')
      await loadSettings()
    } catch (err) {
      setError(err.message)
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your API keys and model preferences
          </p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 text-sm text-green-600 bg-green-50 rounded-md flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Available Models */}
        <Card>
          <CardHeader>
            <CardTitle>Available AI Models</CardTitle>
            <CardDescription>
              Models you can use for resume analysis and letter generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {models.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{model.name}</p>
                    <p className="text-sm text-gray-500">Provider: {model.provider}</p>
                  </div>
                  <Badge variant="secondary">{model.id}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API Key Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Key Status
            </CardTitle>
            <CardDescription>
              Current status of your configured API keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(apiKeys).map(([provider, exists]) => (
                <div
                  key={provider}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${exists ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {exists ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{provider}</p>
                      <p className="text-sm text-gray-500">
                        {exists ? 'API key configured' : 'No API key'}
                      </p>
                    </div>
                  </div>
                  {exists && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteApiKey(provider)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add/Update API Key */}
        <Card>
          <CardHeader>
            <CardTitle>Add or Update API Key</CardTitle>
            <CardDescription>
              Enter your API key to enable AI-powered features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <select
                id="provider"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="openai">OpenAI</option>
                <option value="google">Google</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Your API key is encrypted and stored securely
              </p>
            </div>

            <Button
              onClick={handleSaveApiKey}
              disabled={saving || !newApiKey}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Save API Key
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium text-gray-900 mb-2">Where to get API keys?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <strong>OpenAI:</strong>{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  platform.openai.com/api-keys
                </a>
              </li>
              <li>
                <strong>Google:</strong>{' '}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  console.cloud.google.com
                </a>
              </li>
              <li>
                <strong>Anthropic:</strong>{' '}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  console.anthropic.com
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

