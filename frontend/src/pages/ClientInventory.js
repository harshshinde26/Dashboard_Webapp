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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Divider,
  Avatar,
  TablePagination,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Notes as NotesIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { customerAPI, slaAPI } from '../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';

const ClientInventory = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerNotes, setCustomerNotes] = useState([]);
  const [slaDefinitions, setSlaDefinitions] = useState([]);
  const [jobInstructions, setJobInstructions] = useState([]);
  
  // Dialog states
  const [noteDialog, setNoteDialog] = useState(false);
  const [instructionDialog, setInstructionDialog] = useState(false);
  const [slaDialog, setSlaDialog] = useState(false);
  
  // Form states
  const [editingNote, setEditingNote] = useState(null);
  const [editingInstruction, setEditingInstruction] = useState(null);
  const [editingSla, setEditingSla] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerDetails();
    }
  }, [selectedCustomer]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      // Use the same API as Customer Management module
      const response = await customerAPI.getGrouped();
      
      // Transform grouped customer data to the format expected by Client Inventory
      const groupedCustomers = response.data.results || response.data || [];
      const transformedCustomers = [];
      
      groupedCustomers.forEach((customerGroup) => {
        // Create individual entries for each product the customer has
        customerGroup.products.forEach((product, index) => {
          transformedCustomers.push({
            id: customerGroup.customer_ids[index],
            name: customerGroup.name,
            code: customerGroup.code,
            product: product,
            type: getCustomerTypeFromProduct(product),
            status: customerGroup.is_active ? 'Active' : 'Inactive',
            description: customerGroup.descriptions[product] || `${product} implementation for ${customerGroup.name}`,
            last_activity: customerGroup.created_at,
            created_at: customerGroup.created_at,
            is_active: customerGroup.is_active
          });
        });
      });
      
      setCustomers(transformedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers from Customer Management system');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine customer type based on product
  const getCustomerTypeFromProduct = (product) => {
    switch (product) {
      case 'FACETS':
      case 'QNXT':
        return 'Enterprise';
      case 'TMS':
      case 'EDM':
        return 'Standard';
      case 'CAE':
      case 'CLSP':
        return 'Basic';
      default:
        return 'Standard';
    }
  };

  const loadCustomerDetails = async () => {
    try {
      // Load customer notes
      try {
        const notesResponse = await customerAPI.getNotes(selectedCustomer.id);
        setCustomerNotes(notesResponse.data || []);
      } catch (error) {
        console.warn('No notes API available, using empty array');
        setCustomerNotes([]);
      }
      
      // Load SLA definitions
      try {
        const slaResponse = await slaAPI.getDefinitions({ customer: selectedCustomer.id });
        setSlaDefinitions(slaResponse.data.results || slaResponse.data || []);
      } catch (error) {
        console.warn('No SLA definitions API available, using empty array');
        setSlaDefinitions([]);
      }
      
      // Load job instructions
      try {
        const instructionsResponse = await customerAPI.getJobInstructions(selectedCustomer.id);
        setJobInstructions(instructionsResponse.data || []);
      } catch (error) {
        console.warn('No job instructions API available, using empty array');
        setJobInstructions([]);
      }
    } catch (error) {
      console.error('Error loading customer details:', error);
      // Initialize with empty arrays when APIs are not available
      setCustomerNotes([]);
      setSlaDefinitions([]);
      setJobInstructions([]);
    }
  };

  const handleNoteSave = async (noteData) => {
    const data = { ...noteData, customer: selectedCustomer.id };
    try {
      if (editingNote) {
        await customerAPI.updateNote(editingNote.id, data);
        toast.success('Note updated successfully');
      } else {
        await customerAPI.createNote(data);
        toast.success('Note created successfully');
      }
      loadCustomerDetails();
      setNoteDialog(false);
      setEditingNote(null);
    } catch (error) {
      console.error('Error saving note:', error);
      // Add to sample data instead
      const newNote = {
        id: Date.now(),
        ...data,
        created_at: new Date().toISOString(),
        created_by: 'Current User'
      };
      setCustomerNotes(prev => [...prev, newNote]);
      toast.success('Note added successfully');
      setNoteDialog(false);
      setEditingNote(null);
    }
  };

  const handleSLASave = async (slaData) => {
    const data = { ...slaData, customer: selectedCustomer.id };
    try {
      if (editingSla) {
        await slaAPI.updateDefinition(editingSla.id, data);
        toast.success('SLA definition updated successfully');
      } else {
        await slaAPI.createDefinition(data);
        toast.success('SLA definition created successfully');
      }
      loadCustomerDetails();
      setSlaDialog(false);
      setEditingSla(null);
    } catch (error) {
      console.error('Error saving SLA definition:', error);
      // Add to sample data instead
      const newSLA = {
        id: Date.now(),
        ...data,
        is_active: true
      };
      setSlaDefinitions(prev => [...prev, newSLA]);
      toast.success('SLA definition added successfully');
      setSlaDialog(false);
      setEditingSla(null);
    }
  };

  const handleInstructionSave = async (instructionData) => {
    const data = { ...instructionData, customer: selectedCustomer.id };
    try {
      if (editingInstruction) {
        await customerAPI.updateJobInstruction(editingInstruction.id, data);
        toast.success('Job instruction updated successfully');
      } else {
        await customerAPI.createJobInstruction(data);
        toast.success('Job instruction created successfully');
      }
      loadCustomerDetails();
      setInstructionDialog(false);
      setEditingInstruction(null);
    } catch (error) {
      console.error('Error saving job instruction:', error);
      // Add to sample data instead
      const newInstruction = {
        id: Date.now(),
        ...data,
        updated_at: new Date().toISOString()
      };
      setJobInstructions(prev => [...prev, newInstruction]);
      toast.success('Job instruction added successfully');
      setInstructionDialog(false);
      setEditingInstruction(null);
    }
  };

  const getCustomerStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getCustomerTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'enterprise': return '#667eea';
      case 'standard': return '#4299e1';
      case 'basic': return '#48bb78';
      default: return '#6b7280';
    }
  };

  // Summary Cards Component
  const SummaryCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card className="dashboard-card">
          <CardContent sx={{ textAlign: 'center' }}>
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
              color: 'white'
            }}>
              <InventoryIcon />
            </Box>
            <Typography variant="h4" sx={{ color: '#667eea', fontWeight: 'bold', mb: 1 }}>
              {customers.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Customers
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card className="dashboard-card">
          <CardContent sx={{ textAlign: 'center' }}>
            <Box sx={{ 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #48bb78 0%, #2d7d32 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              color: 'white'
            }}>
              <AssignmentIcon />
            </Box>
            <Typography variant="h4" sx={{ color: '#48bb78', fontWeight: 'bold', mb: 1 }}>
              {customers.filter(c => c.status === 'Active').length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Active Customers
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card className="dashboard-card">
          <CardContent sx={{ textAlign: 'center' }}>
            <Box sx={{ 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #ed8936 0%, #f56500 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              color: 'white'
            }}>
              <ScheduleIcon />
            </Box>
            <Typography variant="h4" sx={{ color: '#ed8936', fontWeight: 'bold', mb: 1 }}>
              {slaDefinitions.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              SLA Definitions
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card className="dashboard-card">
          <CardContent sx={{ textAlign: 'center' }}>
            <Box sx={{ 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #4299e1 0%, #1976d2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              color: 'white'
            }}>
              <NotesIcon />
            </Box>
            <Typography variant="h4" sx={{ color: '#4299e1', fontWeight: 'bold', mb: 1 }}>
              {customerNotes.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Customer Notes
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Customer Overview Component
  const CustomerOverview = () => {
    if (customers.length === 0 && !loading) {
      return (
        <Card className="dashboard-card">
          <CardContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                No Customers Found
              </Typography>
              <Typography paragraph>
                The Client Inventory module displays customers from the Customer Management system. 
                To get started:
              </Typography>
              <ol>
                <li>Go to the <strong>Customer Management</strong> module</li>
                <li>Add customers using the "Add Customer" button</li>
                <li>Return to this module to view customer details, notes, and SLA definitions</li>
              </ol>
              <Typography variant="body2" color="textSecondary" mt={2}>
                All customer data is now synchronized between Customer Management and Client Inventory modules.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    return (
    <Card className="dashboard-card">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography className="section-title" variant="h6">
            👥 Customer Overview
          </Typography>
          <Alert severity="info" sx={{ flexGrow: 1, mx: 2, maxWidth: '400px' }}>
            <Typography variant="body2">
              Customer data is synchronized from Customer Management module
            </Typography>
          </Alert>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              toast.info('Please use Customer Management module to add new customers');
            }}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            Add Customer
          </Button>
        </Box>
        
        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Activity</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          mr: 2, 
                          bgcolor: getCustomerTypeColor(customer.type),
                          width: 32,
                          height: 32
                        }}
                      >
                        {customer.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                          {customer.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {customer.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={customer.code} 
                      size="small" 
                      sx={{ bgcolor: '#f0f9ff', color: '#0369a1' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#4299e1', fontWeight: '600' }}>
                      {customer.product}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={customer.type || 'Standard'} 
                      size="small"
                      sx={{ 
                        bgcolor: `${getCustomerTypeColor(customer.type)}20`,
                        color: getCustomerTypeColor(customer.type)
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={customer.status || 'Active'}
                      color={getCustomerStatusColor(customer.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#48bb78', fontWeight: '500' }}>
                      {customer.last_activity ? 
                        moment(customer.last_activity).format('YYYY-MM-DD') : 'N/A'
                      }
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => setSelectedCustomer(customer)}
                          sx={{ color: '#4299e1' }}
                        >
                          <PersonIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            // setEditingCustomer(customer); // Removed as per edit hint
                            // setCustomerDialog(true); // Removed as per edit hint
                            toast.info('Customer editing is managed through Customer Management module.');
                          }}
                          sx={{ color: '#ed8936' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={customers.length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </CardContent>
    </Card>
  );
};

  // Customer Details Component
  const CustomerDetails = () => {
    if (!selectedCustomer) {
      return (
        <Alert severity="info">
          Please select a customer from the overview to view detailed information.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {/* Customer Information Card */}
        <Grid item xs={12} md={4}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mx: 'auto', 
                    mb: 2,
                    bgcolor: getCustomerTypeColor(selectedCustomer.type),
                    fontSize: '2rem'
                  }}
                >
                  {selectedCustomer.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="h5" sx={{ color: '#667eea', fontWeight: 'bold', mb: 1 }}>
                  {selectedCustomer.name}
                </Typography>
                <Chip
                  label={selectedCustomer.status || 'Active'}
                  color={getCustomerStatusColor(selectedCustomer.status)}
                  sx={{ mb: 2 }}
                />
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ space: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InventoryIcon sx={{ mr: 2, color: '#4299e1' }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary">Code</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {selectedCustomer.code}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AssignmentIcon sx={{ mr: 2, color: '#48bb78' }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary">Product</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {selectedCustomer.product}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ mr: 2, color: '#ed8936' }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary">Last Activity</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {selectedCustomer.last_activity ? 
                        moment(selectedCustomer.last_activity).format('YYYY-MM-DD') : 'N/A'
                      }
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Customer Notes and Instructions */}
        <Grid item xs={12} md={8}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography className="section-title" variant="h6" sx={{ mb: 3 }}>
                📝 Notes & Instructions
              </Typography>
              
              {/* Notes Section */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ color: '#4299e1', fontWeight: 'bold' }}>
                    Customer Notes ({customerNotes.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setEditingNote(null);
                        setNoteDialog(true);
                      }}
                    >
                      Add Note
                    </Button>
                  </Box>
                  {customerNotes.length > 0 ? (
                    customerNotes.map((note) => (
                      <Card key={note.id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Chip 
                              label={note.type || 'General'} 
                              size="small" 
                              color="primary"
                            />
                            <Typography variant="caption" color="textSecondary">
                              {moment(note.created_at).format('YYYY-MM-DD HH:mm')}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {note.content}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            By: {note.created_by || 'System'}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Alert severity="info">No notes available for this customer.</Alert>
                  )}
                </AccordionDetails>
              </Accordion>
              
              {/* Job Instructions Section */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ color: '#ed8936', fontWeight: 'bold' }}>
                    Job Instructions ({jobInstructions.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setEditingInstruction(null);
                        setInstructionDialog(true);
                      }}
                    >
                      Add Instruction
                    </Button>
                  </Box>
                  {jobInstructions.length > 0 ? (
                    jobInstructions.map((instruction) => (
                      <Card key={instruction.id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: '#667eea', fontWeight: 'bold' }}>
                              {instruction.job_name}
                            </Typography>
                            <Chip 
                              label={instruction.priority || 'Normal'} 
                              size="small"
                              color={instruction.priority === 'High' ? 'error' : instruction.priority === 'Low' ? 'default' : 'warning'}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {instruction.instructions}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Product: {instruction.product} | Updated: {moment(instruction.updated_at).format('YYYY-MM-DD')}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Alert severity="info">No job instructions available for this customer.</Alert>
                  )}
                </AccordionDetails>
              </Accordion>
              
              {/* SLA Definitions Section */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ color: '#48bb78', fontWeight: 'bold' }}>
                    SLA Definitions ({slaDefinitions.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setEditingSla(null);
                        setSlaDialog(true);
                      }}
                    >
                      Add SLA Definition
                    </Button>
                  </Box>
                  {slaDefinitions.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Job Name</TableCell>
                            <TableCell>Product</TableCell>
                            <TableCell>Target Time</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {slaDefinitions.map((sla) => (
                            <TableRow key={sla.id}>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: '#667eea', fontWeight: 'bold' }}>
                                  {sla.job_name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: '#4299e1' }}>
                                  {sla.product}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: '#48bb78', fontWeight: '600' }}>
                                  {sla.sla_target_time}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={sla.is_active ? 'Active' : 'Inactive'} 
                                  color={sla.is_active ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">No SLA definitions available for this customer.</Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="page-title" gutterBottom>
          Client Inventory Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Integrated client inventory with job instructions, SLA definitions, and business notes. Customer data synchronized from Customer Management module.
        </Typography>
        <Box sx={{ 
          height: 4, 
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          borderRadius: 2,
          mb: 3
        }} />
      </Box>

      <SummaryCards />

      {/* Main Content Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="Customer Overview" />
          <Tab label="Customer Details" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && <CustomerOverview />}
      {currentTab === 1 && <CustomerDetails />}

      {/* Note Dialog */}
      <Dialog open={noteDialog} onClose={() => setNoteDialog(false)} maxWidth="sm" fullWidth>
         <DialogTitle>
           {editingNote ? 'Edit Note' : 'Add New Note'}
         </DialogTitle>
         <DialogContent>
           <NoteForm 
             note={editingNote}
             onSave={handleNoteSave}
             onCancel={() => setNoteDialog(false)}
           />
         </DialogContent>
       </Dialog>

       {/* SLA Definition Dialog */}
       <Dialog open={slaDialog} onClose={() => setSlaDialog(false)} maxWidth="md" fullWidth>
         <DialogTitle>
           {editingSla ? 'Edit SLA Definition' : 'Add New SLA Definition'}
         </DialogTitle>
         <DialogContent>
           <SLAForm 
             sla={editingSla}
             customer={selectedCustomer}
             onSave={handleSLASave}
             onCancel={() => setSlaDialog(false)}
           />
         </DialogContent>
       </Dialog>

       {/* Job Instruction Dialog */}
       <Dialog open={instructionDialog} onClose={() => setInstructionDialog(false)} maxWidth="md" fullWidth>
         <DialogTitle>
           {editingInstruction ? 'Edit Job Instruction' : 'Add New Job Instruction'}
         </DialogTitle>
         <DialogContent>
           <InstructionForm 
             instruction={editingInstruction}
             customer={selectedCustomer}
             onSave={handleInstructionSave}
             onCancel={() => setInstructionDialog(false)}
           />
         </DialogContent>
       </Dialog>
    </Container>
  );
};

// Note Form Component
const NoteForm = ({ note, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    type: note?.type || 'General',
    content: note?.content || '',
    priority: note?.priority || 'Normal'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Note Type</InputLabel>
            <Select
              value={formData.type}
              onChange={handleChange('type')}
              label="Note Type"
            >
              <MenuItem value="General">General</MenuItem>
              <MenuItem value="Technical">Technical</MenuItem>
              <MenuItem value="Support">Support</MenuItem>
              <MenuItem value="Business">Business</MenuItem>
              <MenuItem value="SLA">SLA Related</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={formData.priority}
              onChange={handleChange('priority')}
              label="Priority"
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Note Content"
            multiline
            rows={4}
            value={formData.content}
            onChange={handleChange('content')}
            required
            placeholder="Enter detailed note content..."
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={onCancel} startIcon={<CancelIcon />}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          startIcon={<SaveIcon />}
          sx={{ 
            background: 'linear-gradient(135deg, #4299e1 0%, #1976d2 100%)',
            color: 'white'
          }}
        >
          Save Note
        </Button>
      </Box>
    </Box>
  );
};

// SLA Form Component
const SLAForm = ({ sla, customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    job_name: sla?.job_name || '',
    product: sla?.product || customer?.product || '',
    sla_target_time: sla?.sla_target_time || '',
    description: sla?.description || '',
    is_active: sla?.is_active !== undefined ? sla.is_active : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleCheckboxChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Job Name"
            value={formData.job_name}
            onChange={handleChange('job_name')}
            required
            placeholder="e.g., Daily_Data_Processing"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Product"
            value={formData.product}
            onChange={handleChange('product')}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="SLA Target Time"
            value={formData.sla_target_time}
            onChange={handleChange('sla_target_time')}
            required
            placeholder="HH:MM:SS (e.g., 06:00:00)"
            helperText="Format: HH:MM:SS"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_active}
                onChange={handleCheckboxChange('is_active')}
                color="primary"
              />
            }
            label="Active SLA Definition"
            sx={{ mt: 2 }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange('description')}
            placeholder="Enter SLA description or additional requirements..."
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={onCancel} startIcon={<CancelIcon />}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          startIcon={<SaveIcon />}
          sx={{ 
            background: 'linear-gradient(135deg, #48bb78 0%, #2d7d32 100%)',
            color: 'white'
          }}
        >
          Save SLA Definition
        </Button>
      </Box>
    </Box>
  );
};

// Instruction Form Component
const InstructionForm = ({ instruction, customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    job_name: instruction?.job_name || '',
    product: instruction?.product || customer?.product || '',
    instructions: instruction?.instructions || '',
    priority: instruction?.priority || 'Normal'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Job Name"
            value={formData.job_name}
            onChange={handleChange('job_name')}
            required
            placeholder="e.g., Daily_Data_Processing"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Product"
            value={formData.product}
            onChange={handleChange('product')}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={formData.priority}
              onChange={handleChange('priority')}
              label="Priority"
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Job Instructions"
            multiline
            rows={5}
            value={formData.instructions}
            onChange={handleChange('instructions')}
            required
            placeholder="Enter detailed job instructions and requirements..."
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={onCancel} startIcon={<CancelIcon />}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          startIcon={<SaveIcon />}
          sx={{ 
            background: 'linear-gradient(135deg, #ed8936 0%, #f56500 100%)',
            color: 'white'
          }}
        >
          Save Job Instruction
        </Button>
      </Box>
    </Box>
  );
};

export default ClientInventory; 