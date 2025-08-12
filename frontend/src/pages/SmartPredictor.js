import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
  Storage as VolumeIcon,
  Assessment as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { customerAPI, smartPredictorAPI } from '../services/api';
import { toast } from 'react-toastify';

const SmartPredictor = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customers, setCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [predictionTypes, setPredictionTypes] = useState(['all']);
  const [daysAhead, setDaysAhead] = useState(7);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, prediction: null });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadDashboardData();
      loadPredictions();
      loadAlerts();
      loadPatterns();
    }
  }, [selectedCustomer]);

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      
      // Handle both paginated and direct array responses
      let customersData = [];
      if (response.data && Array.isArray(response.data.results)) {
        // Paginated response from Django REST framework
        customersData = response.data.results;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        customersData = response.data;
      }
      
      setCustomers(customersData);
      if (customersData.length > 0) {
        setSelectedCustomer(customersData[0].id);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
      setCustomers([]); // Set empty array on error
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await smartPredictorAPI.getDashboard({ customer: selectedCustomer });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadPredictions = async () => {
    try {
      const response = await smartPredictorAPI.getPredictionResults({ customer: selectedCustomer });
      
      // Handle both paginated and direct array responses
      let predictionsData = [];
      if (response.data && Array.isArray(response.data.results)) {
        predictionsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        predictionsData = response.data;
      }
      
      setPredictions(predictionsData);
    } catch (error) {
      console.error('Error loading predictions:', error);
      toast.error('Failed to load predictions');
      setPredictions([]);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await smartPredictorAPI.getActiveAlerts({ customer: selectedCustomer });
      
      // Handle both paginated and direct array responses
      let alertsData = [];
      if (response.data && Array.isArray(response.data.results)) {
        alertsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        alertsData = response.data;
      }
      
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Failed to load alerts');
      setAlerts([]);
    }
  };

  const loadPatterns = async () => {
    try {
      const response = await smartPredictorAPI.getHistoricalPatterns({ customer: selectedCustomer });
      
      // Handle both paginated and direct array responses
      let patternsData = [];
      if (response.data && Array.isArray(response.data.results)) {
        patternsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        patternsData = response.data;
      }
      
      setPatterns(patternsData);
    } catch (error) {
      console.error('Error loading patterns:', error);
      toast.error('Failed to load patterns');
      setPatterns([]);
    }
  };

  const runPredictions = async () => {
    try {
      setLoading(true);
      const response = await smartPredictorAPI.runPredictions({
        customer_id: selectedCustomer,
        days_ahead: daysAhead,
        prediction_types: predictionTypes
      });
      
      toast.success(`Generated ${response.data.predictions_generated} predictions and ${response.data.alerts_generated} alerts`);
      setRunDialogOpen(false);
      
      // Reload data
      loadDashboardData();
      loadPredictions();
      loadAlerts();
    } catch (error) {
      toast.error('Failed to run predictions');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await smartPredictorAPI.acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      loadAlerts();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const resolveAlert = async (alertId, notes = '') => {
    try {
      await smartPredictorAPI.resolveAlert(alertId, {
        resolution_notes: notes
      });
      toast.success('Alert resolved');
      loadAlerts();
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <ErrorIcon color="error" />;
      case 'WARNING': return <WarningIcon color="warning" />;
      case 'INFO': return <InfoIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  const getPredictionTypeIcon = (type) => {
    switch (type) {
      case 'FAILURE': return <ErrorIcon />;
      case 'LONG_RUNNER': return <ScheduleIcon />;
      case 'SLA_MISS': return <SpeedIcon />;
      case 'HIGH_VOLUME': return <VolumeIcon />;
      default: return <TrendingUpIcon />;
    }
  };

  const formatConfidence = (confidence) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const formatRiskScore = (score) => {
    return score ? score.toFixed(1) : '0.0';
  };

  // Chart colors
  const COLORS = ['#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1'];

  const SummaryCards = () => {
    if (!dashboardData?.summary) return null;

    const { summary } = dashboardData;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Predictions
                  </Typography>
                  <Typography variant="h4">
                    {summary.total_predictions || 0}
                  </Typography>
                </Box>
                <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    High Risk
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {summary.high_risk_predictions || 0}
                  </Typography>
                </Box>
                <WarningIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Critical Risk
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {summary.critical_risk_predictions || 0}
                  </Typography>
                </Box>
                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Accuracy
                  </Typography>
                  <Typography 
                    variant="h4" 
                    color="success.main"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {summary.prediction_accuracy?.toFixed(1) || '0.0'}%
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="textSecondary" 
                    sx={{ mt: 0.5, fontSize: '0.75rem' }}
                  >
                    {summary.prediction_accuracy > 85 ? 'Excellent' : 
                     summary.prediction_accuracy > 75 ? 'Good' : 
                     summary.prediction_accuracy > 65 ? 'Fair' : 'Needs Improvement'}
                  </Typography>
                </Box>
                <AnalyticsIcon 
                  color="success" 
                  sx={{ 
                    fontSize: 40,
                    opacity: summary.prediction_accuracy > 80 ? 1 : 0.7 
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const PredictionTypesChart = () => {
    if (!dashboardData?.summary) return null;

    const { summary } = dashboardData;
    const data = [
      { name: 'Failures', value: summary.failure_predictions || 0, color: '#FF8042' },
      { name: 'Long Runners', value: summary.long_runner_predictions || 0, color: '#8884D8' },
      { name: 'SLA Misses', value: summary.sla_miss_predictions || 0, color: '#82CA9D' },
      { name: 'Volume Spikes', value: summary.volume_spike_predictions || 0, color: '#FFC658' }
    ];

    const hasData = data.some(item => item.value > 0);

    return (
      <Card>
        <CardHeader title="Prediction Types Distribution" />
        <CardContent>
          {!hasData ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={300}>
              <AnalyticsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Predictions Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Run predictions to see distribution of different prediction types
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    );
  };

  const RiskTimeline = () => {
    if (!dashboardData?.risk_timeline || !Array.isArray(dashboardData.risk_timeline)) {
      return (
        <Card>
          <CardHeader title="7-Day Risk Timeline" />
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={300}>
              <TrendingUpIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Risk Timeline Data
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Risk timeline will appear after running predictions
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    const hasData = dashboardData.risk_timeline.some(day => 
      day.critical_risk > 0 || day.high_risk > 0 || day.medium_risk > 0 || day.low_risk > 0
    );

    return (
      <Card>
        <CardHeader title="7-Day Risk Timeline" />
        <CardContent>
          {!hasData ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={300}>
              <TrendingUpIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Risk Data Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Risk timeline will show after predictions are generated
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.risk_timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="critical_risk" stackId="1" stroke="#f44336" fill="#f44336" />
                <Area type="monotone" dataKey="high_risk" stackId="1" stroke="#ff9800" fill="#ff9800" />
                <Area type="monotone" dataKey="medium_risk" stackId="1" stroke="#2196f3" fill="#2196f3" />
                <Area type="monotone" dataKey="low_risk" stackId="1" stroke="#4caf50" fill="#4caf50" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    );
  };

  const JobRiskScores = () => {
    if (!dashboardData?.job_risk_scores || !Array.isArray(dashboardData.job_risk_scores) || dashboardData.job_risk_scores.length === 0) {
      return (
        <Card>
          <CardHeader title="Top Risky Jobs" />
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={300}>
              <WarningIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Job Risk Data
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Job risk scores will appear after running predictions
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader title="Top Risky Jobs" />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.job_risk_scores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="job_name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="risk_score" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const AlertsTable = () => (
    <Card>
      <CardHeader 
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <NotificationIcon />
            Active Alerts
            <Badge badgeContent={Array.isArray(alerts) ? alerts.length : 0} color="error" />
          </Box>
        }
      />
      <CardContent>
        {Array.isArray(alerts) && alerts.length === 0 ? (
          <Alert severity="info">No active alerts at this time.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Severity</TableCell>
                  <TableCell>Job</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Impact Date</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(alerts) && alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getSeverityIcon(alert.severity)}
                      <Chip
                        label={alert.severity_display}
                        color={alert.severity === 'CRITICAL' ? 'error' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{alert.job_name}</TableCell>
                  <TableCell>{alert.alert_type_display}</TableCell>
                  <TableCell>{new Date(alert.predicted_impact_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {alert.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Acknowledge">
                        <IconButton
                          size="small"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          <CheckIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Resolve">
                        <IconButton
                          size="small"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );

  const PredictionsTable = () => (
    <Card>
      <CardHeader title="Recent Predictions" />
      <CardContent>
        {Array.isArray(predictions) && predictions.length === 0 ? (
          <Alert severity="info">No predictions available. Run predictions to generate insights.</Alert>
        ) : (
          <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Job</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Risk Level</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(predictions) && predictions.slice(0, 10).map((prediction) => (
                <TableRow key={prediction.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getPredictionTypeIcon(prediction.prediction_type)}
                      {prediction.prediction_type_display}
                    </Box>
                  </TableCell>
                  <TableCell>{prediction.job_name}</TableCell>
                  <TableCell>{new Date(prediction.predicted_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={prediction.risk_level_display}
                      color={getRiskColor(prediction.risk_level)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatConfidence(prediction.prediction_confidence)}</TableCell>
                  <TableCell>
                    {prediction.predicted_failure_probability && (
                      <Typography variant="body2">
                        Failure: {formatConfidence(prediction.predicted_failure_probability)}
                      </Typography>
                    )}
                    {prediction.predicted_duration_minutes && (
                      <Typography variant="body2">
                        Duration: {prediction.predicted_duration_minutes.toFixed(0)}min
                      </Typography>
                    )}
                    {prediction.predicted_volume && (
                      <Typography variant="body2">
                        Volume: {prediction.predicted_volume.toLocaleString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => setDetailsDialog({ open: true, prediction })}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        )}
      </CardContent>
    </Card>
  );

  const PatternsAccordion = () => (
    <Card>
      <CardHeader 
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <AnalyticsIcon />
            Discovered Patterns
            {Array.isArray(patterns) && patterns.length > 0 && (
              <Badge badgeContent={patterns.length} color="primary" />
            )}
          </Box>
        }
        action={
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={loadPatterns}
            disabled={loading}
          >
            Refresh Patterns
          </Button>
        }
      />
      <CardContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : Array.isArray(patterns) && patterns.length === 0 ? (
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              No patterns discovered yet
            </Typography>
            <Typography paragraph>
              Historical patterns will be automatically discovered when you:
            </Typography>
            <ul>
              <li>Upload sufficient historical batch job data</li>
              <li>Run predictions to analyze historical trends</li>
              <li>Allow the system to identify recurring patterns</li>
            </ul>
            <Typography variant="body2" color="textSecondary" mt={1}>
              Patterns help improve prediction accuracy by identifying recurring behaviors in your batch processes.
            </Typography>
          </Alert>
        ) : (
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
              {patterns.length} pattern{patterns.length !== 1 ? 's' : ''} discovered from historical analysis
            </Typography>
            {Array.isArray(patterns) && patterns.map((pattern) => (
              <Accordion key={pattern.id} sx={{ mb: 1 }}>
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ backgroundColor: 'action.hover' }}
                >
                  <Box display="flex" alignItems="center" gap={2} flex={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {pattern.pattern_type === 'WEEKLY' && <ScheduleIcon color="primary" />}
                      {pattern.pattern_type === 'VOLUME_SPIKE' && <VolumeIcon color="warning" />}
                      {pattern.pattern_type === 'FAILURE_SEQUENCE' && <ErrorIcon color="error" />}
                      {pattern.pattern_type === 'PERFORMANCE_DEGRADATION' && <SpeedIcon color="secondary" />}
                      {pattern.pattern_type === 'SEASONAL' && <TrendingUpIcon color="info" />}
                      {!['WEEKLY', 'VOLUME_SPIKE', 'FAILURE_SEQUENCE', 'PERFORMANCE_DEGRADATION', 'SEASONAL'].includes(pattern.pattern_type) && <AnalyticsIcon color="primary" />}
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {pattern.pattern_type_display}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${(pattern.confidence_score * 100).toFixed(1)}% confidence`}
                      color={pattern.confidence_score >= 0.8 ? 'success' : pattern.confidence_score >= 0.6 ? 'warning' : 'default'}
                      size="small"
                    />
                    <Chip
                      label={`${(pattern.occurrence_frequency * 100).toFixed(1)}% frequency`}
                      variant="outlined"
                      size="small"
                    />
                    {pattern.job_name && (
                      <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                        Job: {pattern.job_name}
                      </Typography>
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Typography paragraph sx={{ color: 'text.primary', fontSize: '1rem' }}>
                      {pattern.pattern_description}
                    </Typography>
                    
                    <Box display="flex" gap={3} flexWrap="wrap" sx={{ 
                      backgroundColor: 'action.selected', 
                      p: 2, 
                      borderRadius: 1 
                    }}>
                      <Typography variant="body2">
                        <strong>Frequency:</strong> {(pattern.occurrence_frequency * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">
                        <strong>Sample Size:</strong> {pattern.sample_size} data points
                      </Typography>
                      <Typography variant="body2">
                        <strong>Analysis Period:</strong> {pattern.data_range_days} days
                      </Typography>
                      <Typography variant="body2">
                        <strong>Discovered:</strong> {new Date(pattern.discovered_at).toLocaleDateString()}
                      </Typography>
                    </Box>

                    {pattern.pattern_data && Object.keys(pattern.pattern_data).length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                          Pattern Details:
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: 'background.paper', 
                          p: 2, 
                          borderRadius: 1, 
                          border: '1px solid',
                          borderColor: 'divider'
                        }}>
                          {Object.entries(pattern.pattern_data).map(([key, value]) => (
                            <Typography key={key} variant="body2" component="div" sx={{ mb: 0.5 }}>
                              <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong>{' '}
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {(pattern.time_of_day || pattern.day_of_week || pattern.day_of_month || pattern.month_of_year) && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                          Timing Information:
                        </Typography>
                        <Box display="flex" gap={2} flexWrap="wrap">
                          {pattern.time_of_day && (
                            <Chip label={`Time: ${pattern.time_of_day}`} size="small" variant="outlined" />
                          )}
                          {pattern.day_of_week && (
                            <Chip label={`Day: ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][pattern.day_of_week - 1]}`} size="small" variant="outlined" />
                          )}
                          {pattern.day_of_month && (
                            <Chip label={`Day of Month: ${pattern.day_of_month}`} size="small" variant="outlined" />
                          )}
                          {pattern.month_of_year && (
                            <Chip label={`Month: ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][pattern.month_of_year - 1]}`} size="small" variant="outlined" />
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const RunPredictionsDialog = () => (
    <Dialog open={runDialogOpen} onClose={() => setRunDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Run Smart Predictions</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3} pt={1}>
          <FormControl fullWidth>
            <InputLabel>Days Ahead</InputLabel>
            <Select
              value={daysAhead}
              label="Days Ahead"
              onChange={(e) => setDaysAhead(e.target.value)}
            >
              <MenuItem value={1}>1 Day</MenuItem>
              <MenuItem value={3}>3 Days</MenuItem>
              <MenuItem value={7}>1 Week</MenuItem>
              <MenuItem value={14}>2 Weeks</MenuItem>
              <MenuItem value={30}>1 Month</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Prediction Types</InputLabel>
            <Select
              multiple
              value={predictionTypes}
              label="Prediction Types"
              onChange={(e) => setPredictionTypes(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="failures">Job Failures</MenuItem>
              <MenuItem value="long_runners">Long Running Jobs</MenuItem>
              <MenuItem value="sla_misses">SLA Misses</MenuItem>
              <MenuItem value="volume_spikes">Volume Spikes</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setRunDialogOpen(false)}>Cancel</Button>
        <Button onClick={runPredictions} variant="contained" disabled={loading}>
          {loading ? 'Running...' : 'Run Predictions'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const PredictionDetailsDialog = () => (
    <Dialog
      open={detailsDialog.open}
      onClose={() => setDetailsDialog({ open: false, prediction: null })}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Prediction Details</DialogTitle>
      <DialogContent>
        {detailsDialog.prediction && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="h6">
              {detailsDialog.prediction.job_name} - {detailsDialog.prediction.prediction_type_display}
            </Typography>
            
            <Box display="flex" gap={2}>
              <Chip
                label={detailsDialog.prediction.risk_level_display}
                color={getRiskColor(detailsDialog.prediction.risk_level)}
              />
              <Typography>
                Confidence: {formatConfidence(detailsDialog.prediction.prediction_confidence)}
              </Typography>
              <Typography>
                Date: {new Date(detailsDialog.prediction.predicted_date).toLocaleDateString()}
              </Typography>
            </Box>

            {detailsDialog.prediction.contributing_factors && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Contributing Factors:</Typography>
                <Typography variant="body2">
                  {JSON.stringify(detailsDialog.prediction.contributing_factors, null, 2)}
                </Typography>
              </Box>
            )}

            {detailsDialog.prediction.historical_patterns && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Historical Patterns:</Typography>
                <Typography variant="body2">
                  {JSON.stringify(detailsDialog.prediction.historical_patterns, null, 2)}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDetailsDialog({ open: false, prediction: null })}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Smart Predictor
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Customer</InputLabel>
            <Select
              value={selectedCustomer}
              label="Customer"
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              {Array.isArray(customers) && customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name} ({customer.code}) - {customer.product}
                  {customer.batch_jobs_count > 0 && (
                    <Chip 
                      label={`${customer.batch_jobs_count} jobs`} 
                      size="small" 
                      color="primary" 
                      sx={{ ml: 1 }} 
                    />
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDashboardData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<RunIcon />}
            onClick={() => setRunDialogOpen(true)}
            disabled={!selectedCustomer}
          >
            Run Predictions
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {selectedCustomer ? (
        <>
          {/* Summary Cards */}
          <SummaryCards />

          {/* Main Content Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Dashboard" />
              <Tab label="Predictions" />
              <Tab label="Alerts" />
              <Tab label="Patterns" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            <>
              {!dashboardData?.summary || (dashboardData.summary.total_predictions === 0) ? (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Welcome to Smart Predictor!
                      </Typography>
                      <Typography paragraph>
                        No prediction data is available yet. To get started:
                      </Typography>
                      <ol>
                        <li>Ensure you have historical batch job data uploaded for this customer</li>
                        <li>Click the "Run Predictions" button to analyze patterns and generate insights</li>
                        <li>The system will analyze historical data to predict failures, long-running jobs, SLA misses, and volume spikes</li>
                      </ol>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Tip:</strong> Customers with existing data include BCN (196 jobs), PRH-TMS (163 jobs), and WHA (553 jobs). 
                          Select one of these customers for better prediction results.
                        </Typography>
                      </Alert>
                      <Box mt={2}>
                        <Button
                          variant="contained"
                          startIcon={<RunIcon />}
                          onClick={() => setRunDialogOpen(true)}
                          disabled={!selectedCustomer}
                        >
                          Run First Predictions
                        </Button>
                      </Box>
                    </Alert>
                  </CardContent>
                </Card>
              ) : null}
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <PredictionTypesChart />
                </Grid>
                <Grid item xs={12} md={6}>
                  <RiskTimeline />
                </Grid>
                <Grid item xs={12}>
                  <JobRiskScores />
                </Grid>
              </Grid>
            </>
          )}

          {activeTab === 1 && <PredictionsTable />}

          {activeTab === 2 && <AlertsTable />}

          {activeTab === 3 && <PatternsAccordion />}

          {/* Dialogs */}
          <RunPredictionsDialog />
          <PredictionDetailsDialog />
        </>
      ) : (
        <Alert severity="info">
          Please select a customer to view predictions and analytics.
        </Alert>
      )}
    </Box>
  );
};

export default SmartPredictor; 