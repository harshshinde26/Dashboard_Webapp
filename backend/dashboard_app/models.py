from django.db import models
from django.contrib.auth.models import User
from datetime import datetime
import os
from django.utils import timezone


class Customer(models.Model):
    """Model for managing multiple customers"""
    PRODUCT_CHOICES = [
        ('FACETS', 'Facets'),
        ('QNXT', 'QNXT'),
        ('CAE', 'CAE'),
        ('TMS', 'TMS'),
        ('EDM', 'EDM'),
        ('CLSP', 'CLSP'),
    ]
    
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50)
    product = models.CharField(max_length=50, choices=PRODUCT_CHOICES, default='FACETS')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code}) - {self.product}"

    class Meta:
        ordering = ['name']
        unique_together = [('name', 'code', 'product')]


class BatchJob(models.Model):
    """Model for batch job performance data"""
    STATUS_CHOICES = [
        ('COMPLETED_NORMAL', 'Completed Normally'),
        ('COMPLETED_ABNORMAL', 'Completed Abnormally'),
        ('COMPLETED_NORMAL_STAR', 'Completed Normally*'),
        ('LONG_RUNNING', 'Long Running'),
        ('FAILED', 'Failed'),
        ('PENDING', 'Pending'),
    ]

    PRODUCT_CHOICES = [
        ('FACETS', 'Facets'),
        ('QNXT', 'QNXT'),
        ('CAE', 'CAE'),
        ('TMS', 'TMS'),
        ('EDM', 'EDM'),
        ('CLSP', 'CLSP'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='batch_jobs')
    job_name = models.CharField(max_length=200)
    job_id = models.CharField(max_length=100, blank=True)  # Keep for backward compatibility
    jobrun_id = models.CharField(max_length=100, blank=True)  # New field for job run ID
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    product = models.CharField(max_length=50, choices=PRODUCT_CHOICES, default='FACETS')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.FloatField(null=True, blank=True)
    exit_code = models.IntegerField(null=True, blank=True, help_text="Exit code from batch job execution")
    error_message = models.TextField(blank=True)
    month = models.CharField(max_length=7)  # Format: YYYY-MM
    year = models.IntegerField()
    is_long_running = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto-populate product from customer if not set
        if not self.product and self.customer:
            self.product = self.customer.product
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.job_name} - {self.status} ({self.customer.name}) - {self.product}"

    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['customer', 'month']),
            models.Index(fields=['status']),
            models.Index(fields=['start_time']),
            models.Index(fields=['product']),
        ]


class VolumetricData(models.Model):
    """Model for volumetric performance data"""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='volumetric_data')
    job_name = models.CharField(max_length=200)
    date = models.DateField()
    total_volume = models.IntegerField()
    total_runtime_minutes = models.FloatField()
    records_processed_per_minute = models.FloatField()
    peak_volume = models.IntegerField(null=True, blank=True)
    average_volume = models.FloatField(null=True, blank=True)
    peak_runtime = models.FloatField(null=True, blank=True)
    average_runtime = models.FloatField(null=True, blank=True)
    min_performance = models.FloatField(null=True, blank=True)
    max_performance = models.FloatField(null=True, blank=True)
    processing_efficiency = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.job_name} - {self.date} ({self.customer.name})"

    class Meta:
        ordering = ['-date']
        unique_together = ['customer', 'job_name', 'date']
        indexes = [
            models.Index(fields=['customer', 'date']),
            models.Index(fields=['job_name']),
        ]


class SLADefinition(models.Model):
    """Model for defining SLA targets for specific jobs"""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='sla_definitions')
    product = models.CharField(max_length=50, choices=Customer.PRODUCT_CHOICES)
    job_name = models.CharField(max_length=200)
    sla_target_time = models.TimeField(help_text="Expected completion time (e.g., 23:50 for 11:50 PM)")
    description = models.TextField(blank=True, help_text="Description of this SLA")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['customer', 'product', 'job_name']
        ordering = ['customer', 'product', 'job_name']
        verbose_name = "SLA Definition"
        verbose_name_plural = "SLA Definitions"
        indexes = [
            models.Index(fields=['customer', 'product']),
            models.Index(fields=['job_name']),
        ]
    
    def __str__(self):
        return f"{self.customer.name} - {self.product} - {self.job_name} (Target: {self.sla_target_time})"


