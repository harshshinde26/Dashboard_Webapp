# Dashboard User Access Guide

## 🎉 Multi-User Access Available!

**All user types can access the dashboard!** This application supports multiple user roles with different permission levels. **No admin privileges are required for basic dashboard access.**

## Available User Accounts

### Frontend Demo Authentication
The frontend uses a demo authentication system with the following pre-configured accounts:

| Username | Password    | Role    | Permissions | Description |
|----------|-------------|---------|-------------|-------------|
| `admin`  | `admin123`  | Admin   | Full Access | Complete system access and settings |
| `manager`| `manager123`| Manager | Read/Write  | Data and reports access |
| `viewer` | `viewer123` | Viewer  | Read Only   | Dashboard viewing only |
| `demo`   | `demo`      | Demo    | Read/Write  | Quick demo access |

### Backend Django Users
For backend administrative access, Django users are also available:

```bash
# Create/update all demo users
python manage.py create_demo_users

# Recreate all users (if they exist)
python manage.py create_demo_users --recreate
```

## How to Login

### Option 1: Quick Demo Login
1. Go to the login page
2. Click on any of the demo account cards
3. You'll be logged in instantly!

### Option 2: Manual Login
1. Enter username and password manually
2. Use any of the accounts listed above
3. Click "Sign In"

## User Permissions

### Dashboard Access
- ✅ **All users** can access the main dashboard
- ✅ **All users** can view batch performance data
- ✅ **All users** can view volumetrics and SLA tracking

### Feature Access by Role

| Feature | Admin | Manager | Viewer | Demo |
|---------|-------|---------|--------|------|
| Dashboard Overview | ✅ | ✅ | ✅ | ✅ |
| Batch Performance | ✅ | ✅ | ✅ | ✅ |
| Volumetrics | ✅ | ✅ | ✅ | ✅ |
| SLA Tracking | ✅ | ✅ | ✅ | ✅ |
| Customer Management | ✅ | ✅ | ❌ | ✅ |
| File Upload | ✅ | ✅ | ❌ | ✅ |
| System Settings | ✅ | ❌ | ❌ | ❌ |

## Troubleshooting

### "Only admin can login" Issue
If you're experiencing login issues:

1. **Use Demo Accounts**: The frontend authentication is separate from Django backend authentication
2. **Clear Browser Storage**: Clear localStorage if you have authentication issues
3. **Check Network**: Ensure the frontend can communicate with the backend

### Creating Additional Users

```bash
# Access Django admin (backend users)
python manage.py createsuperuser

# Create demo users (frontend compatible)
python manage.py create_demo_users
```

## Authentication Architecture

This application uses a **dual authentication system**:

1. **Frontend Demo Auth**: Simulated authentication for demo purposes
2. **Backend Django Auth**: Real Django user authentication for API access

The frontend demo authentication allows all user types to access the dashboard without requiring real backend authentication for basic viewing capabilities.

## Need Help?

- All demo accounts are visible on the login page
- Click the "🚀 Try Demo Accounts" button to see all available options
- Each account card shows the username, password, and permissions
- Simply click any account card to login instantly!

---

**Remember**: No admin privileges are required for basic dashboard access. All user types are welcome! 