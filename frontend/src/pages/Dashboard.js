import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import DownloadIcon from '@mui/icons-material/Download';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { dashboardAPI, customerAPI, batchJobAPI, slaAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import moment from 'moment';

const COLORS = ['#48bb78', '#667eea', '#ed8936', '#f56565', '#4299e1', '#764ba2'];

const Dashboard = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [customers, setCustomers] = useState([]);
  
  // Filter states
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedSpecificJob, setSelectedSpecificJob] = useState(''); // New state for job details
  const [selectedProduct, setSelectedProduct] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // Available options for filters
  const [availableJobNames, setAvailableJobNames] = useState([]);
  
  // Product options
  const productOptions = [
    { value: 'FACETS', label: 'Facets' },
    { value: 'QNXT', label: 'QNXT' },
    { value: 'CAE', label: 'CAE' },
    { value: 'TMS', label: 'TMS' },
    { value: 'EDM', label: 'EDM' },
    { value: 'CLSP', label: 'CLSP' },
  ];
  
  // Data states
  const [batchSummary, setBatchSummary] = useState(null);
  const [slaSummary, setSlaSummary] = useState(null);
  const [batchJobs, setBatchJobs] = useState([]);
  const [error, setError] = useState(null);

  // Job details table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadDashboardData();
    loadCustomers();
    loadAvailableJobNames();
  }, []);

  useEffect(() => {
    if (selectedCustomer || selectedProduct || startDate || endDate) {
      loadFilteredData();
    } else {
      // Reset to overview data when no filters are applied
      setBatchSummary(null);
      setSlaSummary(null);
      setBatchJobs([]);
    }
  }, [selectedCustomer, selectedProduct, startDate, endDate]);

  useEffect(() => {
    // Update charts when specific job is selected
    if (selectedSpecificJob && selectedSpecificJob.trim() && batchJobs.length > 0) {
      updateChartsForSelectedJob();
    } else if (batchJobs.length > 0) {
      // Reset to filtered data summary
      calculateBatchSummaryFromJobs(batchJobs);
    }
  }, [selectedSpecificJob, batchJobs]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getOverview();
      setOverview(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const loadAvailableJobNames = async () => {
    try {
      const response = await batchJobAPI.getAll({ page_size: 1000 });
      const jobs = response.data.results || response.data;
      const uniqueJobNames = [...new Set(jobs.map(job => job.job_name))].sort();
      setAvailableJobNames(uniqueJobNames);
    } catch (error) {
      console.error('Error loading job names:', error);
      // Don't show error toast for this as it's not critical
    }
  };

  const loadFilteredData = async () => {
    try {
      setLoading(true);
      
      // Build filter parameters
      const batchParams = {};
      const slaParams = {};
      
      if (selectedCustomer) {
        batchParams.customer = selectedCustomer;
        slaParams.customer = selectedCustomer;
      }

      if (selectedProduct) {
        batchParams.product = selectedProduct;
        slaParams.product = selectedProduct;
      }

      if (startDate) {
        batchParams.date_from = moment(startDate).format('YYYY-MM-DD');
        slaParams.date_from = moment(startDate).format('YYYY-MM-DD');
      }

      if (endDate) {
        batchParams.date_to = moment(endDate).format('YYYY-MM-DD');
        slaParams.date_to = moment(endDate).format('YYYY-MM-DD');
      }

      // Load batch jobs with filters (increased page size for more records)
      const batchJobsResponse = await batchJobAPI.getAll({
        ...batchParams,
        page_size: 10000
      });
      setBatchJobs(batchJobsResponse.data.results || batchJobsResponse.data);

      // Load batch summary for all cases (backend now supports summary without customer requirement)
      const batchSummaryPromise = batchJobAPI.getSummary(batchParams);
      
      // Load SLA summary only if customer is selected (SLA still requires customer context)
      const promises = [batchSummaryPromise];
      if (selectedCustomer) {
        promises.push(slaAPI.getSummary(slaParams));
      }
      
      const responses = await Promise.all(promises);
      setBatchSummary(responses[0].data);
      
      if (selectedCustomer && responses[1]) {
        setSlaSummary(responses[1].data);
      } else {
        setSlaSummary(null);
      }
      
    } catch (error) {
      console.error('Error loading filtered data:', error);
      toast.error('Failed to load filtered data');
    } finally {
      setLoading(false);
    }
  };

  const calculateBatchSummaryFromJobs = (jobs) => {
    if (!jobs || jobs.length === 0) {
      setBatchSummary(null);
      return;
    }

    const summary = {
      total_jobs: jobs.length,
      completed_normal: jobs.filter(job => job.status === 'COMPLETED_NORMAL').length,
      completed_normal_star: jobs.filter(job => job.status === 'COMPLETED_NORMAL_STAR').length,
      completed_abnormal: jobs.filter(job => job.status === 'COMPLETED_ABNORMAL').length,
      failed: jobs.filter(job => job.status === 'FAILED').length,
      long_running: jobs.filter(job => job.status === 'LONG_RUNNING' || job.is_long_running).length,
      success_rate: 0,
      average_duration: 0
    };

    // Only count COMPLETED_NORMAL and COMPLETED_NORMAL_STAR as successful
    // COMPLETED_ABNORMAL should not be considered successful
    const successfulJobs = summary.completed_normal + summary.completed_normal_star;
    summary.success_rate = jobs.length > 0 ? Math.round((successfulJobs / jobs.length) * 100) : 0;

    const jobsWithDuration = jobs.filter(job => job.duration_minutes);
    if (jobsWithDuration.length > 0) {
      const totalDuration = jobsWithDuration.reduce((sum, job) => sum + job.duration_minutes, 0);
      summary.average_duration = Math.round(totalDuration / jobsWithDuration.length);
    }

    setBatchSummary(summary);
  };

  const updateChartsForSelectedJob = () => {
    const jobSpecificData = batchJobs.filter(job => 
      job.job_name.toLowerCase().includes(selectedSpecificJob.toLowerCase().trim())
    );
    calculateBatchSummaryFromJobs(jobSpecificData);
  };

  const getFilteredJobsForTable = () => {
    if (selectedSpecificJob && selectedSpecificJob.trim()) {
      return batchJobs.filter(job => 
        job.job_name.toLowerCase().includes(selectedSpecificJob.toLowerCase().trim())
      );
    }
    return batchJobs;
  };

  const getUniqueJobNamesFromCurrentData = () => {
    return [...new Set(batchJobs.map(job => job.job_name))].sort();
  };

  const handleCustomerChange = (event) => {
    setSelectedCustomer(event.target.value);
    setSelectedSpecificJob(''); // Reset specific job selection when customer changes
  };

  const handleProductChange = (event) => {
    setSelectedProduct(event.target.value);
    setSelectedSpecificJob(''); // Reset specific job selection when product changes
  };

  const handleSpecificJobChange = (event) => {
    setSelectedSpecificJob(event.target.value);
    setPage(0); // Reset pagination when job changes
  };

  const clearFilters = () => {
    setSelectedCustomer('');
    setSelectedProduct('');
    setSelectedSpecificJob('');
    setStartDate(null);
    setEndDate(null);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCustomer) count++;
    if (selectedProduct) count++;
    if (startDate) count++;
    if (endDate) count++;
    return count;
  };

  const downloadFilteredData = () => {
    const dataToDownload = getFilteredJobsForTable();
    
    if (dataToDownload.length === 0) {
      toast.warn('No data available to download');
      return;
    }

    // Convert data to CSV format
    const headers = [
      'Job Name',
      'Status', 
      'Start Time',
      'End Time',
      'Duration (min)',
      'Exit Code',
      'Long Running',
      'Customer',
      'Month',
      'JobRun ID'
    ];

    const csvData = dataToDownload.map(job => [
      job.job_name || '',
      getStatusLabel(job.status) || '',
      job.start_time ? moment(job.start_time).format('YYYY-MM-DD HH:mm:ss') : '',
      job.end_time ? moment(job.end_time).format('YYYY-MM-DD HH:mm:ss') : '',
      job.duration_minutes ? job.duration_minutes.toFixed(2) : '',
      job.exit_code !== null ? job.exit_code : '',
      job.is_long_running ? 'Yes' : 'No',
      (() => {
        const customer = customers.find(c => c.id == selectedCustomer);
        return customer ? `${customer.name} (${customer.code}) - ${customer.product}` : 'All Customers';
      })(),
      job.month || '',
      job.jobrun_id || ''
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename
    const timestamp = moment().format('YYYYMMDD_HHmmss');
    const customerName = selectedCustomer ? 
      (() => {
        const customer = customers.find(c => c.id == selectedCustomer);
        return customer ? `${customer.name}_${customer.code}_${customer.product}`.replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown_Customer';
      })() : 'All_Customers';
    const jobFilter = selectedSpecificJob ? `_${selectedSpecificJob.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const monthFilter = ''; // Removed month filter from filename
    const filename = `batch_dashboard_data_${customerName}${jobFilter}_${timestamp}.csv`;
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloaded ${dataToDownload.length} records to ${filename}`);
  };

  // Table pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Status handling functions (from BatchPerformance)
  const getStatusColor = (status) => {
    const statusColors = {
      COMPLETED_NORMAL: 'success',
      COMPLETED_ABNORMAL: 'warning',
      COMPLETED_NORMAL_STAR: 'info',
      LONG_RUNNING: 'primary',
      FAILED: 'error',
      PENDING: 'default',
    };
    return statusColors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      COMPLETED_NORMAL: 'Completed Normal',
      COMPLETED_ABNORMAL: 'Completed Abnormal',
      COMPLETED_NORMAL_STAR: 'Completed Normal*',
      LONG_RUNNING: 'Long Running',
      FAILED: 'Failed',
      PENDING: 'Pending',
    };
    return statusLabels[status] || status;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const getBatchStatusData = () => {
    if (!batchSummary) return [];
    return [
      { 
        name: 'Completed Normal', 
        value: batchSummary.completed_normal || 0, 
        color: '#48bb78' 
      },
      { 
        name: 'Completed Normal*', 
        value: batchSummary.completed_normal_star || 0, 
        color: '#667eea' 
      },
      { 
        name: 'Completed Abnormal', 
        value: batchSummary.completed_abnormal || 0, 
        color: '#ed8936' 
      },
      { 
        name: 'Failed', 
        value: batchSummary.failed || 0, 
        color: '#f56565' 
      },
      { 
        name: 'Long Running', 
        value: batchSummary.long_running || 0, 
        color: '#4299e1' 
      },
    ].filter(item => item.value > 0);
  };

  const getBarChartStatusData = () => {
    if (!batchSummary) return [];
    return [
      { name: 'Completed Normal', value: batchSummary.completed_normal || 0, color: '#48bb78' },
      { name: 'Completed Normal*', value: batchSummary.completed_normal_star || 0, color: '#667eea' },
      { name: 'Completed Abnormal', value: batchSummary.completed_abnormal || 0, color: '#ed8936' },
      { name: 'Failed', value: batchSummary.failed || 0, color: '#f56565' },
      { name: 'Long Running', value: batchSummary.long_running || 0, color: '#4299e1' },
    ];
  };

  const renderCustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    // Don't show label if percentage is too small to avoid overlap
    if (percent < 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill={theme.palette.mode === 'dark' ? '#ffffff' : '#000000'}
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="16"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip styling for batch status chart
  const customBatchTooltipStyle = {
    backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#ffffff',
    border: theme.palette.mode === 'dark' ? '1px solid #555555' : '1px solid #cccccc',
    borderRadius: '8px',
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  };

  const getSLAStatusData = () => {
    if (!slaSummary) return [];
    return [
      { name: 'SLA Met', value: slaSummary.sla_met },
      { name: 'SLA Missed', value: slaSummary.sla_missed },
      { name: 'At Risk', value: slaSummary.at_risk },
    ].filter(item => item.value > 0);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const filteredJobsForTable = getFilteredJobsForTable();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Enhanced Title Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography className="page-title" variant="h1" gutterBottom>
          Dashboard Overview
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Comprehensive Batch Operations Intelligence Platform
        </Typography>
        <Box sx={{ 
          width: 80, 
          height: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          mx: 'auto',
          mb: 3
        }} />
      </Box>

      {/* Enhanced Filter Section */}
      <Paper className="glass-effect" sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography className="section-title" variant="h6" gutterBottom>
          Batch Data Filters
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Customer</InputLabel>
              <Select
                value={selectedCustomer}
                label="Customer"
                onChange={handleCustomerChange}
              >
                <MenuItem value="">All Customers</MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name} ({customer.code}) - {customer.product}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Product</InputLabel>
              <Select
                value={selectedProduct}
                label="Product"
                onChange={handleProductChange}
              >
                <MenuItem value="">All Products</MenuItem>
                {productOptions.map((product) => (
                  <MenuItem key={product.value} value={product.value}>
                    {product.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                inputFormat="YYYY-MM-DD"
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                inputFormat="YYYY-MM-DD"
                minDate={startDate}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>

        {/* Clear Filters Button Row */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Box display="flex" gap={1} alignItems="center">
              <Button 
                variant="outlined" 
                onClick={clearFilters}
                disabled={getActiveFiltersCount() === 0}
              >
                Clear Filters
              </Button>
              {getActiveFiltersCount() > 0 && (
                <Chip 
                  label={`${getActiveFiltersCount()} filter${getActiveFiltersCount() > 1 ? 's' : ''} applied`}
                  color="primary" 
                  size="small"
                />
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Job Details Filter */}
        {batchJobs.length > 0 && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Enter Job Name for Details"
                value={selectedSpecificJob}
                onChange={handleSpecificJobChange}
                placeholder="Type job name (leave empty for all jobs)"
                helperText="Enter job name to filter details and charts"
              />
            </Grid>
          </Grid>
        )}

        {/* Active Filters Display */}
        {(selectedCustomer || selectedProduct || selectedSpecificJob || startDate || endDate) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Active Filters:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {selectedCustomer && (
                <Chip
                  label={`Customer: ${(() => {
                    const customer = customers.find(c => c.id == selectedCustomer);
                    return customer ? `${customer.name} (${customer.code}) - ${customer.product}` : selectedCustomer;
                  })()}`}
                  onDelete={() => setSelectedCustomer('')}
                  color="primary"
                  size="small"
                />
              )}
              {selectedProduct && (
                <Chip
                  label={`Product: ${productOptions.find(p => p.value === selectedProduct)?.label || selectedProduct}`}
                  onDelete={() => setSelectedProduct('')}
                  color="primary"
                  size="small"
                />
              )}
              {startDate && (
                <Chip
                  label={`From: ${moment(startDate).format('YYYY-MM-DD')}`}
                  onDelete={() => setStartDate(null)}
                  color="primary"
                  size="small"
                />
              )}
              {endDate && (
                <Chip
                  label={`To: ${moment(endDate).format('YYYY-MM-DD')}`}
                  onDelete={() => setEndDate(null)}
                  color="primary"
                  size="small"
                />
              )}
              {selectedSpecificJob && (
                <Chip
                  label={`Job Details: ${selectedSpecificJob}`}
                  onDelete={() => setSelectedSpecificJob('')}
                  color="secondary"
                  size="small"
                />
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Overview Metrics */}
      {overview && !getActiveFiltersCount() && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="dashboard-card floating">
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  {overview.total_customers}
                </Box>
                <Typography variant="h6" component="div" className="gradient-text" sx={{ mb: 1 }}>
                  Total Customers
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {overview.active_customers} active
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card className="dashboard-card floating">
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}>
                  {overview.total_jobs_today}
                </Box>
                <Typography variant="h6" component="div" className="gradient-text" sx={{ mb: 1 }}>
                  Jobs Today
                </Typography>
                <Typography variant="body2" color="success.main">
                  {overview.successful_jobs_today} successful
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card className="dashboard-card floating">
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}>
                  {overview.sla_compliance_rate}%
                </Box>
                <Typography variant="h6" component="div" className="gradient-text" sx={{ mb: 1 }}>
                  SLA Compliance
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Last 30 days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card className="dashboard-card floating">
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}>
                  {overview.average_processing_efficiency}%
                </Box>
                <Typography variant="h6" component="div" className="gradient-text" sx={{ mb: 1 }}>
                  Processing Efficiency
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Average
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtered Results Summary */}
      {getActiveFiltersCount() > 0 && batchJobs.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card className="dashboard-card">
              <CardContent>
                <Typography className="section-title" variant="h6" gutterBottom>
                  {selectedSpecificJob ? `Job Details Summary: ${selectedSpecificJob}` : 'Filtered Results Summary'}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box textAlign="center">
                      <Typography variant="h3" color="primary">
                        {selectedSpecificJob ? filteredJobsForTable.length : batchJobs.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Jobs Found
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box textAlign="center">
                      <Typography variant="h3" color="success.main">
                        {(selectedSpecificJob ? filteredJobsForTable : batchJobs).filter(job => job.status === 'COMPLETED_NORMAL' || job.status === 'COMPLETED_NORMAL_STAR').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Completed Normal
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box textAlign="center">
                      <Typography variant="h3" color="warning.main">
                        {(selectedSpecificJob ? filteredJobsForTable : batchJobs).filter(job => job.status === 'COMPLETED_ABNORMAL').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Completed Abnormal
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Batch Job Status Chart */}
        {batchSummary && (
          <Grid item xs={12} md={6}>
            <Card 
              className="dashboard-card"
              sx={{
                backgroundColor: 'background.paper',
                border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
              }}
            >
              <CardContent>
                <Typography className="section-title" variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                  {selectedSpecificJob ? `Job Status Distribution - ${selectedSpecificJob}` : 'Batch Job Status Distribution'}
                </Typography>
                <ResponsiveContainer width="100%" height={450}>
                  <PieChart>
                    <Pie
                      data={getBatchStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomPieLabel}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      stroke={theme.palette.mode === 'dark' ? '#444444' : '#ffffff'}
                      strokeWidth={2}
                    >
                      {getBatchStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={customBatchTooltipStyle}
                      formatter={(value, name) => [value, name]}
                      labelStyle={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={50}
                      iconType="circle"
                      wrapperStyle={{ 
                        fontSize: '14px',
                        color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                        fontWeight: '500'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Summary Statistics */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  {getBatchStatusData().map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: item.color,
                          borderRadius: '50%',
                          mr: 1
                        }}
                      />
                      <Typography variant="body2" sx={{ color: item.color, fontSize: '0.85rem', fontWeight: '600' }}>
                        {item.name}: {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Batch Job Status Breakdown Bar Chart */}
        {batchSummary && (
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardContent>
                <Typography className="section-title" variant="h6" gutterBottom>
                  {selectedSpecificJob ? `Job Status Breakdown - ${selectedSpecificJob}` : 'Job Status Breakdown'}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getBarChartStatusData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      style={{ fontSize: '11px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value">
                      {getBarChartStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* SLA Status Chart - only show when not filtering by specific job */}
        {slaSummary && !selectedSpecificJob && (
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardContent>
                <Typography className="section-title" variant="h6" gutterBottom>
                  SLA Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getSLAStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getSLAStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Performance Metrics */}
        {batchSummary && (
          <Grid item xs={12}>
            <Card sx={{ minHeight: slaSummary && !selectedSpecificJob ? 200 : 160 }}>
              <CardContent sx={{ pb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedSpecificJob ? `Performance Summary - ${selectedSpecificJob}` : 'Performance Summary'}
                </Typography>
                <Grid container spacing={slaSummary && !selectedSpecificJob ? 2 : 3} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6} md={slaSummary && !selectedSpecificJob ? 6 : 3}>
                    <Box 
                      textAlign="center" 
                      sx={{ 
                        p: slaSummary && !selectedSpecificJob ? 2 : 1,
                        minHeight: 80,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography 
                        variant={slaSummary && !selectedSpecificJob ? "h4" : "h3"} 
                        color="primary"
                        sx={{ fontWeight: 'bold', mb: 1 }}
                      >
                        {batchSummary.success_rate}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                        Success Rate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={slaSummary && !selectedSpecificJob ? 6 : 3}>
                    <Box 
                      textAlign="center" 
                      sx={{ 
                        p: slaSummary && !selectedSpecificJob ? 2 : 1,
                        minHeight: 80,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography 
                        variant={slaSummary && !selectedSpecificJob ? "h4" : "h3"} 
                        color="error.main"
                        sx={{ fontWeight: 'bold', mb: 1 }}
                      >
                        {batchSummary.total_jobs > 0 ? 
                          (((batchSummary.failed || 0) + (batchSummary.completed_abnormal || 0)) / batchSummary.total_jobs * 100).toFixed(2) : 0}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                        Failure Rate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={slaSummary && !selectedSpecificJob ? 6 : 3}>
                    <Box 
                      textAlign="center" 
                      sx={{ 
                        p: slaSummary && !selectedSpecificJob ? 2 : 1,
                        minHeight: 80,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography 
                        variant={slaSummary && !selectedSpecificJob ? "h4" : "h3"} 
                        color="primary"
                        sx={{ fontWeight: 'bold', mb: 1 }}
                      >
                        {batchSummary.average_duration}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                        Avg Duration (min)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={slaSummary && !selectedSpecificJob ? 6 : 3}>
                    <Box 
                      textAlign="center" 
                      sx={{ 
                        p: slaSummary && !selectedSpecificJob ? 2 : 1,
                        minHeight: 80,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography 
                        variant={slaSummary && !selectedSpecificJob ? "h4" : "h3"} 
                        color="primary"
                        sx={{ fontWeight: 'bold', mb: 1 }}
                      >
                        {batchSummary.total_jobs}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                        Total Jobs
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Job Details Table */}
      {batchJobs.length > 0 && (
        <Card className="dashboard-card">
          <CardContent>
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              mb={2}
              sx={{
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 0 },
                alignItems: { xs: 'stretch', sm: 'center' }
              }}
            >
              <Typography className="section-title" variant="h6" sx={{ color: '#667eea', fontWeight: 'bold' }}>
                {selectedSpecificJob ? `📋 Job Details - ${selectedSpecificJob}` : '📋 Job Details'}
              </Typography>
              <Button
                className="btn-gradient"
                startIcon={<DownloadIcon />}
                onClick={downloadFilteredData}
                disabled={filteredJobsForTable.length === 0}
                sx={{ 
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  minWidth: { xs: 'auto', sm: '200px' },
                  width: { xs: '100%', sm: 'auto' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                Download ({filteredJobsForTable.length} records)
              </Button>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Job Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Start Time</TableCell>
                        <TableCell>End Time</TableCell>
                        <TableCell>Duration (min)</TableCell>
                        <TableCell>Exit Code</TableCell>
                        <TableCell>Long Running</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredJobsForTable
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((job) => (
                          <TableRow key={job.id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                                {job.job_name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(job.status)}
                                color={getStatusColor(job.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: '#48bb78', fontWeight: '500' }}>
                                {moment(job.start_time).format('YYYY-MM-DD HH:mm')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: job.end_time ? '#48bb78' : '#f56565', fontWeight: '500' }}>
                                {job.end_time ? moment(job.end_time).format('YYYY-MM-DD HH:mm') : 'N/A'}
                              </Typography>
                            </TableCell>
                                                          <TableCell>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: job.duration_minutes > 60 ? '#ed8936' : job.duration_minutes > 30 ? '#4299e1' : '#48bb78',
                                    fontWeight: '600'
                                  }}
                                >
                                  {job.duration_minutes ? `${job.duration_minutes.toFixed(1)} min` : 'N/A'}
                                </Typography>
                              </TableCell>
                            <TableCell>
                              <Chip
                                label={job.exit_code !== null ? job.exit_code : 'N/A'}
                                color={job.exit_code === 0 ? 'success' : job.exit_code > 0 ? 'error' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {job.is_long_running ? (
                                <Chip label="Yes" color="warning" size="small" />
                              ) : (
                                <Chip label="No" color="default" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  component="div"
                  count={filteredJobsForTable.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Dashboard; 