class SLAData(models.Model):
    """Model for SLA compliance analysis results (auto-generated from batch performance data)"""
    SLA_STATUS_CHOICES = [
        ('MET', 'SLA Met'),
        ('MISSED', 'SLA Missed'),
        ('AT_RISK', 'At Risk'),
        ('NO_SLA', 'No SLA Defined'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='sla_data')
    product = models.CharField(max_length=50, choices=Customer.PRODUCT_CHOICES)
    job_name = models.CharField(max_length=200)
    date = models.DateField()
    
    # SLA Definition reference
    sla_definition = models.ForeignKey(SLADefinition, on_delete=models.CASCADE, null=True, blank=True, related_name='sla_results')
    
    # Batch job reference (source of truth)
    batch_job = models.ForeignKey(BatchJob, on_delete=models.CASCADE, null=True, blank=True, related_name='sla_analysis')
    
    # SLA Analysis Results
    sla_target_time = models.TimeField(null=True, blank=True)
    actual_completion_time = models.TimeField(null=True, blank=True)
    sla_target_minutes = models.FloatField(help_text="Target time in minutes from midnight")
    actual_runtime_minutes = models.FloatField(help_text="Actual completion time in minutes from start of day")
    
    # Cross-day handling
    completed_next_day = models.BooleanField(default=False, help_text="Job completed after midnight")
    days_late = models.IntegerField(default=0, help_text="Number of days beyond target date")
    
    # Analysis results
    sla_status = models.CharField(max_length=20, choices=SLA_STATUS_CHOICES)
    variance_minutes = models.FloatField()  # Positive if over SLA, negative if under
    variance_percentage = models.FloatField()
    business_impact = models.TextField(blank=True)
    
    # Metadata
    analyzed_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto-calculate fields before saving
        if self.sla_target_minutes and self.actual_runtime_minutes:
            self.variance_minutes = self.actual_runtime_minutes - self.sla_target_minutes
            
            if self.sla_target_minutes > 0:
                self.variance_percentage = (self.variance_minutes / self.sla_target_minutes) * 100
            
            # Determine SLA status
            if not self.sla_definition:
                self.sla_status = 'MET'  # Jobs without SLA definition are considered met by default
            elif self.completed_next_day or self.days_late > 0:
                self.sla_status = 'MISSED'
            elif self.variance_minutes <= 0:
                self.sla_status = 'MET'
            else:
                self.sla_status = 'MISSED'
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.job_name} - {self.date} - {self.sla_status} ({self.customer.name}) - {self.product}"

    class Meta:
        ordering = ['-date', 'customer', 'job_name']
        verbose_name = "SLA Analysis Result"
        verbose_name_plural = "SLA Analysis Results"
        unique_together = ['customer', 'product', 'job_name', 'date', 'batch_job']
        indexes = [
            models.Index(fields=['customer', 'date']),
            models.Index(fields=['sla_status']),
            models.Index(fields=['product']),
            models.Index(fields=['date']),
        ]


