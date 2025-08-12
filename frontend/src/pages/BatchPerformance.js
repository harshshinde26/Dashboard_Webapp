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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Button,
  IconButton,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import DownloadIcon from '@mui/icons-material/Download';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { customerAPI, batchJobAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import moment from 'moment';

const COLORS = ['#48bb78', '#667eea', '#ed8936', '#f56565', '#4299e1'];

const BatchPerformance = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [batchJobs, setBatchJobs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [failureAnalysis, setFailureAnalysis] = useState(null);
  const [longRunningAnalysis, setLongRunningAnalysis] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState(null);

  // Product options
  const productOptions = [
    { value: 'FACETS', label: 'Facets' },
    { value: 'QNXT', label: 'QNXT' },
    { value: 'CAE', label: 'CAE' },
    { value: 'TMS', label: 'TMS' },
    { value: 'EDM', label: 'EDM' },
    { value: 'CLSP', label: 'CLSP' },
  ];

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadBatchJobs();
      loadSummary();
      loadFailureAnalysis();
      loadLongRunningAnalysis();
    }
  }, [selectedCustomer, selectedProduct, startDate, endDate]);

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data.results || response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('Failed to load customers');
      toast.error('Failed to load customers');
      setLoading(false);
    }
  };

  const loadBatchJobs = async () => {
    try {
      setLoading(true);
      const params = { customer: selectedCustomer };
      if (selectedProduct) {
        params.product = selectedProduct;
      }
      if (startDate) {
        params.date_from = moment(startDate).format('YYYY-MM-DD');
      }
      if (endDate) {
        params.date_to = moment(endDate).format('YYYY-MM-DD');
      }
      
      // Add page_size to load all records (not just 50)
      const response = await batchJobAPI.getAll({
        ...params,
        page_size: 10000
      });
      setBatchJobs(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading batch jobs:', error);
      toast.error('Failed to load batch jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const params = { customer: selectedCustomer };
      if (selectedProduct) {
        params.product = selectedProduct;
      }
      if (startDate) {
        params.date_from = moment(startDate).format('YYYY-MM-DD');
      }
      if (endDate) {
        params.date_to = moment(endDate).format('YYYY-MM-DD');
      }
      
      const response = await batchJobAPI.getSummary(params);
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading summary:', error);
      toast.error('Failed to load summary data');
    }
  };

  const loadFailureAnalysis = async () => {
    try {
      const params = { customer: selectedCustomer };
      if (selectedProduct) {
        params.product = selectedProduct;
      }
      if (startDate) {
        params.date_from = moment(startDate).format('YYYY-MM-DD');
      }
      if (endDate) {
        params.date_to = moment(endDate).format('YYYY-MM-DD');
      }
      
      const response = await batchJobAPI.getFailureAnalysis(params);
      setFailureAnalysis(response.data);
    } catch (error) {
      console.error('Error loading failure analysis:', error);
      toast.error('Failed to load failure analysis data');
    }
  };

  const loadLongRunningAnalysis = async () => {
    try {
      const params = { customer: selectedCustomer };
      if (selectedProduct) {
        params.product = selectedProduct;
      }
      if (startDate) {
        params.date_from = moment(startDate).format('YYYY-MM-DD');
      }
      if (endDate) {
        params.date_to = moment(endDate).format('YYYY-MM-DD');
      }
      
      const response = await batchJobAPI.getLongRunningAnalysis(params);
      setLongRunningAnalysis(response.data);
    } catch (error) {
      console.error('Error loading long running analysis:', error);
      toast.error('Failed to load long running analysis data');
    }
  };

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

  const getChartData = () => {
    if (!summary) return [];
    return [
      { name: 'Completed Normal', value: summary.completed_normal || 0, color: '#48bb78' },
      { name: 'Completed Normal*', value: summary.completed_normal_star || 0, color: '#667eea' },
      { name: 'Completed Abnormal', value: summary.completed_abnormal || 0, color: '#ed8936' },
      { name: 'Failed', value: summary.failed || 0, color: '#f56565' },
      { name: 'Long Running', value: summary.long_running || 0, color: '#4299e1' },
    ].filter(item => item.value > 0);
  };

  const getBarChartData = () => {
    if (!summary) return [];
    return [
      { name: 'Completed Normal', value: summary.completed_normal || 0, color: '#48bb78' },
      { name: 'Completed Normal*', value: summary.completed_normal_star || 0, color: '#667eea' },
      { name: 'Completed Abnormal', value: summary.completed_abnormal || 0, color: '#ed8936' },
      { name: 'Failed', value: summary.failed || 0, color: '#f56565' },
      { name: 'Long Running', value: summary.long_running || 0, color: '#4299e1' },
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

  // Custom tooltip styling for batch performance chart
  const customBatchTooltipStyle = {
    backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#ffffff',
    border: theme.palette.mode === 'dark' ? '1px solid #555555' : '1px solid #cccccc',
    borderRadius: '8px',
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const downloadFilteredData = () => {
    if (batchJobs.length === 0) {
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

    const csvData = batchJobs.map(job => [
      job.job_name || '',
      getStatusLabel(job.status) || '',
      job.start_time ? moment(job.start_time).format('YYYY-MM-DD HH:mm:ss') : '',
      job.end_time ? moment(job.end_time).format('YYYY-MM-DD HH:mm:ss') : '',
      job.duration_minutes ? job.duration_minutes.toFixed(2) : '',
      job.exit_code !== null ? job.exit_code : '',
      job.is_long_running ? 'Yes' : 'No',
      (() => {
        const customer = customers.find(c => c.id == selectedCustomer);
        return customer ? `${customer.name} (${customer.code}) - ${customer.product}` : 'Unknown Customer';
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
    const dateFilter = startDate || endDate ? `_${startDate ? moment(startDate).format('YYYYMMDD') : 'start'}_to_${endDate ? moment(endDate).format('YYYYMMDD') : 'end'}` : '';
    const filename = `batch_performance_data_${customerName}${dateFilter}_${timestamp}.csv`;
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloaded ${batchJobs.length} records to ${filename}`);
  };

  if (loading && !customers.length) {
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Batch Success and Performance Analysis
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Select Customer</InputLabel>
            <Select
              value={selectedCustomer}
              label="Select Customer"
              onChange={(e) => setSelectedCustomer(e.target.value)}
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
            <InputLabel>Select Product</InputLabel>
            <Select
              value={selectedProduct}
              label="Select Product"
              onChange={(e) => setSelectedProduct(e.target.value)}
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

      {/* Active Filters Display */}
      {(selectedCustomer || selectedProduct || startDate || endDate) && (
        <Box sx={{ mb: 3 }}>
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
          </Box>
        </Box>
      )}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                  📊 Total Jobs
                </Typography>
                <Typography variant="h4" component="div" color="primary">
                  {summary.total_jobs}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                  ✅ Success Rate
                </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {summary.success_rate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                  ❌ Failure Rate
                </Typography>
                <Typography variant="h4" component="div" color="error.main">
                  {summary.total_jobs > 0 ? 
                    (((summary.failed || 0) + (summary.completed_abnormal || 0)) / summary.total_jobs * 100).toFixed(2) : 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                  ⏱️ Long Running Jobs
                </Typography>
                <Typography variant="h4" component="div" color="warning.main">
                  {summary.long_running}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                  ⏰ Avg Duration
                </Typography>
                <Typography variant="h4" component="div" color="info.main">
                  {summary.average_duration} min
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
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
                  Job Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={450}>
                  <PieChart>
                    <Pie
                      data={getChartData()}
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
                      {getChartData().map((entry, index) => (
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
                  {getChartData().map((item, index) => (
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
                  Job Status Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getBarChartData()}>
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
                      {getBarChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Success vs Failure Rate Chart */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Success vs Failure Rate Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={[
                      {
                        status: 'Success',
                        count: (summary.completed_normal || 0) + (summary.completed_normal_star || 0),
                        percentage: summary.success_rate || 0,
                        color: '#00C49F'
                      },
                      {
                        status: 'Failure/Abnormal',
                        count: (summary.failed || 0) + (summary.completed_abnormal || 0),
                        percentage: summary.total_jobs > 0 ? 
                          (((summary.failed || 0) + (summary.completed_abnormal || 0)) / summary.total_jobs * 100).toFixed(2) : 0,
                        color: '#FF8042'
                      }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="status" 
                      style={{ fontSize: '14px', fontWeight: 'bold' }}
                    />
                    <YAxis 
                      label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value}%`,
                        'Percentage'
                      ]}
                      labelFormatter={(label) => {
                        const item = [
                          {
                            status: 'Success',
                            count: (summary.completed_normal || 0) + (summary.completed_normal_star || 0),
                            percentage: summary.success_rate || 0,
                            color: '#00C49F'
                          },
                          {
                            status: 'Failure/Abnormal',
                            count: (summary.failed || 0) + (summary.completed_abnormal || 0),
                            percentage: summary.total_jobs > 0 ? 
                              (((summary.failed || 0) + (summary.completed_abnormal || 0)) / summary.total_jobs * 100).toFixed(2) : 0,
                            color: '#FF8042'
                          }
                        ].find(d => d.status === label);
                        return `${label}: ${item?.count || 0} jobs (${item?.percentage || 0}%)`;
                      }}
                    />
                    <Bar 
                      dataKey="percentage" 
                      fill="#8884d8"
                      name="Percentage"
                    >
                      {[
                        {
                          status: 'Success',
                          count: (summary.completed_normal || 0) + (summary.completed_normal_star || 0),
                          percentage: summary.success_rate || 0,
                          color: '#00C49F'
                        },
                        {
                          status: 'Failure/Abnormal',
                          count: (summary.failed || 0) + (summary.completed_abnormal || 0),
                          percentage: summary.total_jobs > 0 ? 
                            (((summary.failed || 0) + (summary.completed_abnormal || 0)) / summary.total_jobs * 100).toFixed(2) : 0,
                          color: '#FF8042'
                        }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Summary Table */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Summary Statistics
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell align="right"><strong>Count</strong></TableCell>
                          <TableCell align="right"><strong>%</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <Chip label="Success" color="success" size="small" />
                          </TableCell>
                          <TableCell align="right">
                            {(summary.completed_normal || 0) + (summary.completed_normal_star || 0)}
                          </TableCell>
                          <TableCell align="right">
                            <strong>{summary.success_rate || 0}%</strong>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Chip label="Failure/Abnormal" color="error" size="small" />
                          </TableCell>
                          <TableCell align="right">
                            {(summary.failed || 0) + (summary.completed_abnormal || 0)}
                          </TableCell>
                          <TableCell align="right">
                            <strong>
                              {summary.total_jobs > 0 ? 
                                (((summary.failed || 0) + (summary.completed_abnormal || 0)) / summary.total_jobs * 100).toFixed(2) : 0}%
                            </strong>
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                          <TableCell><strong>Grand Total</strong></TableCell>
                          <TableCell align="right"><strong>{summary.total_jobs || 0}</strong></TableCell>
                          <TableCell align="right"><strong>100.00%</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Failure Analysis Section */}
      {failureAnalysis && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  🚫 Failure Analysis - Multiple Instances
                </Typography>
                
                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                          Total Jobs with Failures
                        </Typography>
                        <Typography variant="h5" color="error">
                          {failureAnalysis.summary.jobs_with_failures}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#667eea', fontWeight: '500' }}>
                          out of {failureAnalysis.failure_analysis.length} total job types
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                          Overall Failure Rate
                        </Typography>
                        <Typography variant="h5" color="error">
                          {failureAnalysis.summary.overall_failure_rate}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#667eea', fontWeight: '500' }}>
                          across all jobs
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                          Total Failures
                        </Typography>
                        <Typography variant="h5" color="error">
                          {failureAnalysis.summary.total_failures}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#667eea', fontWeight: '500' }}>
                          failed + abnormal jobs
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Per-Job Failure Analysis Table */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ color: '#f56565', fontWeight: 'bold' }}>
                    📊 Per-Job Failure Statistics
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Job Name</TableCell>
                          <TableCell align="right">Total Runs</TableCell>
                          <TableCell align="right">Total Failures</TableCell>
                          <TableCell align="right">Failure Rate</TableCell>
                          <TableCell align="right">Success Rate</TableCell>
                          <TableCell>Impact Level</TableCell>
                          <TableCell>Recent Failure</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {failureAnalysis.failure_analysis
                          .filter(job => job.total_failures > 0)
                          .map((job) => (
                            <TableRow key={job.job_name}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {job.job_name}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ color: '#667eea', fontWeight: '600' }}>
                                  {job.total_runs}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={job.total_failures}
                                  color="error"
                                  size="small"
                                />
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                  (<Typography component="span" sx={{ color: '#f56565', fontWeight: 'bold' }}>{job.failed_runs} failed</Typography> + <Typography component="span" sx={{ color: '#ed8936', fontWeight: 'bold' }}>{job.abnormal_runs} abnormal</Typography>)
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="error.main" fontWeight="bold">
                                  {job.failure_rate}%
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="success.main">
                                  {job.success_rate}%
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={job.impact_level}
                                  color={
                                    job.impact_level === 'High' ? 'error' :
                                    job.impact_level === 'Medium' ? 'warning' : 'default'
                                  }
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: job.recent_failure_time ? '#f56565' : '#48bb78',
                                    fontWeight: '500'
                                  }}
                                >
                                  {job.recent_failure_time ? 
                                    moment(job.recent_failure_time).format('YYYY-MM-DD HH:mm') : 'None'
                                  }
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {failureAnalysis.failure_analysis.filter(job => job.total_failures > 0).length === 0 && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      🎉 No jobs with failures found in the current selection!
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Long Running Job Analysis Section */}
      {longRunningAnalysis && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="warning.main">
                  ⏱️ Long Running Job Analysis - Performance Issues
                </Typography>
                
                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                          Jobs with Performance Issues
                        </Typography>
                        <Typography variant="h5" color="warning.main">
                          {longRunningAnalysis.summary.jobs_with_performance_issues}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          out of {longRunningAnalysis.long_running_analysis.length} total job types
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                          Overall Long Running Rate
                        </Typography>
                        <Typography variant="h5" color="warning.main">
                          {longRunningAnalysis.summary.overall_long_running_rate}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#667eea', fontWeight: '500' }}>
                          across all jobs
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                          Total Long Running Jobs
                        </Typography>
                        <Typography variant="h5" color="warning.main">
                          {longRunningAnalysis.summary.total_long_running}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          flagged as slow
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                          Average Duration
                        </Typography>
                        <Typography variant="h5" color="info.main">
                          {longRunningAnalysis.summary.overall_avg_duration}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          minutes
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Per-Job Long Running Analysis Table */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ color: '#ed8936', fontWeight: 'bold' }}>
                    ⚡ Per-Job Performance Statistics
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Job Name</TableCell>
                          <TableCell align="right">Total Runs</TableCell>
                          <TableCell align="right">Long Running Count</TableCell>
                          <TableCell align="right">Long Running Rate</TableCell>
                          <TableCell align="right">Avg Duration</TableCell>
                          <TableCell align="right">Max Duration</TableCell>
                          <TableCell>Impact Level</TableCell>
                          <TableCell align="right">Performance Score</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {longRunningAnalysis.long_running_analysis
                          .filter(job => job.long_running_count > 0)
                          .map((job) => (
                            <TableRow key={job.job_name}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {job.job_name}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ color: '#667eea', fontWeight: '600' }}>
                                  {job.total_runs}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={job.long_running_count}
                                  color="warning"
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="warning.main" fontWeight="bold">
                                  {job.long_running_rate}%
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ color: '#4299e1', fontWeight: 'bold' }}>
                                  {job.avg_duration} min
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="error.main">
                                  {job.max_duration} min
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={job.impact_level}
                                  color={
                                    job.impact_level === 'High' ? 'error' :
                                    job.impact_level === 'Medium' ? 'warning' : 'default'
                                  }
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="success.main" fontWeight="bold">
                                  {job.performance_score}%
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {longRunningAnalysis.long_running_analysis.filter(job => job.long_running_count > 0).length === 0 && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      ✅ No jobs with performance issues found in the current selection!
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Job Details Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ color: '#667eea', fontWeight: 'bold' }}>
              📋 Job Details
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadFilteredData}
              disabled={batchJobs.length === 0}
            >
              Download ({batchJobs.length} records)
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
                    {batchJobs
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
                count={batchJobs.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default BatchPerformance; 