# Account Request Management Guide

## 🔐 **Admin Account Request System**

This system allows users to submit account creation requests that administrators can review and approve manually through the Django admin interface.

---

## 📋 **How the System Works**

### **User Side:**
1. Users visit the login page
2. Click "Request New Account"
3. Fill out the account request form:
   - Username (must be unique)
   - Email (must be unique)
   - First & Last Name
   - Password (encrypted)
   - Requested Role (Viewer/Manager/Admin)
4. Submit request for admin review

### **Admin Side:**
1. Receive account request notifications
2. Review request details in Django admin
3. Approve or reject requests
4. User accounts are created automatically upon approval

---

## 🛠 **Django Admin Interface**

### **Accessing Account Requests:**
1. Go to Django admin: `http://localhost:8000/admin/`
2. Login with admin credentials
3. Navigate to **Dashboard App** → **Account Requests**

### **Account Request Fields:**
- **Username**: Requested username
- **Email**: User's email address
- **First/Last Name**: User's full name
- **Requested Role**: Viewer, Manager, or Administrator
- **Status**: Pending, Approved, Rejected, or Expired
- **Requested At**: When the request was submitted
- **Reviewed By**: Admin who processed the request
- **Review Notes**: Admin comments about the decision

### **Available Actions:**
- **Approve**: Creates user account and sets status to approved
- **Reject**: Denies request with optional notes
- **View Details**: See all request information

---

## ⚡ **Quick Actions**

### **Approve Account Request:**
1. In Django admin, go to Account Requests
2. Find the pending request
3. Click **"Approve"** button
4. User account is created automatically
5. User can now login with their credentials

### **Reject Account Request:**
1. Find the pending request
2. Click **"Reject"** button  
3. Optionally add rejection notes
4. Request is marked as rejected

### **Bulk Management:**
- Use admin filters to sort by status, role, or date
- Search by username, email, or name
- View request history and tracking

---

## 🎯 **Request Validation**

### **System Checks:**
✅ **Username Uniqueness**: Prevents duplicate usernames  
✅ **Email Uniqueness**: Prevents duplicate emails  
✅ **Pending Request Check**: Prevents multiple requests from same user  
✅ **Password Security**: Passwords are hashed before storage  
✅ **Role Validation**: Only valid roles accepted  

### **Admin Verification:**
- Review user's requested information
- Verify business justification for role level
- Check email domain/company affiliation
- Ensure appropriate access level

---

## 📊 **User Roles & Permissions**

### **Viewer Role:**
- ✅ Read-only dashboard access
- ✅ View all reports and analytics
- ❌ Cannot upload files
- ❌ Cannot manage customers
- ❌ No admin functions

### **Manager Role:**
- ✅ All Viewer permissions
- ✅ Upload and process files
- ✅ Manage customer data
- ✅ Edit dashboard content
- ❌ No system administration

### **Administrator Role:**
- ✅ All Manager permissions
- ✅ User management
- ✅ System settings
- ✅ Account request approval
- ✅ Full database access

---

## 🔄 **Account Creation Process**

### **When Request is Approved:**
1. **User Account Created**: Django User object with proper permissions
2. **Role Assignment**: is_staff and is_superuser set based on role
3. **Password Setup**: Pre-hashed password from request
4. **Status Update**: Request marked as approved
5. **Tracking**: Admin action logged with timestamp

### **Generated User Properties:**
```python
# Viewer Role
user.is_staff = False
user.is_superuser = False

# Manager Role  
user.is_staff = False
user.is_superuser = False

# Admin Role
user.is_staff = True
user.is_superuser = True
```

---

## 🚨 **Security Features**

### **Password Security:**
- Passwords are hashed immediately upon request submission
- Original passwords are never stored in plain text
- Uses Django's built-in password hashing

### **Access Control:**
- Only superusers can access account requests
- All admin actions are logged
- Request approval requires active admin session

### **Validation:**
- Prevents duplicate username/email requests
- Validates password strength requirements
- Ensures proper role assignment

---

## 📞 **Admin Commands**

### **View Pending Requests:**
```bash
python manage.py shell -c "
from dashboard_app.models import AccountRequest
pending = AccountRequest.objects.filter(status='PENDING')
for req in pending:
    print(f'{req.username} ({req.email}) - {req.requested_role}')
"
```

### **Approve Request Programmatically:**
```bash
python manage.py shell -c "
from dashboard_app.models import AccountRequest
from django.contrib.auth.models import User
req = AccountRequest.objects.get(username='username_here')
admin = User.objects.get(is_superuser=True)
req.approve(admin)
"
```

---

## ✅ **Benefits of This System**

✅ **Security**: Manual approval prevents unauthorized access  
✅ **Control**: Admins verify each user before activation  
✅ **Audit Trail**: Complete tracking of all requests and approvals  
✅ **Flexibility**: Different roles for different access levels  
✅ **User Experience**: Simple request form for users  
✅ **Admin Efficiency**: Clear interface for managing requests  

---

## 📈 **Best Practices**

### **For Administrators:**
1. **Review Regularly**: Check for pending requests daily
2. **Verify Identity**: Confirm user legitimacy before approval
3. **Appropriate Roles**: Grant minimum necessary permissions
4. **Document Decisions**: Add review notes for future reference
5. **Monitor Usage**: Track approved user activity

### **For Security:**
- Regular audit of user accounts
- Periodic review of role assignments
- Monitor failed login attempts
- Update admin passwords regularly

---

**The system ensures secure, controlled access while maintaining a professional user experience!** 