import axios, { AxiosInstance, AxiosError } from 'axios'

// Backend API URL - can be changed via environment variables
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api'

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
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

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
  addBidder: (tenderId: string, companyName: string) =>
    apiClient.post(`/tenders/${tenderId}/bidders`, { company_name: companyName }),

  getBidders: (tenderId: string) =>
    apiClient.get(`/tenders/${tenderId}/bidders`),

  uploadBidderDocuments: (tenderId: string, bidderId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(
      `/tenders/${tenderId}/bidders/${bidderId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  getBidderDocuments: (tenderId: string, bidderId: string) =>
    apiClient.get(`/tenders/${tenderId}/bidders/${bidderId}/documents`),

  deleteBidder: (tenderId: string, bidderId: string) =>
    apiClient.delete(`/tenders/${tenderId}/bidders/${bidderId}`),
}

// ====== EVALUATION ENDPOINTS ======
export const evaluationAPI = {
  triggerEvaluation: (tenderId: string) =>
    apiClient.post(`/tenders/${tenderId}/evaluate`, {}),

  getEvaluationResults: (tenderId: string) =>
    apiClient.get(`/tenders/${tenderId}/evaluation-results`),

  getBidderEvaluation: (tenderId: string, bidderId: string) =>
    apiClient.get(`/tenders/${tenderId}/bidders/${bidderId}/evaluation`),

  checkEvaluationStatus: (tenderId: string) =>
    apiClient.get(`/tenders/${tenderId}/evaluation-status`),
}

// ====== REVIEW ENDPOINTS ======
export const reviewAPI = {
  getReviewQueue: () =>
    apiClient.get('/review/queue'),

  overrideVerdict: (tenderId: string, bidderId: string, verdict: string, reasoning: string) =>
    apiClient.post(
      `/tenders/${tenderId}/bidders/${bidderId}/override`,
      { verdict, reasoning }
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
  getAuditLogs: (filters?: any, page: number = 1, limit: number = 20) =>
    apiClient.get('/audit-logs', { params: { ...filters, page, limit } }),

  getAuditLogDetails: (logId: string) =>
    apiClient.get(`/audit-logs/${logId}`),
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
