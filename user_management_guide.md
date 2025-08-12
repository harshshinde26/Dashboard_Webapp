# Complete User Management Guide

## 🚀 **Dashboard Access for All Users**

This dashboard now supports **both demo accounts and custom user registration** with role-based permissions!

---

## 📋 **User Account Types**

### 1. **Demo Accounts** (Instant Access)
Pre-configured accounts for immediate testing:

| Username | Password | Role | Access Level |
|----------|----------|------|-------------|
| `admin` | `admin123` | Administrator | ⭐ Full System Access |
| `manager` | `manager123` | Manager | 📊 Read/Write Data |
| `viewer` | `viewer123` | Viewer | 👁️ Read-Only Access |
| `demo` | `demo` | Demo User | 🚀 Quick Manager Access |

### 2. **Custom Registered Accounts**
Users can now create personalized accounts with:
- ✅ Custom usernames and passwords
- ✅ Personal email addresses
- ✅ Chosen role and permissions
- ✅ Full integration with the system

---

## 🎯 **How to Access the Dashboard**

### **Option 1: Quick Demo Login**
1. Visit the login page
2. Click any demo account card
3. **Instant access!** 🎉

### **Option 2: Create Your Own Account**
1. Click **"Create New Account"** on login page
2. Fill in your details:
   - First & Last Name
   - Username (unique)
   - Email address (unique)
   - Password (min 6 characters)
   - Choose your role (Viewer/Manager/Admin)
3. Click **"Create Account"**
4. Login with your new credentials!

### **Option 3: Manual Login**
1. Enter your username and password
2. Works for both demo and registered accounts
3. Click **"Sign In"**

---

## 🔐 **Role-Based Permissions**

### **Viewer Role** 📖
- ✅ View all dashboards
- ✅ Access batch performance data
- ✅ View volumetrics and SLA tracking
- ❌ Cannot upload files
- ❌ Cannot manage customers
- ❌ No admin settings

### **Manager Role** 📊
- ✅ All Viewer permissions
- ✅ Upload and process files
- ✅ Manage customer data
- ✅ Edit dashboard content
- ❌ No system administration

### **Administrator Role** ⭐
- ✅ All Manager permissions
- ✅ User management
- ✅ System settings
- ✅ Full database access
- ✅ All administrative functions

---

## 🛠 **Technical Implementation**

### **Frontend Features**
- **Dual Authentication**: Demo accounts + real user registration
- **Role-Based UI**: Different features visible based on user role
- **Seamless Integration**: No difference in user experience
- **Form Validation**: Complete client-side validation
- **Error Handling**: Clear feedback for registration issues

### **Backend APIs**
```bash
# User Registration
POST /api/register/
{
  "username": "your_username",
  "password": "your_password",
  "email": "your@email.com",
  "firstName": "Your",
  "lastName": "Name",
  "role": "viewer|manager|admin"
}

# User Login (handles both demo and real users)
POST /api/login/
{
  "username": "your_username",
  "password": "your_password"
}
```

### **Database Integration**
- Real users stored in Django User model
- Role-based permissions via Django groups
- Automatic user creation and validation
- Secure password hashing

---

## 🎨 **User Interface Features**

### **Login Page Enhancements**
- **Prominent demo accounts** visible by default
- **Registration toggle** - switch between login and signup
- **Role selection** during registration
- **Real-time validation** with helpful error messages
- **Visual indicators** for account types

### **User Experience**
- **One-click demo login** for quick testing
- **Comprehensive registration form** for custom accounts
- **Clear role descriptions** during signup
- **Success notifications** with account type indication
- **Seamless navigation** between login and registration

---

## 🔧 **Management Commands**

### **Create Demo Users**
```bash
# Create all demo users in Django backend
python manage.py create_demo_users

# Recreate existing users
python manage.py create_demo_users --recreate
```

### **Manual User Creation**
```bash
# Create superuser (admin)
python manage.py createsuperuser

# Access Django admin panel
http://localhost:8000/admin/
```

---

## 🎯 **Feature Access Matrix**

| Feature | Demo Admin | Demo Manager | Demo Viewer | Custom Admin | Custom Manager | Custom Viewer |
|---------|------------|--------------|-------------|--------------|----------------|---------------|
| Dashboard Overview | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Batch Performance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Volumetrics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SLA Tracking | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Customer Management | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| File Upload | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| User Registration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| System Settings | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## 🚨 **Troubleshooting**

### **Registration Issues**
- **Username exists**: Choose a different username
- **Email exists**: Use a different email address
- **Password too short**: Use at least 6 characters
- **Network errors**: Check backend server connection

### **Login Problems**
- **Invalid credentials**: Check username/password
- **Account not found**: Try demo accounts or create new account
- **Permission denied**: Check your role permissions
- **Session expired**: Clear browser storage and re-login

### **Common Solutions**
```bash
# Clear browser storage
localStorage.clear()

# Restart backend server
python manage.py runserver

# Check user exists
python manage.py shell -c "from django.contrib.auth.models import User; print([u.username for u in User.objects.all()])"
```

---

## 🎉 **Success! Multi-User Dashboard**

✅ **Demo accounts** for instant testing  
✅ **Custom registration** for personalized access  
✅ **Role-based permissions** for secure access  
✅ **Seamless integration** between account types  
✅ **Professional UI** with clear guidance  

**Everyone can now access the dashboard with their preferred account type!** 