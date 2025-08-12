import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { toast } from 'react-toastify';
import api, { slaAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const SLATracking = () => {
  const { theme } = useTheme();
  
  // State for SLA analysis results
  const [slaData, setSlaData] = useState([]);
  const [slaDefinitions, setSlaDefinitions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [completionTrends, setCompletionTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0); // 0: Analysis, 1: Definitions
  
  // Filters
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // SLA Definition dialog
  const [definitionDialog, setDefinitionDialog] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState(null);
  const [definitionForm, setDefinitionForm] = useState({
    customer: '',
    product: 'FACETS',
    job_name: '',
    sla_target_time: '23:50',
    description: '',
    is_active: true
  });
  
  // Summary state
  const [summary, setSummary] = useState({
    total_jobs: 0,
    sla_met: 0,
    sla_missed: 0,
    no_sla_defined: 0,
    sla_compliance_rate: 0
  });

  const productOptions = ['FACETS', 'QNXT', 'CAE', 'TMS', 'EDM', 'CLSP'];
  const statusOptions = ['MET', 'MISSED', 'AT_RISK', 'NO_SLA'];

  useEffect(() => {
    loadCustomers();
    loadSLAData();
    loadSLADefinitions();
    loadSummary();
    loadCompletionTrends();
  }, [selectedCustomer, selectedProduct, selectedStatus, startDate, endDate]);

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers/');
      setCustomers(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const loadSLAData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCustomer) params.append('customer', selectedCustomer);
      if (selectedProduct) params.append('product', selectedProduct);
      if (selectedStatus) params.append('sla_status', selectedStatus);
      if (startDate) params.append('date_from', startDate.format('YYYY-MM-DD'));
      if (endDate) params.append('date_to', endDate.format('YYYY-MM-DD'));

      const response = await api.get(`/sla-data/?${params}`);
      setSlaData(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading SLA data:', error);
      toast.error('Failed to load SLA data');
    } finally {
      setLoading(false);
    }
  };

  const loadSLADefinitions = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCustomer) params.append('customer', selectedCustomer);
      if (selectedProduct) params.append('product', selectedProduct);

      const response = await api.get(`/sla-definitions/?${params}`);
      setSlaDefinitions(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading SLA definitions:', error);
      toast.error('Failed to load SLA definitions');
    }
  };

  const loadSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCustomer) params.append('customer', selectedCustomer);
      if (selectedProduct) params.append('product', selectedProduct);
      if (startDate) params.append('date_from', startDate.format('YYYY-MM-DD'));
      if (endDate) params.append('date_to', endDate.format('YYYY-MM-DD'));

      const response = await api.get(`/sla-data/summary/?${params}`);
      setSummary(response.data || {
        total_jobs: 0,
        sla_met: 0,
        sla_missed: 0,
        no_sla_defined: 0,
        sla_compliance_rate: 0
      });
    } catch (error) {
      console.error('Error loading summary:', error);
      // Set default summary on error
      setSummary({
        total_jobs: 0,
        sla_met: 0,
        sla_missed: 0,
        no_sla_defined: 0,
        sla_compliance_rate: 0
      });
    }
  };

  const loadCompletionTrends = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCustomer) params.append('customer', selectedCustomer);
      if (selectedProduct) params.append('product', selectedProduct);
      if (selectedStatus) params.append('sla_status', selectedStatus);
      if (startDate) params.append('date_from', startDate.format('YYYY-MM-DD'));
      if (endDate) params.append('date_to', endDate.format('YYYY-MM-DD'));

      const response = await slaAPI.getCompletionTrends(Object.fromEntries(params));
      setCompletionTrends(response.data.trends || []);
    } catch (error) {
      console.error('Error loading completion trends:', error);
      setCompletionTrends([]);
    }
  };

  const triggerSLAAnalysis = async () => {
    try {
      setLoading(true);
      const data = {};
      if (selectedCustomer) data.customer_id = selectedCustomer;
      if (selectedProduct) data.product = selectedProduct;
      if (startDate) data.date_from = startDate.format('YYYY-MM-DD');
      if (endDate) data.date_to = endDate.format('YYYY-MM-DD');

      const response = await api.post('/sla-data/analyze/', data);
      toast.success(response.data.message);
      loadSLAData();
      loadSummary();
      loadCompletionTrends();
    } catch (error) {
      console.error('Error triggering SLA analysis:', error);
      toast.error('Failed to analyze SLA data');
    } finally {
      setLoading(false);
    }
  };

  const handleDefinitionSubmit = async () => {
    try {
      if (editingDefinition) {
        await api.put(`/sla-definitions/${editingDefinition.id}/`, definitionForm);
        toast.success('SLA definition updated successfully');
      } else {
        await api.post('/sla-definitions/', definitionForm);
        toast.success('SLA definition created successfully');
      }
      
      setDefinitionDialog(false);
      setEditingDefinition(null);
      setDefinitionForm({
        customer: '',
        product: 'FACETS',
        job_name: '',
        sla_target_time: '23:50',
        description: '',
        is_active: true
      });
      loadSLADefinitions();
    } catch (error) {
      console.error('Error saving SLA definition:', error);
      toast.error('Failed to save SLA definition');
    }
  };

  const clearFilters = () => {
    setSelectedCustomer('');
    setSelectedProduct('');
    setSelectedStatus('');
    setStartDate(null);
    setEndDate(null);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCustomer) count++;
    if (selectedProduct) count++;
    if (selectedStatus) count++;
    if (startDate) count++;
    if (endDate) count++;
    return count;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'MET': return 'success';
      case 'MISSED': return 'error';
      case 'AT_RISK': return 'warning';
      case 'NO_SLA': return 'default';
      default: return 'default';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return moment(timeString, 'HH:mm:ss').format('HH:mm');
  };

  // Chart data with theme-aware colors
  const pieData = [
    { name: 'SLA Met', value: summary.sla_met, color: '#4caf50' },
    { name: 'SLA Missed', value: summary.sla_missed, color: '#f44336' },
    { name: 'No SLA Defined', value: summary.no_sla_defined, color: theme.palette.mode === 'dark' ? '#757575' : '#9e9e9e' }
  ];

  // Custom label function for theme-aware text
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent === 0) return null; // Don't show labels for 0% slices
    
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
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip styling
  const customTooltipStyle = {
    backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#ffffff',
    border: theme.palette.mode === 'dark' ? '1px solid #555555' : '1px solid #cccccc',
    borderRadius: '4px',
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          SLA Tracking & Analysis
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Automated SLA compliance analysis based on batch performance data
        </Typography>

        {/* Tabs */}
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="SLA Analysis" />
          <Tab label="SLA Definitions" />
        </Tabs>

        {currentTab === 0 && (
          <>
            {/* Filters */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Filters & Analysis
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Customer</InputLabel>
                      <Select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        label="Customer"
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
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Product</InputLabel>
                      <Select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        label="Product"
                      >
                        <MenuItem value="">All Products</MenuItem>
                        {productOptions.map((product) => (
                          <MenuItem key={product} value={product}>
                            {product}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="">All Status</MenuItem>
                        {statusOptions.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status.replace('_', ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={setStartDate}
                      renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={setEndDate}
                      renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        onClick={triggerSLAAnalysis}
                        disabled={loading}
                        size="small"
                      >
                        Analyze SLA
                      </Button>
                      {getActiveFiltersCount() > 0 && (
                        <Button
                          variant="outlined"
                          onClick={clearFilters}
                          size="small"
                        >
                          Clear ({getActiveFiltersCount()})
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>

                {/* Active Filters */}
                {getActiveFiltersCount() > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedCustomer && (
                      <Chip
                        label={`Customer: ${customers.find(c => c.id.toString() === selectedCustomer.toString())?.name || 'Unknown'}`}
                        onDelete={() => setSelectedCustomer('')}
                        color="primary"
                        size="small"
                      />
                    )}
                    {selectedProduct && (
                      <Chip
                        label={`Product: ${selectedProduct}`}
                        onDelete={() => setSelectedProduct('')}
                        color="primary"
                        size="small"
                      />
                    )}
                    {selectedStatus && (
                      <Chip
                        label={`Status: ${selectedStatus}`}
                        onDelete={() => setSelectedStatus('')}
                        color="primary"
                        size="small"
                      />
                    )}
                    {startDate && (
                      <Chip
                        label={`From: ${startDate.format('YYYY-MM-DD')}`}
                        onDelete={() => setStartDate(null)}
                        color="primary"
                        size="small"
                      />
                    )}
                    {endDate && (
                      <Chip
                        label={`To: ${endDate.format('YYYY-MM-DD')}`}
                        onDelete={() => setEndDate(null)}
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Total Jobs Analyzed
                    </Typography>
                    <Typography variant="h4">
                      {summary.total_jobs}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      SLA Compliance Rate
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {summary.sla_compliance_rate ? `${summary.sla_compliance_rate.toFixed(1)}%` : '0%'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      SLA Met
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {summary.sla_met}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      SLA Missed
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {summary.sla_missed}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card 
                  sx={{
                    backgroundColor: 'background.paper',
                    border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                      SLA Compliance Overview
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          stroke={theme.palette.mode === 'dark' ? '#444444' : '#ffffff'}
                          strokeWidth={2}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={customTooltipStyle}
                          formatter={(value, name) => [value, name]}
                          labelStyle={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}
                        />
                        <Legend 
                          wrapperStyle={{
                            color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Legend with better styling for dark mode */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
                      {pieData.map((entry, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              backgroundColor: entry.color,
                              borderRadius: '2px'
                            }} 
                          />
                          <Typography variant="body2" sx={{ color: entry.color, fontSize: '0.85rem', fontWeight: '600' }}>
                            {entry.name}: {entry.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card 
                  sx={{
                    backgroundColor: 'background.paper',
                    border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                      Batch Completion Time Trends
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={completionTrends}>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke={theme.palette.mode === 'dark' ? '#444444' : '#e0e0e0'}
                        />
                        <XAxis 
                          dataKey="date" 
                          tick={{ 
                            fontSize: 12, 
                            fill: theme.palette.mode === 'dark' ? '#ffffff' : '#666666' 
                          }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          axisLine={{ stroke: theme.palette.mode === 'dark' ? '#666666' : '#cccccc' }}
                          tickLine={{ stroke: theme.palette.mode === 'dark' ? '#666666' : '#cccccc' }}
                        />
                        <YAxis 
                          domain={['dataMin - 10', 'dataMax + 10']}
                          tick={{ 
                            fontSize: 12, 
                            fill: theme.palette.mode === 'dark' ? '#ffffff' : '#666666' 
                          }}
                          tickFormatter={(value) => {
                            const hours = Math.floor(value / 60);
                            const minutes = Math.floor(value % 60);
                            return `${hours}:${minutes.toString().padStart(2, '0')}`;
                          }}
                          axisLine={{ stroke: theme.palette.mode === 'dark' ? '#666666' : '#cccccc' }}
                          tickLine={{ stroke: theme.palette.mode === 'dark' ? '#666666' : '#cccccc' }}
                        />
                        <Tooltip 
                          contentStyle={customTooltipStyle}
                          formatter={(value, name) => [
                            `${Math.floor(value / 60)}:${(value % 60).toFixed(0).padStart(2, '0')}`,
                            'Completion Time'
                          ]}
                          labelFormatter={(label) => `Date: ${label}`}
                          labelStyle={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="completion_time_minutes" 
                          stroke="#2196f3" 
                          strokeWidth={2}
                          dot={{ fill: '#2196f3', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#2196f3', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* SLA Analysis Results Table */}
            <Card 
              sx={{
                backgroundColor: 'background.paper',
                border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                  SLA Analysis Results
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Job Name</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Product</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>SLA Target</TableCell>
                          <TableCell>Actual Completion</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Variance</TableCell>
                          <TableCell>Business Impact</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {slaData.length > 0 ? (
                          slaData.map((item) => (
                            <TableRow key={`${item.id}-${item.date}`}>
                              <TableCell>{item.job_name}</TableCell>
                              <TableCell>{item.customer_name}</TableCell>
                              <TableCell>{item.product}</TableCell>
                              <TableCell>{moment(item.date).format('YYYY-MM-DD')}</TableCell>
                              <TableCell>
                                {item.sla_target_time ? formatTime(item.sla_target_time) : 'No SLA'}
                              </TableCell>
                              <TableCell>
                                {item.actual_completion_time ? formatTime(item.actual_completion_time) : 'N/A'}
                                {item.completed_next_day && (
                                  <Chip label={`+${item.days_late}d`} size="small" color="error" sx={{ ml: 1 }} />
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={item.sla_status}
                                  color={getStatusColor(item.sla_status)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {item.variance_minutes !== 0 && (
                                  <Typography
                                    color={item.variance_minutes > 0 ? 'error' : 'success'}
                                    variant="body2"
                                  >
                                    {item.variance_minutes > 0 ? '+' : ''}{item.variance_minutes.toFixed(1)}m
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {item.business_impact}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={9} align="center">
                              <Alert severity="info">
                                No SLA analysis data found. Click "Analyze SLA" to generate analysis from batch performance data.
                              </Alert>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {currentTab === 1 && (
          <>
            {/* SLA Definitions */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    SLA Definitions
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setDefinitionDialog(true)}
                  >
                    Add SLA Definition
                  </Button>
                </Box>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Customer</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell>Job Name</TableCell>
                        <TableCell>SLA Target Time</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {slaDefinitions.map((definition) => (
                        <TableRow key={definition.id}>
                          <TableCell>{definition.customer_name}</TableCell>
                          <TableCell>{definition.product}</TableCell>
                          <TableCell>{definition.job_name}</TableCell>
                          <TableCell>{formatTime(definition.sla_target_time)}</TableCell>
                          <TableCell>
                            <Chip
                              label={definition.is_active ? 'Active' : 'Inactive'}
                              color={definition.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => {
                                setEditingDefinition(definition);
                                setDefinitionForm({
                                  customer: definition.customer,
                                  product: definition.product,
                                  job_name: definition.job_name,
                                  sla_target_time: definition.sla_target_time,
                                  description: definition.description,
                                  is_active: definition.is_active
                                });
                                setDefinitionDialog(true);
                              }}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        )}

        {/* SLA Definition Dialog */}
        <Dialog open={definitionDialog} onClose={() => setDefinitionDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingDefinition ? 'Edit SLA Definition' : 'Add SLA Definition'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    value={definitionForm.customer}
                    onChange={(e) => setDefinitionForm({ ...definitionForm, customer: e.target.value })}
                    label="Customer"
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.code}) - {customer.product}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={definitionForm.product}
                    onChange={(e) => setDefinitionForm({ ...definitionForm, product: e.target.value })}
                    label="Product"
                  >
                    {productOptions.map((product) => (
                      <MenuItem key={product} value={product}>
                        {product}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Job Name"
                  value={definitionForm.job_name}
                  onChange={(e) => setDefinitionForm({ ...definitionForm, job_name: e.target.value })}
                  helperText="Exact job name from batch performance data"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SLA Target Time"
                  type="time"
                  value={definitionForm.sla_target_time}
                  onChange={(e) => setDefinitionForm({ ...definitionForm, sla_target_time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="Expected completion time (24-hour format)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={definitionForm.description}
                  onChange={(e) => setDefinitionForm({ ...definitionForm, description: e.target.value })}
                  helperText="Optional description of this SLA"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={definitionForm.is_active}
                      onChange={(e) => setDefinitionForm({ ...definitionForm, is_active: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDefinitionDialog(false)}>Cancel</Button>
            <Button onClick={handleDefinitionSubmit} variant="contained">
              {editingDefinition ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default SLATracking; 