from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.contrib import messages
from .models import (
    Customer, BatchJob, VolumetricData, SLAData, 
    BatchSchedule, FileUpload, AccountRequest, SLADefinition,
    PredictionModel, PredictionResult, HistoricalPattern, PredictionAlert
)


@admin.register(AccountRequest)
class AccountRequestAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'requested_role', 'status', 'requested_at', 'reviewed_by', 'action_buttons']
    list_filter = ['status', 'requested_role', 'requested_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    readonly_fields = ['password_hash', 'requested_at', 'reviewed_at', 'reviewed_by', 'created_user']
    
    fieldsets = (
        ('Request Information', {
            'fields': ('username', 'email', 'first_name', 'last_name', 'requested_role')
        }),
        ('Status', {
            'fields': ('status', 'review_notes')
        }),
        ('Tracking', {
            'fields': ('requested_at', 'reviewed_at', 'reviewed_by', 'created_user'),
            'classes': ('collapse',)
        }),
        ('Security', {
            'fields': ('password_hash',),
            'classes': ('collapse',)
        }),
    )
    
    def action_buttons(self, obj):
        if obj.status == 'PENDING':
            return format_html(
                '<a class="button" href="/admin/dashboard_app/accountrequest/{}/approve/">Approve</a>&nbsp;'
                '<a class="button" href="/admin/dashboard_app/accountrequest/{}/reject/">Reject</a>',
                obj.pk, obj.pk
            )
        elif obj.status == 'APPROVED':
            return format_html('<span style="color: green;">✓ Approved</span>')
        elif obj.status == 'REJECTED':
            return format_html('<span style="color: red;">✗ Rejected</span>')
        return ''
    action_buttons.short_description = 'Actions'
    action_buttons.allow_tags = True
    
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('<int:request_id>/approve/', self.approve_request, name='approve_account_request'),
            path('<int:request_id>/reject/', self.reject_request, name='reject_account_request'),
        ]
        return custom_urls + urls
    
    def approve_request(self, request, request_id):
        from django.shortcuts import redirect, get_object_or_404
        from django.contrib.auth.decorators import user_passes_test
        
        account_request = get_object_or_404(AccountRequest, id=request_id)
        
        if account_request.status == 'PENDING':
            try:
                user = account_request.approve(request.user)
                messages.success(request, f'Account request for {account_request.username} has been approved and user created.')
            except Exception as e:
                messages.error(request, f'Error approving request: {str(e)}')
        else:
            messages.warning(request, 'This request has already been processed.')
        
        return redirect('/admin/dashboard_app/accountrequest/')
    
    def reject_request(self, request, request_id):
        from django.shortcuts import redirect, get_object_or_404
        
        account_request = get_object_or_404(AccountRequest, id=request_id)
        
        if account_request.status == 'PENDING':
            notes = request.GET.get('notes', 'Rejected by admin')
            account_request.reject(request.user, notes)
            messages.success(request, f'Account request for {account_request.username} has been rejected.')
        else:
            messages.warning(request, 'This request has already been processed.')
        
        return redirect('/admin/dashboard_app/accountrequest/')


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    """Admin configuration for Customer model"""
    list_display = ['name', 'code', 'is_active', 'created_at', 'batch_jobs_count']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'code', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['name']
    
    def batch_jobs_count(self, obj):
        return obj.batch_jobs.count()
    batch_jobs_count.short_description = 'Total Jobs'


@admin.register(BatchJob)
class BatchJobAdmin(admin.ModelAdmin):
    """Admin configuration for BatchJob model"""
    list_display = ['job_name', 'jobrun_id', 'customer', 'status', 'start_time', 'duration_minutes', 'is_long_running']
    list_filter = ['status', 'is_long_running', 'customer', 'month', 'year']
    search_fields = ['job_name', 'job_id', 'jobrun_id', 'customer__name']
    readonly_fields = ['created_at']
    date_hierarchy = 'start_time'
    ordering = ['-start_time']
    
    fieldsets = (
        ('Job Information', {
            'fields': ('customer', 'job_name', 'jobrun_id', 'job_id', 'status')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time', 'duration_minutes', 'is_long_running')
        }),
        ('Additional Info', {
            'fields': ('month', 'year', 'error_message', 'created_at')
        }),
    )


