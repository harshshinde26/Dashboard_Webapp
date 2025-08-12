import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  Button,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import {
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
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts';
import { volumetricsAPI, customerAPI } from '../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';

const Volumetrics = () => {
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedJobName, setSelectedJobName] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  // Load customers and data on component mount
  useEffect(() => {
    loadCustomers();
    loadVolumetricsData();
  }, []);

  // Reload data when filters change
  useEffect(() => {
    loadVolumetricsData();
  }, [selectedCustomer, selectedJobName, startDate, endDate]);

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadVolumetricsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (selectedCustomer) params.customer = selectedCustomer;
      if (selectedJobName) params.job_name = selectedJobName;
      if (startDate) params.date_from = moment(startDate).format('YYYY-MM-DD');
      if (endDate) params.date_to = moment(endDate).format('YYYY-MM-DD');

      // Load data
      const dataResponse = await volumetricsAPI.getAll(params);
      setData(dataResponse.data.results || dataResponse.data);

      // Load summary only if customer is selected or if we have any data
      if (selectedCustomer) {
        try {
          const summaryResponse = await volumetricsAPI.getSummary(params);
          setSummary(summaryResponse.data);
        } catch (summaryError) {
          console.error('Error loading volumetrics summary:', summaryError);
          setSummary(null);
        }
      } else {
        // Calculate basic summary from data when no customer filter
        const dataArray = dataResponse.data.results || dataResponse.data;
        if (dataArray && dataArray.length > 0) {
          const validItems = dataArray.filter(item => item.total_volume != null && item.records_processed_per_minute != null);
          
          const calculatedSummary = {
            total_volume: dataArray.reduce((sum, item) => sum + (item.total_volume || 0), 0),
            avg_volume: validItems.length > 0 ? 
              Math.round((dataArray.reduce((sum, item) => sum + (item.total_volume || 0), 0) / validItems.length) * 100) / 100 : 0,
            total_runtime: dataArray.reduce((sum, item) => sum + (item.total_runtime_minutes || 0), 0),
            avg_performance: validItems.length > 0 ? 
              Math.round((dataArray.reduce((sum, item) => sum + (item.records_processed_per_minute || 0), 0) / validItems.length) * 100) / 100 : 0,
            average_volume: validItems.length > 0 ? 
              Math.round((dataArray.reduce((sum, item) => sum + (item.total_volume || 0), 0) / validItems.length) * 100) / 100 : 0
          };
          
          setSummary(calculatedSummary);
        } else {
          setSummary(null);
        }
      }
    } catch (error) {
      console.error('Error loading volumetrics data:', error);
      setError('Failed to load volumetrics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCustomer('');
    setSelectedJobName('');
    setStartDate(null);
    setEndDate(null);
  };

  // Get count of active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCustomer) count++;
    if (selectedJobName) count++;
    if (startDate) count++;
    if (endDate) count++;
    return count;
  };

  // Download filtered data as CSV
  const downloadFilteredData = () => {
    if (data.length === 0) {
      toast.warn('No data available to download');
      return;
    }

    // Convert data to CSV format
    const headers = [
      'Job Name',
      'Date',
      'Customer',
      'Total Volume',
      'Runtime (min)',
      'Records/Min',
      'Peak Volume',
      'Average Volume',
      'Peak Runtime',
      'Average Runtime',
      'Processing Efficiency (%)',
      'Min Performance',
      'Max Performance'
    ];

    const csvData = data.map(row => [
      row.job_name || '',
      row.date ? moment(row.date).format('YYYY-MM-DD') : '',
      customers.find(c => c.id == selectedCustomer)?.name || row.customer_name || 'All Customers',
      row.total_volume || 0,
      row.total_runtime_minutes ? row.total_runtime_minutes.toFixed(2) : 0,
      row.records_processed_per_minute ? row.records_processed_per_minute.toFixed(2) : 0,
      row.peak_volume || '',
      row.average_volume ? row.average_volume.toFixed(2) : '',
      row.peak_runtime ? row.peak_runtime.toFixed(2) : '',
      row.average_runtime ? row.average_runtime.toFixed(2) : '',
      row.processing_efficiency ? row.processing_efficiency.toFixed(2) : '',
      row.min_performance ? row.min_performance.toFixed(2) : '',
      row.max_performance ? row.max_performance.toFixed(2) : ''
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
    const customerName = selectedCustomer ? customers.find(c => c.id == selectedCustomer)?.name.replace(/[^a-zA-Z0-9]/g, '_') : 'All_Customers';
    const jobFilter = selectedJobName ? `_${selectedJobName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const dateFilter = startDate || endDate ? `_${startDate ? moment(startDate).format('YYYYMMDD') : 'start'}_to_${endDate ? moment(endDate).format('YYYYMMDD') : 'end'}` : '';
    const filename = `volumetrics_data_${customerName}${jobFilter}${dateFilter}_${timestamp}.csv`;
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloaded ${data.length} records to ${filename}`);
  };

  // Prepare chart data with dual-axis metrics - job specific
  const chartData = data.map(item => ({
    name: item.job_name,
    volume: item.total_volume,
    runtime: item.total_runtime_minutes,
    efficiency: item.records_processed_per_minute,
    date: new Date(item.date).toLocaleDateString(),
    // Calculate volume per minute for dual-axis chart
    volume_per_min: item.total_runtime_minutes > 0 ? 
      Math.round((item.total_volume / item.total_runtime_minutes) * 100) / 100 : 0,
    rounds_per_min: item.records_processed_per_minute || 0,
    // Format for job-specific display with date and job name
    jobDateLabel: `${item.job_name} (${new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: '2-digit'
    })})`,
    // Short format for better readability
    shortLabel: `${item.job_name.length > 15 ? item.job_name.substring(0, 15) + '...' : item.job_name}`
  })).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date for proper time series

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Volumetrics Analysis
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Volumetrics Filters
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
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

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Job Name"
              value={selectedJobName}
              onChange={(e) => setSelectedJobName(e.target.value)}
              placeholder="Enter job name to filter"
              helperText="Filter by specific job name"
            />
          </Grid>

          <Grid item xs={12}>
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

          <Grid item xs={12}>
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
          <Grid item xs={12}>
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

        {/* Active Filters Display */}
        {(selectedCustomer || selectedJobName || startDate || endDate) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Active Filters:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {selectedCustomer && (
                <Chip
                  label={`Customer: ${customers.find(c => c.id == selectedCustomer)?.name || selectedCustomer}`}
                  onDelete={() => setSelectedCustomer('')}
                  color="primary"
                  size="small"
                />
              )}
              {selectedJobName && (
                <Chip
                  label={`Job: ${selectedJobName}`}
                  onDelete={() => setSelectedJobName('')}
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
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Volume
                </Typography>
                <Typography variant="h4">
                  {formatNumber(summary.total_volume)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Records processed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Volume
                </Typography>
                <Typography variant="h4">
                  {formatNumber(summary.avg_volume)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Per job
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Runtime
                </Typography>
                <Typography variant="h4">
                  {formatDuration(summary.total_runtime)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Processing time
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Performance
                </Typography>
                <Typography variant="h4">
                  {Math.round(summary.avg_performance || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Records/min
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Dual-Axis Volumetrics Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Volumetrics Analysis - RPM vs Runtime Performance
              </Typography>
              <ResponsiveContainer width="100%" height={500}>
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={12}
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left"
                    stroke="#00C49F"
                    label={{ value: 'Rounds Per Minute (RPM)', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    stroke="#FF6B6B"
                    label={{ value: 'Runtime (Minutes)', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      typeof value === 'number' ? Math.round(value * 100) / 100 : value,
                      name
                    ]}
                    labelFormatter={(label) => {
                      const item = chartData.find(d => d.date === label);
                      return item ? `Date: ${label} | Job: ${item.name}` : `Date: ${label}`;
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="rounds_per_min"
                    stroke="#00C49F"
                    strokeWidth={2}
                    dot={{ fill: '#00C49F', strokeWidth: 2, r: 4 }}
                    name="Rounds Per Minute (RPM)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="runtime"
                    stroke="#FF6B6B"
                    strokeWidth={2}
                    dot={{ fill: '#FF6B6B', strokeWidth: 2, r: 4 }}
                    name="Runtime (Minutes)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Volume Performance by Job
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  <Bar dataKey="volume" fill="#8884d8" name="Total Volume" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Processing Efficiency
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => Math.round(value)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="#82ca9d" 
                    name="Records/Min"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Detailed Volumetrics Data
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadFilteredData}
              disabled={data.length === 0}
            >
              Download ({data.length} records)
            </Button>
          </Box>
          
          {data.length === 0 ? (
            <Alert severity="info">
              No volumetrics data available. Upload volumetrics Excel files to see data here.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Job Name</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Total Volume</TableCell>
                    <TableCell align="right">Runtime</TableCell>
                    <TableCell align="right">Records/Min</TableCell>
                    <TableCell align="right">Peak Volume</TableCell>
                    <TableCell align="right">Efficiency</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell component="th" scope="row">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {row.job_name}
                          {row.customer_name && (
                            <Chip 
                              label={row.customer_name} 
                              size="small" 
                              sx={{ ml: 1 }} 
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(row.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(row.total_volume)}
                      </TableCell>
                      <TableCell align="right">
                        {formatDuration(row.total_runtime_minutes)}
                      </TableCell>
                      <TableCell align="right">
                        {Math.round(row.records_processed_per_minute || 0)}
                      </TableCell>
                      <TableCell align="right">
                        {row.peak_volume ? formatNumber(row.peak_volume) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {row.processing_efficiency ? 
                          `${Math.round(row.processing_efficiency)}%` : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Volumetrics; 