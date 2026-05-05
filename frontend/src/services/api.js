import axios from 'axios';
// Backend API URL - can be changed via environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Request interceptor - Add token to headers
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use((response) => response, (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    // Handle other errors
    if (error.response) {
        console.error('[API Error]', error.response.status, error.response.data);
    }
    else if (error.request) {
        console.error('[API Error] No response:', error.request);
    }
    else {
        console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
});
// ====== AUTH ENDPOINTS ======
export const authAPI = {
    login: (email, password) => apiClient.post('/auth/login', { email, password }),
    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        return Promise.resolve();
    },
    getCurrentUser: () => apiClient.get('/auth/me'),
};
// ====== TENDERS ENDPOINTS ======
export const tendersAPI = {
    uploadTender: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post('/tenders/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    getTenders: () => apiClient.get('/tenders'),
    getTenderById: (tenderId) => apiClient.get(`/tenders/${tenderId}`),
    updateTender: (tenderId, data) => apiClient.put(`/tenders/${tenderId}`, data),
    deleteTender: (tenderId) => apiClient.delete(`/tenders/${tenderId}`),
};
// ====== CRITERIA ENDPOINTS ======
export const criteriaAPI = {
    getCriteria: (tenderId) => apiClient.get(`/tenders/${tenderId}/criteria`),
    addCriteria: (tenderId, data) => apiClient.post(`/tenders/${tenderId}/criteria`, data),
    updateCriteria: (tenderId, criteriaId, data) => apiClient.put(`/tenders/${tenderId}/criteria/${criteriaId}`, data),
    deleteCriteria: (tenderId, criteriaId) => apiClient.delete(`/tenders/${tenderId}/criteria/${criteriaId}`),
    confirmCriteria: (tenderId) => apiClient.post(`/tenders/${tenderId}/criteria/confirm`, {}),
};
// ====== BIDDERS ENDPOINTS ======
export const biddersAPI = {
    addBidder: (tenderId, companyName) => apiClient.post(`/tenders/${tenderId}/bidders`, { company_name: companyName }),
    getBidders: (tenderId) => apiClient.get(`/tenders/${tenderId}/bidders`),
    uploadBidderDocuments: (tenderId, bidderId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post(`/tenders/${tenderId}/bidders/${bidderId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    getBidderDocuments: (tenderId, bidderId) => apiClient.get(`/tenders/${tenderId}/bidders/${bidderId}/documents`),
    deleteBidder: (tenderId, bidderId) => apiClient.delete(`/tenders/${tenderId}/bidders/${bidderId}`),
};
// ====== EVALUATION ENDPOINTS ======
export const evaluationAPI = {
    triggerEvaluation: (tenderId) => apiClient.post(`/tenders/${tenderId}/evaluate`, {}),
    getEvaluationResults: (tenderId) => apiClient.get(`/tenders/${tenderId}/evaluation-results`),
    getBidderEvaluation: (tenderId, bidderId) => apiClient.get(`/tenders/${tenderId}/bidders/${bidderId}/evaluation`),
    checkEvaluationStatus: (tenderId) => apiClient.get(`/tenders/${tenderId}/evaluation-status`),
};
// ====== REVIEW ENDPOINTS ======
export const reviewAPI = {
    getReviewQueue: () => apiClient.get('/review/queue'),
    overrideVerdict: (tenderId, bidderId, verdict, reasoning) => apiClient.post(`/tenders/${tenderId}/bidders/${bidderId}/override`, { verdict, reasoning }),
    completeReview: (tenderId) => apiClient.post(`/tenders/${tenderId}/review/complete`, {}),
};
// ====== REPORTS ENDPOINTS ======
export const reportsAPI = {
    getSummary: (tenderId) => apiClient.get(`/tenders/${tenderId}/summary`),
    generatePDF: (tenderId) => apiClient.get(`/tenders/${tenderId}/report/pdf`, { responseType: 'blob' }),
    generateExcel: (tenderId) => apiClient.get(`/tenders/${tenderId}/report/excel`, { responseType: 'blob' }),
    generateJSON: (tenderId) => apiClient.get(`/tenders/${tenderId}/report/json`),
    signOff: (tenderId, approverName, signature) => apiClient.post(`/tenders/${tenderId}/sign-off`, { approver_name: approverName, signature }),
};
// ====== AUDIT LOG ENDPOINTS ======
export const auditAPI = {
    getAuditLogs: (filters, page = 1, limit = 20) => apiClient.get('/audit-logs', { params: { ...filters, page, limit } }),
    getAuditLogDetails: (logId) => apiClient.get(`/audit-logs/${logId}`),
};
// ====== JOB STATUS ENDPOINTS ======
export const jobsAPI = {
    getJobStatus: (jobId) => apiClient.get(`/jobs/${jobId}`),
    pollJobStatus: (jobId, interval = 2000) => {
        return new Promise((resolve, reject) => {
            const checkStatus = async () => {
                try {
                    const response = await apiClient.get(`/jobs/${jobId}`);
                    if (response.data.status === 'completed' || response.data.status === 'failed') {
                        resolve(response.data);
                    }
                    else {
                        setTimeout(checkStatus, interval);
                    }
                }
                catch (error) {
                    reject(error);
                }
            };
            checkStatus();
        });
    },
};
export default apiClient;
