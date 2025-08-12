import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Badge,
  Divider,
  Button,
  Tab,
  Tabs,
  Avatar,
  Paper,
  Grid,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon,
  Schedule as ScheduleIcon,
  Assessment as ReportIcon,
  Security as SecurityIcon,
  Settings as SystemIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useTheme } from '../contexts/ThemeContext';

const Notifications = () => {
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'error',
      title: 'Batch Processing Failed',
      message: 'Batch job B09-20250105 failed to process. Please check the logs for more details.',
      timestamp: '2025-01-05 14:30:00',
      read: false,
      category: 'batch'
    },
    {
      id: 2,
      type: 'warning',
      title: 'High Volume Alert',
      message: 'Volumetrics for B46 exceeded threshold (150% of normal). Manual review recommended.',
      timestamp: '2025-01-05 12:15:00',
      read: false,
      category: 'volume'
    },
    {
      id: 3,
      type: 'success',
      title: 'SLA Target Met',
      message: 'All batch processes completed within SLA targets for the past 24 hours.',
      timestamp: '2025-01-05 09:00:00',
      read: true,
      category: 'sla'
    },
    {
      id: 4,
      type: 'info',
      title: 'System Maintenance Scheduled',
      message: 'Routine maintenance scheduled for Jan 6, 2025 from 2:00 AM to 4:00 AM EST.',
      timestamp: '2025-01-04 16:45:00',
      read: true,
      category: 'system'
    },
    {
      id: 5,
      type: 'warning',
      title: 'Upload Queue Backlog',
      message: '12 files pending in upload queue. Processing may be delayed.',
      timestamp: '2025-01-04 11:20:00',
      read: false,
      category: 'upload'
    },
    {
      id: 6,
      type: 'info',
      title: 'Weekly Report Generated',
      message: 'Your weekly performance report is ready for download.',
      timestamp: '2025-01-04 08:00:00',
      read: true,
      category: 'report'
    }
  ]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleMarkAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
    toast.success('Notification marked as read');
  };

  const handleDeleteNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    toast.success('Notification deleted');
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    toast.success('All notifications marked as read');
  };

  const handleDeleteAll = () => {
    setNotifications([]);
    toast.success('All notifications deleted');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'success': return <SuccessIcon color="success" />;
      case 'info': return <InfoIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  const getNotificationColor = (type) => {
    const isDark = theme.palette.mode === 'dark';
    switch (type) {
      case 'error': 
        return isDark ? 'rgba(244, 67, 54, 0.15)' : '#ffebee';
      case 'warning': 
        return isDark ? 'rgba(255, 152, 0, 0.15)' : '#fff8e1';
      case 'success': 
        return isDark ? 'rgba(76, 175, 80, 0.15)' : '#e8f5e8';
      case 'info': 
        return isDark ? 'rgba(33, 150, 243, 0.15)' : '#e3f2fd';
      default: 
        return isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'batch': return <ScheduleIcon />;
      case 'volume': return <ReportIcon />;
      case 'sla': return <SuccessIcon />;
      case 'system': return <SystemIcon />;
      case 'upload': return <NotificationsIcon />;
      case 'report': return <ReportIcon />;
      default: return <InfoIcon />;
    }
  };

  const filteredNotifications = selectedTab === 0 
    ? notifications 
    : selectedTab === 1 
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          <Badge badgeContent={unreadCount} color="error" sx={{ mr: 2 }}>
            <NotificationsIcon sx={{ mr: 1, fontSize: '2rem', color: 'primary.main' }} />
          </Badge>
          Notifications
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All Read
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteAll}
            disabled={notifications.length === 0}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              textAlign: 'center',
              backgroundColor: 'background.paper',
              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
            }}
          >
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
              {notifications.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Notifications
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              textAlign: 'center',
              backgroundColor: 'background.paper',
              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
            }}
          >
            <Typography variant="h4" color="error" sx={{ fontWeight: 'bold' }}>
              {unreadCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unread
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              textAlign: 'center',
              backgroundColor: 'background.paper',
              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
            }}
          >
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
              {notifications.filter(n => n.type === 'error' || n.type === 'warning').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Critical
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              textAlign: 'center',
              backgroundColor: 'background.paper',
              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
            }}
          >
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
              {notifications.filter(n => n.type === 'success').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Success
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Card 
        elevation={3}
        sx={{
          backgroundColor: 'background.paper',
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
        }}
      >
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'divider' 
        }}>
          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab 
              label={`All (${notifications.length})`}
              sx={{ color: 'text.primary' }}
            />
            <Tab 
              label={`Unread (${unreadCount})`}
              sx={{ color: 'text.primary' }}
            />
            <Tab 
              label={`Read (${notifications.length - unreadCount})`}
              sx={{ color: 'text.primary' }}
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 0 }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ 
                fontSize: 64, 
                color: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.300', 
                mb: 2 
              }} />
              <Typography variant="h6" color="text.secondary">
                No notifications found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedTab === 1 ? 'All caught up! No unread notifications.' : 'Your notification list is empty.'}
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.read ? 'transparent' : getNotificationColor(notification.type),
                      '&:hover': { 
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.08)' 
                          : 'rgba(0, 0, 0, 0.04)' 
                      },
                      py: 2,
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'transparent' }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                            {notification.title}
                          </Typography>
                          <Chip 
                            label={notification.category} 
                            size="small" 
                            variant="outlined"
                            icon={getCategoryIcon(notification.category)}
                            sx={{
                              borderColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.3)' 
                                : 'rgba(0, 0, 0, 0.23)',
                              color: 'text.secondary'
                            }}
                          />
                          {!notification.read && (
                            <Chip label="NEW" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notification.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!notification.read && (
                          <IconButton
                            edge="end"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <MarkReadIcon />
                          </IconButton>
                        )}
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteNotification(notification.id)}
                          title="Delete notification"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  {index < filteredNotifications.length - 1 && (
                    <Divider sx={{ 
                      borderColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.12)' 
                    }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {notifications.length > 0 && (
        <Alert 
          severity="info" 
          sx={{ 
            mt: 3,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(33, 150, 243, 0.1)' 
              : 'rgba(33, 150, 243, 0.1)',
            color: 'text.primary',
            border: theme.palette.mode === 'dark' 
              ? '1px solid rgba(33, 150, 243, 0.3)' 
              : '1px solid rgba(33, 150, 243, 0.2)'
          }}
        >
          <Typography variant="body2" color="text.primary">
            Notifications are automatically deleted after 30 days. Critical alerts are retained for 90 days.
          </Typography>
        </Alert>
      )}
    </Container>
  );
};

export default Notifications; 