class BatchSchedule(models.Model):
    """Model for batch schedule data - supports Tidal Excel format"""
    SCHEDULE_STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('SUSPENDED', 'Suspended'),
        ('MAINTENANCE', 'Under Maintenance'),
        ('ENABLED', 'Enabled'),
        ('DISABLED', 'Disabled'),
    ]

    CATEGORY_CHOICES = [
        ('TID', 'TID'),
        ('FOLDER', 'Folder'),
        ('CONDITION', 'Condition'),
        ('RESOURCE', 'Resource'),
        ('VARIABLE', 'Variable'),
        ('CONNECTION', 'Connection'),
        ('CALENDAR', 'Calendar'),
        ('AGENT', 'Agent'),
        ('GROUP', 'Group'),
    ]
    
    JOB_TYPE_CHOICES = [
        ('INDIVIDUAL_JOB', 'Individual Job'),
        ('JOB_GROUP', 'Job Group'),
        ('FOLDER_GROUP', 'Folder Group'),
        ('DEPENDENCY', 'Dependency'),
        ('CONDITION_CHECK', 'Condition Check'),
        ('RESOURCE_POOL', 'Resource Pool'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='batch_schedules')
    
    # Core job information
    job_name = models.CharField(max_length=200, help_text="JOBNAME from Excel")
    job_id = models.CharField(max_length=100, blank=True, help_text="ID from Excel") 
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='TID', help_text="CATEGORY from Excel")
    job_type = models.CharField(max_length=30, choices=JOB_TYPE_CHOICES, default='INDIVIDUAL_JOB', help_text="Derived job type based on analysis")
    
    # Status and enablement
    status = models.CharField(max_length=20, choices=SCHEDULE_STATUS_CHOICES, default='ACTIVE')
    enabled_status = models.CharField(max_length=20, blank=True, help_text="ENABLED OR DISABLED? from Excel")
    
    # Hierarchy and organization
    parent_group = models.CharField(max_length=500, blank=True, help_text="PARENT GROUP from Excel")
    
    # Calendar and timing
    calendar = models.CharField(max_length=200, blank=True, help_text="CALENDAR from Excel")
    calendar_offset = models.CharField(max_length=100, blank=True, help_text="CALENDAR OFFSET from Excel")
    time_zone = models.CharField(max_length=100, blank=True, default='DEFAULT (E.S.T.)', help_text="Time Zone from Excel")
    start_time = models.CharField(max_length=100, blank=True, help_text="Start time from Excel")
    until_time = models.CharField(max_length=100, blank=True, help_text="Until time from Excel")
    
    # Command and execution details
    command = models.TextField(blank=True, help_text="COMMAND from Excel")
    parameters = models.TextField(blank=True, help_text="Parameters from Excel")
    
    # Dependencies and execution
    dependencies = models.TextField(blank=True, help_text="DEP UPON JOB/VARIABLE/FILE from Excel")
    agent_or_agent_list = models.CharField(max_length=200, blank=True, help_text="RUNS ON AGENT OR AGENT LIST? from Excel")
    
    # Repeat and occurrence settings
    repeats = models.CharField(max_length=100, blank=True, default='DO NOT REPEAT', help_text="REPEATS from Excel")
    run_new_rerun_same = models.CharField(max_length=100, blank=True, help_text="RUN NEW/RERUN SAME OCCURRENCE? from Excel")
    max_number_of_runs = models.IntegerField(null=True, blank=True, help_text="MAX NUMBER OF RUNS from Excel")
    
    # Agent and runtime settings
    agent_agent_list = models.CharField(max_length=200, blank=True, help_text="Agent / Agent List from Excel")
    runtime_user = models.CharField(max_length=100, blank=True, help_text="RUNTIME USER from Excel")
    
    # Tracking and monitoring
    for_tracking_use = models.CharField(max_length=100, blank=True, default='Exit code', help_text="FOR TRACKING, USE: from Excel")
    exit_code_range = models.CharField(max_length=100, blank=True, help_text="Exit code range: from Excel")
    scan_output_normal = models.CharField(max_length=100, blank=True, help_text="SCAN OUTPUT: NORMAL from Excel")
    exclude_completed_abnormally = models.CharField(max_length=50, blank=True, help_text="Exclude Completed Abnormally? from Excel")
    
    # Resource management
    required_virtual_resource = models.CharField(max_length=200, blank=True, help_text="REQUIRED VIRTUAL RESOURCE from Excel")
    amount_required = models.IntegerField(null=True, blank=True, help_text="AMOUNT REQUIRED from Excel")
    
    # Runtime behavior
    if_job_currently_running = models.CharField(max_length=100, blank=True, help_text="If job is currently running: from Excel")
    if_not_enough_time_b4_outage = models.CharField(max_length=100, blank=True, help_text="If not enough time b4 outage from Excel")
    save_output_option = models.CharField(max_length=100, blank=True, help_text="Save Output Option from Excel")
    
    # Permission settings
    allow_unscheduled = models.CharField(max_length=10, blank=True, help_text="Allow unscheduled? from Excel")
    allow_operator_rerun = models.CharField(max_length=10, blank=True, help_text="Allow operator rerun? from Excel")
    require_operator_release = models.CharField(max_length=10, blank=True, help_text="Require operator release? from Excel")
    disable_carryover = models.CharField(max_length=10, blank=True, help_text="Disable Carryover? from Excel")
    
    # History and documentation
    history_retention_days = models.IntegerField(null=True, blank=True, help_text="HISTORY RETENTION (DAYS) from Excel")
    run_book = models.TextField(blank=True, help_text="run book from Excel")
    notes = models.TextField(blank=True, help_text="Notes from Excel")
    
    # Metadata
    class_name = models.CharField(max_length=200, blank=True, help_text="CLASS from Excel")
    owner = models.CharField(max_length=200, blank=True, help_text="OWNER from Excel")
    last_modified_on = models.DateTimeField(null=True, blank=True, help_text="LAST MODIFIED ON from Excel")
    
    # Legacy fields (keep for backward compatibility)
    schedule_name = models.CharField(max_length=200, blank=True, help_text="Legacy field or derived from job_name")
    schedule_pattern = models.CharField(max_length=100, blank=True, help_text="Legacy field or derived from calendar")
    next_run_time = models.DateTimeField(null=True, blank=True, help_text="Legacy field or calculated")
    last_run_time = models.DateTimeField(null=True, blank=True, help_text="Legacy field")
    priority = models.IntegerField(default=1, help_text="Legacy field")
    
    # File tracking
    file_path = models.CharField(max_length=500, blank=True)
    file_name = models.CharField(max_length=200, blank=True)
    file_size = models.IntegerField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-populate schedule_name from job_name if not set
        if not self.schedule_name and self.job_name:
            self.schedule_name = self.job_name
        
        # Auto-determine job_type if not explicitly set
        if not self.job_type or self.job_type == 'INDIVIDUAL_JOB':
            self.job_type = self._determine_job_type()
        
        super().save(*args, **kwargs)
    
    def _determine_job_type(self):
        """Determine job type based on naming patterns and characteristics"""
        job_name = self.job_name.upper() if self.job_name else ''
        parent_group = self.parent_group.upper() if self.parent_group else ''
        
        # Check category first (highest priority)
        if self.category == 'GROUP':
            return 'JOB_GROUP'
        elif self.category == 'FOLDER':
            return 'FOLDER_GROUP'
        elif self.category == 'CONDITION':
            return 'CONDITION_CHECK'
        elif self.category in ['RESOURCE', 'AGENT']:
            return 'RESOURCE_POOL'
        
        # Check if this job is referenced as a parent group by other jobs
        if BatchSchedule.objects.filter(parent_group__icontains=self.job_name).exists():
            return 'JOB_GROUP'
        
        # Check for dependency/condition patterns
        if any(pattern in job_name for pattern in ['DEP_CHECK', 'DEPENDENCY', 'CONDITION', '_CHK_', '_CHECK']):
            return 'CONDITION_CHECK'
        
        # Check for resource patterns
        if any(pattern in job_name for pattern in ['RESOURCE', 'POOL', 'AGENT']):
            return 'RESOURCE_POOL'
        
        # Check for job group patterns (jobs that manage other jobs)
        if any(pattern in job_name for pattern in ['_GROUP', 'BATCH_START', 'INITIATOR', 'CLEANUP', 'MANAGER']):
            return 'JOB_GROUP'
        
        # Check for double underscore pattern (often indicates group jobs)
        if '__' in job_name:
            return 'JOB_GROUP'
        
        # Check based on parent group patterns
        if any(pattern in parent_group for pattern in ['GROUP', 'FOLDER', 'COLLECTION']):
            if 'CLEANUP' in job_name or 'MAINTENANCE' in job_name:
                return 'JOB_GROUP'
        
        # Default to individual job
        return 'INDIVIDUAL_JOB'

    def __str__(self):
        return f"{self.job_name} - {self.status} ({self.customer.name})"

    class Meta:
        ordering = ['job_name', 'priority']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['job_name']),
            models.Index(fields=['category']),
            models.Index(fields=['enabled_status']),
        ]


