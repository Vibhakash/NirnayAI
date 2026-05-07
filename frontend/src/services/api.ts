import axios, { AxiosInstance, AxiosError } from 'axios'

// Backend API URL - can be changed via environment variables
const API_BASE_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000'
    : import.meta.env.VITE_API_URL;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    // Handle other errors
    if (error.response) {
      console.error('[API Error]', error.response.status, error.response.data)
    } else if (error.request) {
      console.error('[API Error] No response:', error.request)
    } else {
      console.error('[API Error]', error.message)
    }

    return Promise.reject(error)
  }
)

// ====== AUTH ENDPOINTS ======
export const authAPI = {
  login: (username: string, password: string) => {
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)
    return apiClient.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  },

  register: (data: {
    username: string
    email: string
    full_name: string
    password: string
    role: string
  }) => apiClient.post('/auth/register', data),

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    return Promise.resolve()
  },

  getCurrentUser: () =>
    apiClient.get('/auth/me'),
}

// ====== TENDERS ENDPOINTS ======
export const tendersAPI = {
  uploadTender: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/tenders/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: {
        title: file.name,
        department: "Default Department",
        reference_number: `REF-${Date.now()}`
      }
    })
  },

  getTenders: () =>
    apiClient.get('/tenders'),

  getTenderById: (tenderId: string) =>
    apiClient.get(`/tenders/${tenderId}`),

  updateTender: (tenderId: string, data: any) =>
    apiClient.put(`/tenders/${tenderId}`, data),

  deleteTender: (tenderId: string) =>
    apiClient.delete(`/tenders/${tenderId}`),
}

// ====== CRITERIA ENDPOINTS ======
export const criteriaAPI = {
  getCriteria: (tenderId: string) =>
    apiClient.get(`/tenders/${tenderId}/criteria`),

  addCriteria: (tenderId: string, data: any) =>
    apiClient.post(`/tenders/${tenderId}/criteria`, data),

  updateCriteria: (tenderId: string, criteriaId: string, data: any) =>
    apiClient.put(`/tenders/${tenderId}/criteria/${criteriaId}`, data),

  deleteCriteria: (tenderId: string, criteriaId: string) =>
    apiClient.delete(`/tenders/${tenderId}/criteria/${criteriaId}`),

  confirmCriteria: (tenderId: string) =>
    apiClient.post(`/tenders/${tenderId}/criteria/confirm`, {}),
}

// ====== BIDDERS ENDPOINTS ======
export const biddersAPI = {
  addBidder: (tenderId: string, companyName: string, file: File) => {
    const formData = new FormData()
    formData.append('name', companyName)
    formData.append('files', file)
    return apiClient.post(`/tenders/${tenderId}/bidders`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  getBidders: (tenderId: string) =>
    apiClient.get(`/tenders/${tenderId}/bidders`),

  deleteBidder: (tenderId: string, bidderId: string) =>
    apiClient.delete(`/tenders/${tenderId}/bidders/${bidderId}`),
}

// ====== EVALUATION ENDPOINTS ======
export const evaluationAPI = {
  triggerEvaluation: (tenderId: string) =>
    apiClient.post(`/tenders/${tenderId}/evaluate`, {}),

  getEvaluationResults: (tenderId: string) =>
    apiClient.get(`/tenders/${tenderId}/results`),

  getBidderEvaluation: (tenderId: string, bidderId: string) =>
    apiClient.get(`/tenders/${tenderId}/bidders/${bidderId}/evaluation`),

  checkEvaluationStatus: (tenderId: string) =>
    apiClient.get(`/tenders/${tenderId}/evaluation-status`),
}

// ====== REVIEW ENDPOINTS ======
export const reviewAPI = {
  getReviewQueue: (tenderId: string) =>
    apiClient.get(`/tenders/${tenderId}/review-queue`),

  overrideVerdict: (tenderId: string, verdictId: string, verdict: string, reasoning: string) =>
    apiClient.post(
      `/tenders/${tenderId}/review/${verdictId}`,
      { decision: verdict, reasoning }
    ),

  completeReview: (tenderId: string) =>
    apiClient.post(`/tenders/${tenderId}/review/complete`, {}),
}

// ====== REPORTS ENDPOINTS ======
export const reportsAPI = {
  getSummary: (tenderId: string) =>
    apiClient.get(`/tenders/${tenderId}/summary`),

  generatePDF: (tenderId: string) =>
    apiClient.get(`/tenders/${tenderId}/report/pdf`, { responseType: 'blob' }),

  generateExcel: (tenderId: string) =>
    apiClient.get(`/tenders/${tenderId}/report/excel`, { responseType: 'blob' }),

  generateJSON: (tenderId: string) =>
    apiClient.get(`/tenders/${tenderId}/report/json`),

  signOff: (tenderId: string, approverName: string, signature?: string) =>
    apiClient.post(`/tenders/${tenderId}/sign-off`, { approver_name: approverName, signature }),
}

// ====== AUDIT LOG ENDPOINTS ======
export const auditAPI = {
  getAuditLogs: (filters?: any, page: number = 1, page_size: number = 20) =>
    apiClient.get('/audit-log', { params: { ...filters, page, page_size } }),

  getAuditLogDetails: (logId: string) =>
    apiClient.get(`/audit-log/${logId}`),
}

// ====== JOB STATUS ENDPOINTS ======
export const jobsAPI = {
  getJobStatus: (jobId: string) =>
    apiClient.get(`/jobs/${jobId}`),

  pollJobStatus: (jobId: string, interval: number = 2000): Promise<any> => {
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const response = await apiClient.get(`/jobs/${jobId}`)
          if (response.data.status === 'completed' || response.data.status === 'failed') {
            resolve(response.data)
          } else {
            setTimeout(checkStatus, interval)
          }
        } catch (error) {
          reject(error)
        }
      }
      checkStatus()
    })
  },
}

export default apiClient
