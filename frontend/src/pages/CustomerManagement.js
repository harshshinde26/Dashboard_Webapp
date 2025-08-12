import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { customerAPI } from '../services/api';
import { toast } from 'react-toastify';
import FileUpload from '../components/FileUpload';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedProductFilter, setSelectedProductFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [uploadProduct, setUploadProduct] = useState('FACETS'); // Added missing state for upload product
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    product: 'FACETS',
    description: '',
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  // Product options
  const productOptions = ['FACETS', 'QNXT', 'CAE', 'TMS', 'EDM', 'CLSP'];

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    // Filter customers based on selected product
    if (selectedProductFilter) {
      setFilteredCustomers(customers.filter(customer => customer.product === selectedProductFilter));
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, selectedProductFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      // Use the new grouped endpoint
      const response = await customerAPI.getGrouped();
      setCustomers(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        code: customer.code,
        product: 'FACETS', // Default for adding new product
        description: '',
        is_active: customer.is_active,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        code: '',
        product: 'FACETS',
        description: '',
        is_active: true,
      });
    }
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      code: '',
      product: 'FACETS',
      description: '',
      is_active: true,
    });
    setErrors({});
  };

  const handleInputChange = (field) => (event) => {
    const value = field === 'is_active' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Customer code is required';
    } else if (formData.code.length < 3) {
      newErrors.code = 'Customer code must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Always create a new customer record since we're adding products to customer groups
      // Check if this exact combination already exists
      if (editingCustomer) {
        // Check if this product already exists for this customer group
        const existingProduct = editingCustomer.products.includes(formData.product);
        if (existingProduct) {
          toast.error(`Product ${formData.product} already exists for this customer`);
          return;
        }
      }
      
      await customerAPI.create(formData);
      toast.success(editingCustomer ? 'Product added to customer successfully' : 'Customer created successfully');
      
      handleCloseDialog();
      loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      if (error.response?.data) {
        const serverErrors = error.response.data;
        setErrors(serverErrors);
      }
      toast.error(`Failed to ${editingCustomer ? 'add product' : 'create customer'}`);
    }
  };

  const handleDelete = async (customer) => {
    if (customer.products.length === 1) {
      // If only one product, delete the entire customer group
      if (window.confirm(`Are you sure you want to delete customer "${customer.name}" with product "${customer.products[0]}"?`)) {
        try {
          await customerAPI.delete(customer.customer_ids[0]);
          toast.success('Customer deleted successfully');
          loadCustomers();
        } catch (error) {
          console.error('Error deleting customer:', error);
          toast.error('Failed to delete customer');
        }
      }
    } else {
      // If multiple products, show options to delete specific products
      handleShowDeleteOptions(customer);
    }
  };

  const handleShowDeleteOptions = (customer) => {
    const productList = customer.products.map((product, index) => 
      `${index + 1}. ${product}`
    ).join('\n');
    
    const choice = window.prompt(
      `Customer "${customer.name}" has multiple products:\n${productList}\n\nEnter the number of the product to delete, or type "ALL" to delete all:`
    );
    
    if (choice === null) return; // User cancelled
    
    if (choice.toUpperCase() === 'ALL') {
      handleDeleteAllProducts(customer);
    } else {
      const productIndex = parseInt(choice) - 1;
      if (productIndex >= 0 && productIndex < customer.products.length) {
        handleDeleteSingleProduct(customer, productIndex);
      } else {
        toast.error('Invalid selection');
      }
    }
  };

  const handleDeleteSingleProduct = async (customer, productIndex) => {
    const productToDelete = customer.products[productIndex];
    const customerIdToDelete = customer.customer_ids[productIndex];
    
    if (window.confirm(`Delete product "${productToDelete}" for customer "${customer.name}"?`)) {
      try {
        await customerAPI.delete(customerIdToDelete);
        toast.success(`Product "${productToDelete}" deleted successfully`);
        loadCustomers();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const handleDeleteAllProducts = async (customer) => {
    if (window.confirm(`Delete ALL products for customer "${customer.name}"? This will completely remove the customer.`)) {
      try {
        // Delete all individual customer records
        await Promise.all(customer.customer_ids.map(id => customerAPI.delete(id)));
        toast.success('Customer deleted successfully');
        loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer');
      }
    }
  };

  const handleToggleActive = async (customer) => {
    try {
      // Update all customer records in the group
      const updatePromises = customer.customer_ids.map(id => 
        customerAPI.update(id, { is_active: !customer.is_active })
      );
      
      await Promise.all(updatePromises);
      toast.success(`Customer ${!customer.is_active ? 'activated' : 'deactivated'} successfully`);
      loadCustomers();
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast.error('Failed to update customer status');
    }
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Customer Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Add Customer
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BusinessIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Customers
                  </Typography>
                  <Typography variant="h4" component="div">
                    {filteredCustomers.length}
                    {selectedProductFilter && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        ({customers.length} total)
                      </Typography>
                    )}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BusinessIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Customers
                  </Typography>
                  <Typography variant="h4" component="div" color="success.main">
                    {filteredCustomers.filter(c => c.is_active).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BusinessIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Recent Customers
                  </Typography>
                  <Typography variant="h4" component="div" color="info.main">
                    {filteredCustomers.filter(c => {
                      const createdDate = new Date(c.created_at);
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      return createdDate >= thirtyDaysAgo;
                    }).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BusinessIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Inactive Customers
                  </Typography>
                  <Typography variant="h4" component="div" color="warning.main">
                    {filteredCustomers.filter(c => !c.is_active).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Product Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filter Customers
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Product</InputLabel>
                <Select
                  value={selectedProductFilter}
                  label="Filter by Product"
                  onChange={(e) => setSelectedProductFilter(e.target.value)}
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
            {selectedProductFilter && (
              <Grid item>
                <Chip
                  label={`Product: ${selectedProductFilter}`}
                  onDelete={() => setSelectedProductFilter('')}
                  color="primary"
                />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Customer List
          </Typography>
          
          {filteredCustomers.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {selectedProductFilter 
                ? `No customers found for ${selectedProductFilter} product.`
                : 'No customers found. Click "Add Customer" to create your first customer.'
              }
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={`${customer.name}-${customer.code}`}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                          {customer.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={customer.code} 
                          variant="outlined" 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {customer.products.map((product) => (
                            <Chip 
                              key={product}
                              label={product} 
                              color="primary" 
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {customer.products.map((product) => (
                            <Box key={product} sx={{ mb: 0.5 }}>
                              <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                                {product}:
                              </Typography>
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {customer.descriptions[product] || 'No description'}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={customer.is_active}
                              onChange={() => handleToggleActive(customer)}
                              color="primary"
                            />
                          }
                          label={customer.is_active ? 'Active' : 'Inactive'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(customer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleOpenDialog(customer)}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(customer)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Upload Data Files
        </Typography>
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Data Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Upload Excel files for batch performance, volumetrics, and schedules. 
                    SLA tracking is automated based on batch performance data.
                  </Typography>
                  
                  {/* Product Selection for Upload */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Product for Upload</InputLabel>
                    <Select
                      value={uploadProduct}
                      onChange={(e) => setUploadProduct(e.target.value)}
                      label="Select Product for Upload"
                    >
                      {productOptions.map((product) => (
                        <MenuItem key={product} value={product}>
                          {product}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FileUpload selectedProduct={uploadProduct} />
                </CardContent>
              </Card>
            </Grid>
        </Grid>
      </Box>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Add Product to Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="e.g., Acme Corporation"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Code"
                value={formData.code}
                onChange={handleInputChange('code')}
                error={!!errors.code}
                helperText={errors.code}
                placeholder="e.g., ACME001"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                placeholder="Optional description of the customer..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="product-label">Product</InputLabel>
                <Select
                  labelId="product-label"
                  value={formData.product}
                  label="Product"
                  onChange={handleInputChange('product')}
                >
                  {productOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleInputChange('is_active')}
                    color="primary"
                  />
                }
                label="Active Customer"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCustomer ? 'Add Product' : 'Create Customer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerManagement; 