class FileUpload(models.Model):
    """Model for tracking uploaded files"""
    FILE_TYPE_CHOICES = [
        ('BATCH_PERFORMANCE', 'Batch Performance'),
        ('VOLUMETRICS', 'Volumetrics'),
        ('SLA_TRACKING', 'SLA Tracking'),
        ('BATCH_SCHEDULE', 'Batch Schedule'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='file_uploads')
    file_type = models.CharField(max_length=50, choices=FILE_TYPE_CHOICES)
    file_name = models.CharField(max_length=200)
    file_path = models.CharField(max_length=500)
    file_size = models.IntegerField(null=True, blank=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    processing_log = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    def save(self, *args, **kwargs):
        # Automatically calculate file size if file_path exists
        if self.file_path and not self.file_size:
            try:
                if os.path.exists(self.file_path):
                    self.file_size = os.path.getsize(self.file_path)
            except:
                self.file_size = 0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.file_name} - {self.file_type} ({self.customer.name})"

    class Meta:
        ordering = ['-upload_date']
        indexes = [
            models.Index(fields=['customer', 'file_type']),
            models.Index(fields=['processed']),
        ]


class AccountRequest(models.Model):
    """Model for account creation requests that need admin approval"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('EXPIRED', 'Expired'),
    ]
    
    ROLE_CHOICES = [
        ('viewer', 'Viewer'),
        ('manager', 'Manager'),
        ('admin', 'Administrator'),
    ]
    
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    password_hash = models.CharField(max_length=128)  # Store hashed password
    requested_role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Request tracking
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_requests')
    review_notes = models.TextField(blank=True)
    
    # User who gets created when approved
    created_user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='account_request')
    
    def __str__(self):
        return f"{self.username} ({self.email}) - {self.status}"
    
    def approve(self, admin_user):
        """Approve the request and create the user account"""
        from django.contrib.auth.hashers import make_password
        
        if self.status != 'PENDING':
            raise ValueError("Only pending requests can be approved")
        
        # Create the user account
        user = User.objects.create(
            username=self.username,
            email=self.email,
            first_name=self.first_name,
            last_name=self.last_name,
            password=self.password_hash,  # Already hashed
            is_staff=(self.requested_role == 'admin'),
            is_superuser=(self.requested_role == 'admin'),
            is_active=True
        )
        
        # Update request status
        self.status = 'APPROVED'
        self.reviewed_at = timezone.now()
        self.reviewed_by = admin_user
        self.created_user = user
        self.save()
        
        return user
    
    def reject(self, admin_user, notes=""):
        """Reject the request"""
        if self.status != 'PENDING':
            raise ValueError("Only pending requests can be rejected")
        
        self.status = 'REJECTED'
        self.reviewed_at = timezone.now()
        self.reviewed_by = admin_user
        self.review_notes = notes
        self.save()
    
    class Meta:
        ordering = ['-requested_at']
        verbose_name = "Account Request"
        verbose_name_plural = "Account Requests"


class PredictionModel(models.Model):
    """Base model for storing prediction configurations and accuracy metrics"""
    PREDICTION_TYPES = [
        ('FAILURE', 'Job Failure Prediction'),
        ('LONG_RUNNER', 'Long Running Job Prediction'),
        ('SLA_MISS', 'SLA Miss Prediction'),
        ('HIGH_VOLUME', 'High Volume Prediction'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='prediction_models')
    prediction_type = models.CharField(max_length=20, choices=PREDICTION_TYPES)
    job_name = models.CharField(max_length=200, blank=True, help_text="Specific job or empty for all jobs")
    
    # Model parameters
    lookback_days = models.IntegerField(default=30, help_text="Days of historical data to analyze")
    confidence_threshold = models.FloatField(default=0.7, help_text="Minimum confidence for predictions")
    
    # Model performance metrics
    accuracy = models.FloatField(null=True, blank=True, help_text="Model accuracy percentage")
    precision = models.FloatField(null=True, blank=True)
    recall = models.FloatField(null=True, blank=True)
    f1_score = models.FloatField(null=True, blank=True)
    
    # Training information
    last_trained = models.DateTimeField(null=True, blank=True)
    training_data_points = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        job_part = f" - {self.job_name}" if self.job_name else " - All Jobs"
        return f"{self.customer.name} - {self.get_prediction_type_display()}{job_part}"
    
    class Meta:
        ordering = ['-updated_at']
        unique_together = ['customer', 'prediction_type', 'job_name']
        verbose_name = "Prediction Model"
        verbose_name_plural = "Prediction Models"


class PredictionResult(models.Model):
    """Store individual prediction results"""
    RISK_LEVELS = [
        ('LOW', 'Low Risk'),
        ('MEDIUM', 'Medium Risk'),
        ('HIGH', 'High Risk'),
        ('CRITICAL', 'Critical Risk'),
    ]
    
    prediction_model = models.ForeignKey(PredictionModel, on_delete=models.CASCADE, related_name='results')
    
    # Prediction details
    job_name = models.CharField(max_length=200)
    predicted_date = models.DateField()
    prediction_confidence = models.FloatField(help_text="Confidence score 0-1")
    risk_level = models.CharField(max_length=10, choices=RISK_LEVELS)
    
    # Prediction specifics based on type
    predicted_failure_probability = models.FloatField(null=True, blank=True)
    predicted_duration_minutes = models.FloatField(null=True, blank=True)
    predicted_sla_miss_probability = models.FloatField(null=True, blank=True)
    predicted_volume = models.IntegerField(null=True, blank=True)
    
    # Supporting factors
    contributing_factors = models.JSONField(default=dict, help_text="Factors contributing to this prediction")
    historical_patterns = models.JSONField(default=dict, help_text="Historical patterns that support this prediction")
    
    # Validation (filled when actual results are available)
    actual_outcome_known = models.BooleanField(default=False)
    prediction_accurate = models.BooleanField(null=True, blank=True)
    actual_value = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.job_name} - {self.predicted_date} - {self.risk_level} ({self.prediction_confidence:.2f})"
    
    class Meta:
        ordering = ['-predicted_date', '-prediction_confidence']
        unique_together = ['prediction_model', 'job_name', 'predicted_date']
        indexes = [
            models.Index(fields=['predicted_date', 'risk_level']),
            models.Index(fields=['job_name']),
        ]


class HistoricalPattern(models.Model):
    """Store discovered patterns from historical data analysis"""
    PATTERN_TYPES = [
        ('SEASONAL', 'Seasonal Pattern'),
        ('WEEKLY', 'Weekly Pattern'),
        ('MONTHLY', 'Monthly Pattern'),
        ('FAILURE_SEQUENCE', 'Failure Sequence'),
        ('VOLUME_SPIKE', 'Volume Spike'),
        ('PERFORMANCE_DEGRADATION', 'Performance Degradation'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='historical_patterns')
    pattern_type = models.CharField(max_length=30, choices=PATTERN_TYPES)
    job_name = models.CharField(max_length=200, blank=True)
    
    # Pattern description
    pattern_description = models.TextField()
    confidence_score = models.FloatField(help_text="How confident we are in this pattern (0-1)")
    
    # Pattern data
    pattern_data = models.JSONField(help_text="Detailed pattern information")
    occurrence_frequency = models.FloatField(help_text="How often this pattern occurs")
    
    # Time-based patterns
    time_of_day = models.TimeField(null=True, blank=True)
    day_of_week = models.IntegerField(null=True, blank=True, help_text="1=Monday, 7=Sunday")
    day_of_month = models.IntegerField(null=True, blank=True)
    month_of_year = models.IntegerField(null=True, blank=True)
    
    # Discovery information
    discovered_at = models.DateTimeField(auto_now_add=True)
    data_range_start = models.DateField()
    data_range_end = models.DateField()
    sample_size = models.IntegerField(help_text="Number of data points used to identify this pattern")
    
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        job_part = f" - {self.job_name}" if self.job_name else " - All Jobs"
        return f"{self.customer.name} - {self.get_pattern_type_display()}{job_part}"
    
    class Meta:
        ordering = ['-confidence_score', '-discovered_at']
        indexes = [
            models.Index(fields=['customer', 'pattern_type']),
            models.Index(fields=['job_name']),
            models.Index(fields=['confidence_score']),
        ]


class PredictionAlert(models.Model):
    """Alerts generated from high-risk predictions"""
    ALERT_TYPES = [
        ('FAILURE_WARNING', 'Job Failure Warning'),
        ('LONG_RUNNER_WARNING', 'Long Running Job Warning'),
        ('SLA_MISS_WARNING', 'SLA Miss Warning'),
        ('VOLUME_SPIKE_WARNING', 'High Volume Warning'),
    ]
    
    SEVERITY_LEVELS = [
        ('INFO', 'Information'),
        ('WARNING', 'Warning'),
        ('CRITICAL', 'Critical'),
        ('URGENT', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('ACKNOWLEDGED', 'Acknowledged'),
        ('RESOLVED', 'Resolved'),
        ('EXPIRED', 'Expired'),
    ]
    
    prediction_result = models.ForeignKey(PredictionResult, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPES)
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Alert content
    title = models.CharField(max_length=200)
    message = models.TextField()
    recommended_actions = models.TextField(blank=True)
    
    # Timing
    alert_date = models.DateTimeField(auto_now_add=True)
    predicted_impact_date = models.DateField()
    expiry_date = models.DateTimeField(null=True, blank=True)
    
    # Response tracking
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='acknowledged_alerts')
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.title} - {self.severity} - {self.status}"
    
    class Meta:
        ordering = ['-alert_date', '-severity']
        indexes = [
            models.Index(fields=['status', 'severity']),
            models.Index(fields=['predicted_impact_date']),
            models.Index(fields=['alert_date']),
        ] 