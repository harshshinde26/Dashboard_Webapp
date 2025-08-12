import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Customer APIs
export const customerAPI = {
  getAll: (params = {}) => api.get('/customers/', { params }),
  getGrouped: () => api.get('/customers/grouped/'),
  getById: (id) => api.get(`/customers/${id}/`),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.put(`/customers/${id}/`, data),
  delete: (id) => api.delete(`/customers/${id}/`),
  getJobsCount: (id) => api.get(`/customers/${id}/jobs-count/`),
  
  // Customer Notes APIs
  getNotes: (customerId) => api.get(`/customers/${customerId}/notes/`),
  createNote: (data) => api.post('/customer-notes/', data),
  updateNote: (id, data) => api.put(`/customer-notes/${id}/`, data),
  deleteNote: (id) => api.delete(`/customer-notes/${id}/`),
  
  // Job Instructions APIs
  getJobInstructions: (customerId) => api.get(`/customers/${customerId}/job-instructions/`),
  createJobInstruction: (data) => api.post('/job-instructions/', data),
  updateJobInstruction: (id, data) => api.put(`/job-instructions/${id}/`, data),
  deleteJobInstruction: (id) => api.delete(`/job-instructions/${id}/`),
};

// Batch Jobs APIs
export const batchJobAPI = {
  getAll: (params = {}) => api.get('/batch-jobs/', { params }),
  getById: (id) => api.get(`/batch-jobs/${id}/`),
  create: (data) => api.post('/batch-jobs/', data),
  update: (id, data) => api.put(`/batch-jobs/${id}/`, data),
  delete: (id) => api.delete(`/batch-jobs/${id}/`),
  getSummary: (params = {}) => api.get('/batch-jobs/summary/', { params }),
  getFailureAnalysis: (params = {}) => api.get('/batch-jobs/failure_analysis/', { params }),
  getLongRunningAnalysis: (params = {}) => api.get('/batch-jobs/long_running_analysis/', { params }),
};

// Volumetrics APIs
export const volumetricsAPI = {
  getAll: (params = {}) => api.get('/volumetrics/', { params }),
  getById: (id) => api.get(`/volumetrics/${id}/`),
  create: (data) => api.post('/volumetrics/', data),
  update: (id, data) => api.put(`/volumetrics/${id}/`, data),
  delete: (id) => api.delete(`/volumetrics/${id}/`),
  getSummary: (params = {}) => api.get('/volumetrics/summary/', { params }),
};

// SLA Data APIs
export const slaAPI = {
  getAll: (params = {}) => api.get('/sla-data/', { params }),
  getById: (id) => api.get(`/sla-data/${id}/`),
  create: (data) => api.post('/sla-data/', data),
  update: (id, data) => api.put(`/sla-data/${id}/`, data),
  delete: (id) => api.delete(`/sla-data/${id}/`),
  getSummary: (params = {}) => api.get('/sla-data/summary/', { params }),
  getCompletionTrends: (params = {}) => api.get('/sla-data/completion_trends/', { params }),
};

// Batch Schedule APIs
export const batchScheduleAPI = {
  getAll: (params = {}) => api.get('/batch-schedules/', { params }),
  getById: (id) => api.get(`/batch-schedules/${id}/`),
  create: (data) => api.post('/batch-schedules/', data),
  update: (id, data) => api.put(`/batch-schedules/${id}/`, data),
  delete: (id) => api.delete(`/batch-schedules/${id}/`),
  download: (id) => api.get(`/batch-schedules/${id}/download/`, { responseType: 'blob' }),
  export: (params = {}) => api.get('/batch-schedules/export/', { 
    params, 
    responseType: 'blob',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }),
};

// File Upload APIs
export const fileUploadAPI = {
  getAll: (params = {}) => api.get('/file-uploads/', { params }),
  getById: (id) => api.get(`/file-uploads/${id}/`),
  create: (data) => api.post('/file-uploads/', data),
  update: (id, data) => api.put(`/file-uploads/${id}/`, data),
  delete: (id) => api.delete(`/file-uploads/${id}/`),
};

// File Processing APIs
export const fileProcessingAPI = {
  processFile: (data) => api.post('/process-file/', data),
  uploadFile: (formData) => api.post('/upload-file/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

// Dashboard APIs
export const dashboardAPI = {
  getOverview: (params = {}) => api.get('/dashboard-overview/', { params }),
  getHealth: () => api.get('/health/'),
};

// Smart Predictor APIs
export const smartPredictorAPI = {
  // Prediction Models
  getPredictionModels: (params = {}) => api.get('/prediction-models/', { params }),
  getPredictionModel: (id) => api.get(`/prediction-models/${id}/`),
  createPredictionModel: (data) => api.post('/prediction-models/', data),
  updatePredictionModel: (id, data) => api.put(`/prediction-models/${id}/`, data),
  deletePredictionModel: (id) => api.delete(`/prediction-models/${id}/`),
  trainModel: (id) => api.post(`/prediction-models/${id}/train/`),

  // Prediction Results
  getPredictionResults: (params = {}) => api.get('/prediction-results/', { params }),
  getPredictionResult: (id) => api.get(`/prediction-results/${id}/`),
  getUpcomingPredictions: (params = {}) => api.get('/prediction-results/upcoming/', { params }),
  getHighRiskPredictions: (params = {}) => api.get('/prediction-results/high_risk/', { params }),

  // Historical Patterns
  getHistoricalPatterns: (params = {}) => api.get('/historical-patterns/', { params }),
  getHistoricalPattern: (id) => api.get(`/historical-patterns/${id}/`),
  getTopPatterns: (params = {}) => api.get('/historical-patterns/top_patterns/', { params }),

  // Prediction Alerts
  getPredictionAlerts: (params = {}) => api.get('/prediction-alerts/', { params }),
  getPredictionAlert: (id) => api.get(`/prediction-alerts/${id}/`),
  getActiveAlerts: (params = {}) => api.get('/prediction-alerts/active/', { params }),
  acknowledgeAlert: (id) => api.post(`/prediction-alerts/${id}/acknowledge/`),
  resolveAlert: (id, data = {}) => api.post(`/prediction-alerts/${id}/resolve/`, data),

  // Main Prediction Operations
  runPredictions: (data) => api.post('/smart-predictor/', data),
  getDashboard: (params = {}) => api.get('/prediction-dashboard/', { params }),
  getAnalytics: (params = {}) => api.get('/prediction-analytics/', { params }),
};

// Authentication APIs
export const authAPI = {
  login: (credentials) => api.post('/login/', credentials),
  register: (userData) => api.post('/register/', userData),
};

// Utility functions
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

export const uploadFile = async (file, customerId, fileType, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('customer_id', customerId);
  formData.append('file_type', fileType);

  return api.post('/file-uploads/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

export default api; 