# Dashboard Web Application

A comprehensive dashboard web application for multiple customers that provides batch success and performance analysis, volumetrics tracking, SLA monitoring, and batch master schedule management.

## Features

### 🎯 Core Modules

1. **Batch Success and Performance**
   - Analyze jobs completed normally, abnormally, and normally*
   - Track long-running jobs for each month
   - Excel file import and processing
   - Performance metrics and charts

2. **Volumetrics Analysis**
   - Volume performance tracking (total, average, peak)
   - Runtime performance analysis (total, average, peak)
   - Processing efficiency calculations (records/minute, min/max performance)
   - Daily performance insights

3. **SLA Tracking**
   - Batch SLA compliance monitoring
   - Variance analysis and reporting
   - Business impact assessment
   - Real-time SLA status tracking

4. **Batch Master Schedule**
   - Client-specific schedule management
   - File download functionality
   - Schedule pattern tracking
   - Priority-based scheduling

5. **Multi-Customer Support**
   - Customer isolation and management
   - Customer-specific dashboards
   - Role-based data access

## Technology Stack

### Backend
- **Django 4.2.7** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL/SQLite** - Database
- **Pandas** - Data processing
- **OpenPyXL** - Excel file handling

### Frontend
- **React 18.2** - UI framework
- **Material-UI** - Component library
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Router** - Navigation

## Project Structure

```
Dashboard_WebApp/
├── backend/                    # Django backend
│   ├── dashboard_project/      # Main Django project
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── dashboard_app/          # Main Django app
│   │   ├── models.py           # Database models
│   │   ├── views.py            # API views
│   │   ├── serializers.py      # DRF serializers
│   │   ├── urls.py             # URL configuration
│   │   ├── admin.py            # Admin interface
│   │   └── utils.py            # Utility functions
│   └── manage.py
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   └── Layout/         # Layout components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   ├── App.js              # Main app component
│   │   └── index.js            # Entry point
│   ├── public/
│   └── package.json
├── requirements.txt            # Python dependencies
└── README.md
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

#### Option 1: Automated Setup (Recommended)
```bash
python setup_backend.py
```

#### Option 2: Manual Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment (Recommended)**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r ../requirements.txt
   ```
   
   **For Python 3.13 users:** If you encounter compatibility issues, try:
   ```bash
   pip install -r ../requirements-py313.txt
   ```

4. **Configure database**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

The Django backend will be available at `http://localhost:8000`

### Troubleshooting

#### "No module named 'django_filters'" Error
If you encounter this error:

1. **Ensure you're in a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Upgrade pip and try again:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **For Python 3.13 users:**
   ```bash
   pip install -r requirements-py313.txt
   ```

4. **Manual installation of django-filter:**
   ```bash
   pip install django-filter
   ```

#### Python 3.13 Compatibility
Python 3.13 is very new and some packages may not have stable releases yet. Consider:
- Using Python 3.11 or 3.12 for better compatibility
- Using the `requirements-py313.txt` file which includes pre-release packages

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

The React frontend will be available at `http://localhost:3000`

## API Endpoints

### Core APIs

- **Customers**: `/api/customers/`
- **Batch Jobs**: `/api/batch-jobs/`
- **Volumetrics**: `/api/volumetrics/`
- **SLA Data**: `/api/sla-data/`
- **Batch Schedules**: `/api/batch-schedules/`
- **File Uploads**: `/api/file-uploads/`

### Special Endpoints

- **Dashboard Overview**: `/api/dashboard-overview/`
- **File Processing**: `/api/process-file/`
- **Health Check**: `/api/health/`
- **Summary APIs**: `/api/{module}/summary/`

## Excel File Formats

### Batch Performance Files
Required columns:
- Job Name
- Job ID
- Status
- Start Time
- End Time (optional)
- Error Message (optional)

### Volumetrics Files
Required columns:
- Job Name
- Date
- Total Volume
- Total Runtime
- Peak Volume (optional)
- Average Volume (optional)

### SLA Tracking Files
Required columns:
- Job Name
- Date
- SLA Target
- Actual Runtime
- Business Impact (optional)

### Batch Schedule Files
Required columns:
- Schedule Name
- Job Name
- Schedule Pattern
- Next Run Time
- Status (optional)
- Priority (optional)

## Usage

### 1. Add Customers
- Navigate to Customer Management
- Add customer details (name, code, description)
- Activate customer accounts

### 2. Upload Data Files
- Use the file processing endpoints
- Upload Excel files for each module
- Monitor processing status

### 3. View Analytics
- Access the main dashboard for overview
- Navigate to specific modules for detailed analysis
- Filter data by customer and time periods

### 4. Download Schedule Files
- Access batch schedule module
- Download client-specific schedule files
- Track file access and updates

## Development

### Backend Development
- Models are in `dashboard_app/models.py`
- API views in `dashboard_app/views.py`
- Excel processing utilities in `dashboard_app/utils.py`
- Admin interface accessible at `/admin/`

### Frontend Development
- Components in `src/components/`
- Pages in `src/pages/`
- API services in `src/services/api.js`
- Styling with Material-UI and custom CSS

### Adding New Features
1. Update Django models if needed
2. Create/update serializers
3. Add API views and URL patterns
4. Create React components
5. Update navigation and routing

## Deployment

### Production Considerations
1. **Environment Variables**
   - Set `DEBUG=False` in Django settings
   - Configure proper database settings
   - Set secure secret keys

2. **Static Files**
   - Configure static file serving
   - Build React app for production
   - Set up proper CORS settings

3. **Database**
   - Use PostgreSQL for production
   - Set up proper backup strategies
   - Configure connection pooling

4. **Security**
   - Enable HTTPS
   - Configure proper CORS policies
   - Set up authentication if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository. 