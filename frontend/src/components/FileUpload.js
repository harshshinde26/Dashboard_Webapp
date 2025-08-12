import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { fileProcessingAPI, customerAPI } from '../services/api';
import { toast } from 'react-toastify';

const FileUpload = ({ onUploadSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processResult, setProcessResult] = useState(null);

  const fileTypeOptions = [
    { value: 'BATCH_PERFORMANCE', label: 'Batch Performance' },
    { value: 'VOLUMETRICS', label: 'Volumetrics' },
    { value: 'BATCH_SCHEDULE', label: 'Batch Schedule' }
  ];

  // Product options
  const productOptions = [
    { value: 'FACETS', label: 'Facets' },
    { value: 'QNXT', label: 'QNXT' },
    { value: 'CAE', label: 'CAE' },
    { value: 'TMS', label: 'TMS' },
    { value: 'EDM', label: 'EDM' },
    { value: 'CLSP', label: 'CLSP' },
  ];

  React.useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const onDrop = React.useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setProcessResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  const handleProcessFile = async () => {
    if (!uploadedFile || !selectedCustomer || !selectedProduct || !selectedFileType) {
      toast.error('Please select a file, customer, product, and file type');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('customer_id', selectedCustomer);
      formData.append('product', selectedProduct);
      formData.append('file_type', selectedFileType);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Use the new upload endpoint that handles file uploads properly
      const response = await fileProcessingAPI.uploadFile(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setProcessResult({
        success: response.data.success,
        message: response.data.message,
      });

      if (response.data.success) {
        toast.success('File uploaded and processed successfully!');
        if (onUploadSuccess) {
          onUploadSuccess(response.data);
        }
      } else {
        toast.error(`Processing failed: ${response.data.message}`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setProcessResult({
        success: false,
        message: error.response?.data?.error || 'Upload failed',
      });
      toast.error('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setProcessResult(null);
    setUploadProgress(0);
    setSelectedCustomer('');
    setSelectedProduct('');
    setSelectedFileType('');
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Excel File
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Customer</InputLabel>
            <Select
              value={selectedCustomer}
              label="Select Customer"
              onChange={(e) => setSelectedCustomer(e.target.value)}
              disabled={uploading}
            >
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name} ({customer.code}) - {customer.product}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Product</InputLabel>
            <Select
              value={selectedProduct}
              label="Select Product"
              onChange={(e) => setSelectedProduct(e.target.value)}
              disabled={uploading}
            >
              {productOptions.map((product) => (
                <MenuItem key={product.value} value={product.value}>
                  {product.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal">
            <InputLabel>File Type</InputLabel>
            <Select
              value={selectedFileType}
              label="File Type"
              onChange={(e) => setSelectedFileType(e.target.value)}
              disabled={uploading}
            >
              {fileTypeOptions.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        {!uploadedFile ? (
          <Box
            {...getRootProps()}
            className={`file-upload-area ${isDragActive ? 'active' : ''}`}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop the Excel file here...' : 'Drag & drop an Excel file here'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              or click to select a file (.xls, .xlsx)
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 1,
                mb: 2,
              }}
            >
              <FileIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1">{uploadedFile.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                </Typography>
              </Box>
              <Chip
                label={fileTypeOptions.find(t => t.value === selectedFileType)?.label || 'Unknown'}
                color="primary"
                size="small"
              />
            </Box>

            {uploading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Processing... {uploadProgress}%
                </Typography>
              </Box>
            )}

            {processResult && (
              <Alert
                severity={processResult.success ? 'success' : 'error'}
                icon={processResult.success ? <SuccessIcon /> : <ErrorIcon />}
                sx={{ mb: 2 }}
              >
                {processResult.message}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleProcessFile}
                disabled={uploading || !selectedCustomer || !selectedFileType}
                startIcon={<UploadIcon />}
              >
                {uploading ? 'Processing...' : 'Process File'}
              </Button>
              <Button variant="outlined" onClick={resetUpload} disabled={uploading}>
                Reset
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 3 }}>
                       <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload Excel files for batch performance, volumetrics, batch schedules, and audit reports. 
        SLA tracking is now automated based on batch performance data and predefined SLA targets.
      </Typography>
               <Typography variant="body2" color="textSecondary" component="div">
                 <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                   <li><strong>Batch Performance:</strong> Job_Name, Start_Time, End_Time, jobrun_id, Status</li>
                   <li><strong>Volumetrics:</strong> Job Name, Date, Total Volume, Total Runtime</li>
                   <li><strong>SLA Tracking:</strong> Job Name, Date, SLA Target, Actual Runtime</li>
                   <li><strong>Batch Schedule:</strong> Schedule Name, Job Name, Schedule Pattern, Next Run Time</li>
                 </ul>
               </Typography>
      </Box>
    </Paper>
  );
};

export default FileUpload; 