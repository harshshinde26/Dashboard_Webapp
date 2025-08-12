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
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Stack,
  Badge,
  OutlinedInput,
  InputAdornment,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  Timer as TimerIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { batchScheduleAPI, customerAPI } from '../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';

const BatchSchedule = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  
  // Filter states
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [jobNameSearch, setJobNameSearch] = useState('');
  const [commandSearch, setCommandSearch] = useState('');
  const [parametersSearch, setParametersSearch] = useState('');
  const [ownerSearch, setOwnerSearch] = useState('');
  
  // Dialog states
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Load data on component mount
  useEffect(() => {
    loadCustomers();
    loadSchedules();
  }, []);

  // Apply filters and search when dependencies change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [schedules, selectedCustomer, selectedCategory, selectedStatus, selectedJobType, searchTerm, searchField, 
      jobNameSearch, commandSearch, parametersSearch, ownerSearch]);

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await batchScheduleAPI.getAll();
      const schedulesData = response.data.results || response.data || [];
      setSchedules(schedulesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error('Failed to load batch schedules');
      setLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...schedules];

    // Apply customer filter
    if (selectedCustomer) {
      filtered = filtered.filter(schedule => schedule.customer === parseInt(selectedCustomer));
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(schedule => schedule.category === selectedCategory);
    }

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(schedule => schedule.enabled_status === selectedStatus);
    }

    // Apply job type filter
    if (selectedJobType) {
      filtered = filtered.filter(schedule => schedule.job_type === selectedJobType);
    }

    // Apply search filters
    if (advancedSearch) {
      // Advanced search - individual field searches
      if (jobNameSearch) {
        filtered = filtered.filter(schedule => 
          schedule.job_name?.toLowerCase().includes(jobNameSearch.toLowerCase())
        );
      }
      if (commandSearch) {
        filtered = filtered.filter(schedule => 
          schedule.command?.toLowerCase().includes(commandSearch.toLowerCase())
        );
      }
      if (parametersSearch) {
        filtered = filtered.filter(schedule => 
          schedule.parameters?.toLowerCase().includes(parametersSearch.toLowerCase())
        );
      }
      if (ownerSearch) {
        filtered = filtered.filter(schedule => 
          schedule.owner?.toLowerCase().includes(ownerSearch.toLowerCase())
        );
      }
    } else if (searchTerm) {
      // General search across multiple fields
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(schedule => {
        if (searchField === 'all') {
          return (
            schedule.job_name?.toLowerCase().includes(term) ||
            schedule.command?.toLowerCase().includes(term) ||
            schedule.parameters?.toLowerCase().includes(term) ||
            schedule.owner?.toLowerCase().includes(term) ||
            schedule.parent_group?.toLowerCase().includes(term) ||
            schedule.class_name?.toLowerCase().includes(term) ||
            schedule.runtime_user?.toLowerCase().includes(term)
          );
        } else {
          return schedule[searchField]?.toLowerCase().includes(term);
        }
      });
    }

    setFilteredSchedules(filtered);
    setPage(0); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setSelectedCustomer('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedJobType('');
    setSearchTerm('');
    setJobNameSearch('');
    setCommandSearch('');
    setParametersSearch('');
    setOwnerSearch('');
    setSearchField('all');
    setAdvancedSearch(false);
  };

  const handleViewDetails = (schedule) => {
    setSelectedSchedule(schedule);
    setDetailsDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ENABLED': return 'success';
      case 'DISABLED': return 'error';
      case 'SUSPENDED': return 'warning';
      default: return 'default';
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toUpperCase()) {
      case 'TID': return 'primary';
      case 'FOLDER': return 'secondary';
      case 'CONDITION': return 'info';
      case 'RESOURCE': return 'warning';
      case 'VARIABLE': return 'success';
      case 'CONNECTION': return 'error';
      case 'CALENDAR': return 'info';
      case 'AGENT': return 'warning';
      case 'GROUP': return 'secondary';
      default: return 'default';
    }
  };

  const getJobTypeColor = (jobType) => {
    switch (jobType?.toUpperCase()) {
      case 'INDIVIDUAL_JOB': return 'primary';
      case 'JOB_GROUP': return 'secondary';
      case 'FOLDER_GROUP': return 'warning';
      case 'CONDITION_CHECK': return 'info';
      case 'DEPENDENCY': return 'error';
      case 'RESOURCE_POOL': return 'success';
      default: return 'default';
    }
  };

  const getJobTypeLabel = (jobType) => {
    switch (jobType) {
      case 'INDIVIDUAL_JOB': return 'Job';
      case 'JOB_GROUP': return 'Group';
      case 'FOLDER_GROUP': return 'Folder';
      case 'CONDITION_CHECK': return 'Check';
      case 'DEPENDENCY': return 'Dependency';
      case 'RESOURCE_POOL': return 'Resource';
      default: return jobType || 'Unknown';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return moment(dateString).format('YYYY-MM-DD HH:mm:ss');
  };

  const exportToCSV = () => {
    const headers = [
      'Job Name', 'ID', 'Category', 'Job Type', 'Status', 'Customer', 'Parent Group',
      'Command', 'Parameters', 'Dependencies', 'Owner', 'Class', 'Runtime User',
      'Time Zone', 'Start Time', 'Until Time', 'Repeats', 'Agent/Agent List',
      'Required Resource', 'Amount Required', 'Last Modified'
    ];

    const csvData = filteredSchedules.map(schedule => [
      schedule.job_name || '',
      schedule.job_id || '',
      schedule.category || '',
      getJobTypeLabel(schedule.job_type) || '',
      schedule.enabled_status || '',
      customers.find(c => c.id === schedule.customer)?.name || '',
      schedule.parent_group || '',
      schedule.command || '',
      schedule.parameters || '',
      schedule.dependencies || '',
      schedule.owner || '',
      schedule.class_name || '',
      schedule.runtime_user || '',
      schedule.time_zone || '',
      schedule.start_time || '',
      schedule.until_time || '',
      schedule.repeats || '',
      schedule.agent_agent_list || schedule.agent_or_agent_list || '',
      schedule.required_virtual_resource || '',
      schedule.amount_required || '',
      formatDateTime(schedule.last_modified_on)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const timestamp = moment().format('YYYYMMDD_HHmmss');
    const customerName = selectedCustomer ? 
      customers.find(c => c.id == selectedCustomer)?.name.replace(/[^a-zA-Z0-9]/g, '_') : 
      'All_Customers';
    const filename = `batch_schedule_${customerName}_${timestamp}.csv`;
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Schedule data exported successfully');
  };

  const paginatedSchedules = filteredSchedules.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ScheduleIcon fontSize="large" />
        Batch Schedule Management
        <Badge badgeContent={filteredSchedules.length} color="primary" sx={{ ml: 2 }}>
          <Chip label="Total Jobs" variant="outlined" />
        </Badge>
      </Typography>

      {/* Filters and Search Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            Filters & Search
          </Typography>

          {/* Basic Filters */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={selectedCustomer}
                  label="Customer"
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
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="TID">TID</MenuItem>
                  <MenuItem value="FOLDER">Folder</MenuItem>
                  <MenuItem value="CONDITION">Condition</MenuItem>
                  <MenuItem value="RESOURCE">Resource</MenuItem>
                  <MenuItem value="VARIABLE">Variable</MenuItem>
                  <MenuItem value="CONNECTION">Connection</MenuItem>
                  <MenuItem value="CALENDAR">Calendar</MenuItem>
                  <MenuItem value="AGENT">Agent</MenuItem>
                  <MenuItem value="GROUP">Group</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="ENABLED">Enabled</MenuItem>
                  <MenuItem value="DISABLED">Disabled</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={selectedJobType}
                  label="Job Type"
                  onChange={(e) => setSelectedJobType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="INDIVIDUAL_JOB">Individual Job</MenuItem>
                  <MenuItem value="JOB_GROUP">Job Group</MenuItem>
                  <MenuItem value="FOLDER_GROUP">Folder Group</MenuItem>
                  <MenuItem value="CONDITION_CHECK">Condition Check</MenuItem>
                  <MenuItem value="DEPENDENCY">Dependency</MenuItem>
                  <MenuItem value="RESOURCE_POOL">Resource Pool</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadSchedules}
                  size="small"
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  size="small"
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Search Section */}
          <Divider sx={{ my: 2 }} />
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SearchIcon />
              Search
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setAdvancedSearch(!advancedSearch)}
              startIcon={<SettingsIcon />}
            >
              {advancedSearch ? 'Basic Search' : 'Advanced Search'}
            </Button>
          </Box>

          {!advancedSearch ? (
            // Basic Search
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Search Field</InputLabel>
                  <Select
                    value={searchField}
                    label="Search Field"
                    onChange={(e) => setSearchField(e.target.value)}
                  >
                    <MenuItem value="all">All Fields</MenuItem>
                    <MenuItem value="job_name">Job Name</MenuItem>
                    <MenuItem value="command">Command</MenuItem>
                    <MenuItem value="parameters">Parameters</MenuItem>
                    <MenuItem value="owner">Owner</MenuItem>
                    <MenuItem value="parent_group">Parent Group</MenuItem>
                    <MenuItem value="class_name">Class</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Search Term"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter search term..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setSearchTerm('')} size="small">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          ) : (
            // Advanced Search
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Job Name"
                  value={jobNameSearch}
                  onChange={(e) => setJobNameSearch(e.target.value)}
                  placeholder="Search by job name..."
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Command"
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                  placeholder="Search by command..."
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Parameters"
                  value={parametersSearch}
                  onChange={(e) => setParametersSearch(e.target.value)}
                  placeholder="Search by parameters..."
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Owner"
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                  placeholder="Search by owner..."
                  size="small"
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Schedule Results ({filteredSchedules.length} jobs)
            </Typography>
            <Button
              variant="contained"
              startIcon={<ExportIcon />}
              onClick={exportToCSV}
              disabled={filteredSchedules.length === 0}
            >
              Export CSV
            </Button>
          </Box>

          {filteredSchedules.length === 0 ? (
            <Alert severity="info">
              No batch schedules found matching your criteria. Try adjusting your filters or search terms.
            </Alert>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Job Name</strong></TableCell>
                      <TableCell><strong>Category/Type</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Owner</strong></TableCell>
                      <TableCell><strong>Runtime User</strong></TableCell>
                      <TableCell><strong>Start Time</strong></TableCell>
                      <TableCell><strong>Last Modified</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedSchedules.map((schedule) => (
                      <TableRow key={schedule.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {schedule.job_name}
                            </Typography>
                            {schedule.job_id && (
                              <Typography variant="caption" color="textSecondary">
                                ID: {schedule.job_id}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack direction="column" spacing={0.5}>
                            <Chip 
                              label={schedule.category} 
                              color={getCategoryColor(schedule.category)}
                              size="small"
                            />
                            <Chip 
                              label={getJobTypeLabel(schedule.job_type)} 
                              color={getJobTypeColor(schedule.job_type)}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={schedule.enabled_status || 'Unknown'} 
                            color={getStatusColor(schedule.enabled_status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{schedule.owner || 'N/A'}</TableCell>
                        <TableCell>{schedule.runtime_user || 'N/A'}</TableCell>
                        <TableCell>{schedule.start_time || 'N/A'}</TableCell>
                        <TableCell>{formatDateTime(schedule.last_modified_on)}</TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(schedule)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={filteredSchedules.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Job Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ScheduleIcon />
          Job Details: {selectedSchedule?.job_name}
        </DialogTitle>
        <DialogContent>
          {selectedSchedule && (
            <Box>
              {/* Basic Information */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon />
                    Basic Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField label="Job Name" value={selectedSchedule.job_name || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Job ID" value={selectedSchedule.job_id || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Category" value={selectedSchedule.category || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Job Type" value={getJobTypeLabel(selectedSchedule.job_type) || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Status" value={selectedSchedule.enabled_status || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Parent Group" value={selectedSchedule.parent_group || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Command & Execution */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CodeIcon />
                    Command & Execution
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField 
                        label="Command" 
                        value={selectedSchedule.command || ''} 
                        fullWidth 
                        multiline 
                        rows={3}
                        InputProps={{ readOnly: true }} 
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField 
                        label="Parameters" 
                        value={selectedSchedule.parameters || ''} 
                        fullWidth 
                        multiline 
                        rows={2}
                        InputProps={{ readOnly: true }} 
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField 
                        label="Dependencies" 
                        value={selectedSchedule.dependencies || ''} 
                        fullWidth 
                        multiline 
                        rows={2}
                        InputProps={{ readOnly: true }} 
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Timing & Schedule */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimerIcon />
                    Timing & Schedule
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField label="Time Zone" value={selectedSchedule.time_zone || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField label="Start Time" value={selectedSchedule.start_time || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField label="Until Time" value={selectedSchedule.until_time || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Calendar" value={selectedSchedule.calendar || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Repeats" value={selectedSchedule.repeats || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Agent & Runtime */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ComputerIcon />
                    Agent & Runtime
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField label="Agent/Agent List" value={selectedSchedule.agent_agent_list || selectedSchedule.agent_or_agent_list || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Runtime User" value={selectedSchedule.runtime_user || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Required Virtual Resource" value={selectedSchedule.required_virtual_resource || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Amount Required" value={selectedSchedule.amount_required || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Tracking & Monitoring */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon />
                    Tracking & Monitoring
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField label="For Tracking Use" value={selectedSchedule.for_tracking_use || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Exit Code Range" value={selectedSchedule.exit_code_range || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Exclude Completed Abnormally" value={selectedSchedule.exclude_completed_abnormally || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Save Output Option" value={selectedSchedule.save_output_option || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Permissions & Settings */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon />
                    Permissions & Settings
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField label="Allow Unscheduled" value={selectedSchedule.allow_unscheduled || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Allow Operator Rerun" value={selectedSchedule.allow_operator_rerun || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Require Operator Release" value={selectedSchedule.require_operator_release || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Disable Carryover" value={selectedSchedule.disable_carryover || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Metadata & Documentation */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon />
                    Metadata & Documentation
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField label="Owner" value={selectedSchedule.owner || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Class" value={selectedSchedule.class_name || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Last Modified" value={formatDateTime(selectedSchedule.last_modified_on)} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="History Retention (Days)" value={selectedSchedule.history_retention_days || ''} fullWidth InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField 
                        label="Run Book" 
                        value={selectedSchedule.run_book || ''} 
                        fullWidth 
                        multiline 
                        rows={3}
                        InputProps={{ readOnly: true }} 
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField 
                        label="Notes" 
                        value={selectedSchedule.notes || ''} 
                        fullWidth 
                        multiline 
                        rows={3}
                        InputProps={{ readOnly: true }} 
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BatchSchedule; 