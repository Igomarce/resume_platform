const API_BASE_URL = '/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }))
    throw new Error(error.error || 'An error occurred')
  }
  return response.json()
}

// Auth API
export const authAPI = {
  signup: async (name, email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
    return handleResponse(response)
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    return handleResponse(response)
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Files API
export const filesAPI = {
  upload: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    })
    return handleResponse(response)
  },

  getFile: async (fileId) => {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  downloadFile: async (fileId) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/download`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    })
    return response.blob()
  }
}

// OCR API
export const ocrAPI = {
  runOCR: async (fileId, docType = 'resume') => {
    const response = await fetch(`${API_BASE_URL}/ocr/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ file_id: fileId, doc_type: docType })
    })
    return handleResponse(response)
  },

  getDocument: async (documentId) => {
    const response = await fetch(`${API_BASE_URL}/ocr/${documentId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  editDocument: async (documentId, editedText) => {
    const response = await fetch(`${API_BASE_URL}/ocr/${documentId}/edit`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ edited_text: editedText })
    })
    return handleResponse(response)
  }
}

// Resume API
export const resumeAPI = {
  analyze: async (documentId, model = 'gpt-4.1-mini', provider = 'openai') => {
    const response = await fetch(`${API_BASE_URL}/resume/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ document_id: documentId, model, provider })
    })
    return handleResponse(response)
  },

  getProfile: async (profileId) => {
    const response = await fetch(`${API_BASE_URL}/resume/${profileId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  updateProfile: async (profileId, data) => {
    const response = await fetch(`${API_BASE_URL}/resume/${profileId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  listProfiles: async () => {
    const response = await fetch(`${API_BASE_URL}/resume/list`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Company API
export const companyAPI = {
  analyze: async (name, website = '', jobUrl = '', model = 'gpt-4.1-mini', provider = 'openai') => {
    const response = await fetch(`${API_BASE_URL}/company/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, website, job_url: jobUrl, model, provider })
    })
    return handleResponse(response)
  },

  getCompany: async (companyId) => {
    const response = await fetch(`${API_BASE_URL}/company/${companyId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  updateCompany: async (companyId, data) => {
    const response = await fetch(`${API_BASE_URL}/company/${companyId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  listCompanies: async () => {
    const response = await fetch(`${API_BASE_URL}/company/list`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Letter API
export const letterAPI = {
  generate: async (profileId, companyId, language = 'en', tone = 'formal', model = 'gpt-4.1-mini', provider = 'openai') => {
    const response = await fetch(`${API_BASE_URL}/letter/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ profile_id: profileId, company_id: companyId, language, tone, model, provider })
    })
    return handleResponse(response)
  },

  getLetter: async (letterId) => {
    const response = await fetch(`${API_BASE_URL}/letter/${letterId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  updateLetter: async (letterId, data) => {
    const response = await fetch(`${API_BASE_URL}/letter/${letterId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  listLetters: async () => {
    const response = await fetch(`${API_BASE_URL}/letter/list`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Email API
export const emailAPI = {
  createDraft: async (letterId, toEmail = '', cc = '', bcc = '') => {
    const response = await fetch(`${API_BASE_URL}/email/draft`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ letter_id: letterId, to_email: toEmail, cc, bcc })
    })
    return handleResponse(response)
  },

  getDraft: async (emailId) => {
    const response = await fetch(`${API_BASE_URL}/email/${emailId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  updateDraft: async (emailId, data) => {
    const response = await fetch(`${API_BASE_URL}/email/${emailId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  listDrafts: async () => {
    const response = await fetch(`${API_BASE_URL}/email/list`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Settings API
export const settingsAPI = {
  getModels: async () => {
    const response = await fetch(`${API_BASE_URL}/settings/models`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  saveAPIKey: async (provider, apiKey, validate = false) => {
    const response = await fetch(`${API_BASE_URL}/settings/api-key`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ provider, api_key: apiKey, validate })
    })
    return handleResponse(response)
  },

  getAPIKeyStatus: async (provider) => {
    const response = await fetch(`${API_BASE_URL}/settings/api-key/${provider}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  deleteAPIKey: async (provider) => {
    const response = await fetch(`${API_BASE_URL}/settings/api-key/${provider}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