@admin.register(VolumetricData)
class VolumetricDataAdmin(admin.ModelAdmin):
    """Admin configuration for VolumetricData model"""
    list_display = ['job_name', 'customer', 'date', 'total_volume', 'total_runtime_minutes', 'processing_efficiency']
    list_filter = ['customer', 'date', 'job_name']
    search_fields = ['job_name', 'customer__name']
    readonly_fields = ['created_at']
    date_hierarchy = 'date'
    ordering = ['-date']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('customer', 'job_name', 'date')
        }),
        ('Volume Metrics', {
            'fields': ('total_volume', 'peak_volume', 'average_volume')
        }),
        ('Runtime Metrics', {
            'fields': ('total_runtime_minutes', 'peak_runtime', 'average_runtime')
        }),
        ('Performance Metrics', {
            'fields': ('records_processed_per_minute', 'min_performance', 'max_performance', 'processing_efficiency')
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )


@admin.register(SLADefinition)
class SLADefinitionAdmin(admin.ModelAdmin):
    list_display = ['customer', 'product', 'job_name', 'sla_target_time', 'is_active', 'created_at']
    list_filter = ['product', 'is_active', 'customer', 'created_at']
    search_fields = ['job_name', 'customer__name', 'description']
    ordering = ['customer', 'product', 'job_name']
    
    fieldsets = (
        ('SLA Definition', {
            'fields': ('customer', 'product', 'job_name', 'sla_target_time', 'description', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SLAData)
class SLADataAdmin(admin.ModelAdmin):
    list_display = ['job_name', 'customer', 'product', 'date', 'sla_status', 'sla_target_time', 'actual_completion_time', 'days_late', 'variance_minutes']
    list_filter = ['sla_status', 'product', 'customer', 'completed_next_day', 'date']
    search_fields = ['job_name', 'customer__name', 'business_impact']
    ordering = ['-date', 'customer', 'job_name']
    readonly_fields = ['analyzed_at', 'created_at', 'variance_minutes', 'variance_percentage', 'sla_status']
    
    fieldsets = (
        ('Job Information', {
            'fields': ('customer', 'product', 'job_name', 'date', 'batch_job', 'sla_definition')
        }),
        ('SLA Analysis', {
            'fields': ('sla_target_time', 'actual_completion_time', 'sla_target_minutes', 'actual_runtime_minutes')
        }),
        ('Cross-Day Analysis', {
            'fields': ('completed_next_day', 'days_late'),
            'classes': ('collapse',)
        }),
        ('Results', {
            'fields': ('sla_status', 'variance_minutes', 'variance_percentage', 'business_impact')
        }),
        ('Metadata', {
            'fields': ('analyzed_at', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        return False  # SLA data is auto-generated, not manually created
    
    def has_change_permission(self, request, obj=None):
        return False  # SLA data is auto-generated, not manually editable


@admin.register(BatchSchedule)
class BatchScheduleAdmin(admin.ModelAdmin):
    """Admin configuration for BatchSchedule model"""
    list_display = ['schedule_name', 'customer', 'job_name', 'status', 'next_run_time', 'priority']
    list_filter = ['status', 'customer', 'priority']
    search_fields = ['schedule_name', 'job_name', 'customer__name']
    readonly_fields = ['created_at', 'updated_at', 'file_size']
    date_hierarchy = 'next_run_time'
    ordering = ['priority', 'next_run_time']
    
    fieldsets = (
        ('Schedule Information', {
            'fields': ('customer', 'schedule_name', 'job_name', 'status', 'priority')
        }),
        ('Timing', {
            'fields': ('schedule_pattern', 'next_run_time', 'last_run_time')
        }),
        ('File Information', {
            'fields': ('file_path', 'file_name', 'file_size')
        }),
        ('Dependencies', {
            'fields': ('dependencies',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(FileUpload)
class FileUploadAdmin(admin.ModelAdmin):
    """Admin configuration for FileUpload model"""
    list_display = ['file_name', 'customer', 'file_type', 'file_size_mb', 'processed', 'upload_date']
    list_filter = ['file_type', 'processed', 'customer', 'upload_date']
    search_fields = ['file_name', 'customer__name', 'uploaded_by__username']
    readonly_fields = ['file_size', 'upload_date']
    date_hierarchy = 'upload_date'
    ordering = ['-upload_date']
    
    def file_size_mb(self, obj):
        return f"{obj.file_size / (1024 * 1024):.2f} MB" if obj.file_size else "Unknown"
    file_size_mb.short_description = 'File Size'
    
    def save_model(self, request, obj, form, change):
        # Set the uploaded_by field to current user
        if not change:  # Only for new objects
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)
    
    fieldsets = (
        ('File Information', {
            'fields': ('customer', 'file_type', 'file_name', 'file_path')
        }),
        ('Processing', {
            'fields': ('processed', 'processing_log')
        }),
        ('Metadata', {
            'fields': ('uploaded_by', 'upload_date', 'file_size')
        }),
    )


# Smart Predictor Admin Interfaces

@admin.register(PredictionModel)
class PredictionModelAdmin(admin.ModelAdmin):
    """Admin configuration for PredictionModel"""
    list_display = ['customer', 'prediction_type', 'job_name', 'accuracy', 'precision', 'is_active', 'last_trained']
    list_filter = ['prediction_type', 'is_active', 'customer', 'last_trained']
    search_fields = ['job_name', 'customer__name']
    readonly_fields = ['created_at', 'updated_at', 'last_trained', 'training_data_points']
    ordering = ['-updated_at']
    
    fieldsets = (
        ('Model Configuration', {
            'fields': ('customer', 'prediction_type', 'job_name', 'is_active')
        }),
        ('Parameters', {
            'fields': ('lookback_days', 'confidence_threshold')
        }),
        ('Performance Metrics', {
            'fields': ('accuracy', 'precision', 'recall', 'f1_score'),
            'classes': ('collapse',)
        }),
        ('Training Information', {
            'fields': ('last_trained', 'training_data_points'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PredictionResult)
class PredictionResultAdmin(admin.ModelAdmin):
    """Admin configuration for PredictionResult"""
    list_display = ['job_name', 'prediction_type_display', 'predicted_date', 'risk_level', 'prediction_confidence', 'created_at']
    list_filter = ['risk_level', 'predicted_date', 'prediction_model__prediction_type', 'prediction_model__customer']
    search_fields = ['job_name', 'prediction_model__customer__name']
    readonly_fields = ['created_at', 'contributing_factors', 'historical_patterns']
    date_hierarchy = 'predicted_date'
    ordering = ['-predicted_date', '-prediction_confidence']
    
    def prediction_type_display(self, obj):
        return obj.prediction_model.get_prediction_type_display()
    prediction_type_display.short_description = 'Prediction Type'
    
    fieldsets = (
        ('Prediction Information', {
            'fields': ('prediction_model', 'job_name', 'predicted_date', 'prediction_confidence', 'risk_level')
        }),
        ('Prediction Values', {
            'fields': ('predicted_failure_probability', 'predicted_duration_minutes', 'predicted_sla_miss_probability', 'predicted_volume'),
            'classes': ('collapse',)
        }),
        ('Supporting Data', {
            'fields': ('contributing_factors', 'historical_patterns'),
            'classes': ('collapse',)
        }),
        ('Validation', {
            'fields': ('actual_outcome_known', 'prediction_accurate', 'actual_value'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(HistoricalPattern)
class HistoricalPatternAdmin(admin.ModelAdmin):
    """Admin configuration for HistoricalPattern"""
    list_display = ['customer', 'pattern_type', 'job_name', 'confidence_score', 'occurrence_frequency', 'is_active', 'discovered_at']
    list_filter = ['pattern_type', 'is_active', 'customer', 'discovered_at']
    search_fields = ['job_name', 'customer__name', 'pattern_description']
    readonly_fields = ['discovered_at', 'pattern_data']
    ordering = ['-confidence_score', '-discovered_at']
    
    fieldsets = (
        ('Pattern Information', {
            'fields': ('customer', 'pattern_type', 'job_name', 'is_active')
        }),
        ('Pattern Details', {
            'fields': ('pattern_description', 'confidence_score', 'occurrence_frequency')
        }),
        ('Timing Patterns', {
            'fields': ('time_of_day', 'day_of_week', 'day_of_month', 'month_of_year'),
            'classes': ('collapse',)
        }),
        ('Pattern Data', {
            'fields': ('pattern_data',),
            'classes': ('collapse',)
        }),
        ('Discovery Information', {
            'fields': ('discovered_at', 'data_range_start', 'data_range_end', 'sample_size'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PredictionAlert)
class PredictionAlertAdmin(admin.ModelAdmin):
    """Admin configuration for PredictionAlert"""
    list_display = ['title', 'alert_type', 'severity', 'status', 'predicted_impact_date', 'job_name_display', 'alert_date']
    list_filter = ['alert_type', 'severity', 'status', 'predicted_impact_date', 'alert_date']
    search_fields = ['title', 'message', 'prediction_result__job_name']
    readonly_fields = ['alert_date', 'acknowledged_at', 'resolved_at']
    date_hierarchy = 'predicted_impact_date'
    ordering = ['-alert_date', '-severity']
    
    def job_name_display(self, obj):
        return obj.prediction_result.job_name
    job_name_display.short_description = 'Job Name'
    
    fieldsets = (
        ('Alert Information', {
            'fields': ('prediction_result', 'alert_type', 'severity', 'status')
        }),
        ('Alert Content', {
            'fields': ('title', 'message', 'recommended_actions')
        }),
        ('Timing', {
            'fields': ('alert_date', 'predicted_impact_date', 'expiry_date')
        }),
        ('Response Tracking', {
            'fields': ('acknowledged_at', 'acknowledged_by', 'resolved_at', 'resolution_notes'),
            'classes': ('collapse',)
        }),
    )


 