import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { filesAPI, ocrAPI } from '@/lib/api'
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react'
import '../App.css'

export default function UploadResume({ user, onLogout }) {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (selectedFile) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF, PNG, JPG, or DOCX file')
      return
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }
    
    setFile(selectedFile)
    setError('')
    setSuccess(false)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError('')

    try {
      // Upload file
      const uploadResponse = await filesAPI.upload(file)
      const fileId = uploadResponse.file.id

      // Process OCR
      setUploading(false)
      setProcessing(true)
      
      const ocrResponse = await ocrAPI.runOCR(fileId, 'resume')
      const documentId = ocrResponse.document.id

      setProcessing(false)
      setSuccess(true)

      // Navigate to edit page after 1 second
      setTimeout(() => {
        navigate(`/document/${documentId}`)
      }, 1000)

    } catch (err) {
      setError(err.message)
      setUploading(false)
      setProcessing(false)
    }
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Resume</h1>
          <p className="mt-2 text-gray-600">
            Upload your resume to extract and analyze the content
          </p>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select File</CardTitle>
            <CardDescription>
              Supported formats: PDF, PNG, JPG, DOCX (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.docx"
                onChange={handleFileInput}
              />
              
              <div className="space-y-4">
                {file ? (
                  <>
                    <div className="flex justify-center">
                      <div className="p-3 bg-green-100 rounded-full">
                        <FileText className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-upload').click()}
                    >
                      Choose Different File
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <div className="p-3 bg-indigo-100 rounded-full">
                        <Upload className="w-8 h-8 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Drag and drop your file here
                      </p>
                      <p className="text-sm text-gray-500 mt-1">or</p>
                    </div>
                    <Button
                      onClick={() => document.getElementById('file-upload').click()}
                    >
                      Browse Files
                    </Button>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-md flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 text-sm text-green-600 bg-green-50 rounded-md flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Resume uploaded and processed successfully! Redirecting...
              </div>
            )}

            {file && !success && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={uploading || processing}
                  className="min-w-[200px]"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing OCR...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload & Process
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="font-medium text-indigo-600">1.</span>
                <span>Your file will be uploaded securely to our servers</span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-indigo-600">2.</span>
                <span>OCR technology will extract text from your resume</span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-indigo-600">3.</span>
                <span>You'll be able to review and edit the extracted text</span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-indigo-600">4.</span>
                <span>AI will analyze your resume to extract skills and experience</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

