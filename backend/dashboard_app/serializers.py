from rest_framework import serializers
from .models import (
    Customer, BatchJob, VolumetricData, SLAData, BatchSchedule, FileUpload, SLADefinition,
    PredictionModel, PredictionResult, HistoricalPattern, PredictionAlert
)
from django.utils import timezone


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model"""
    batch_jobs_count = serializers.SerializerMethodField()
    last_activity = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ['id', 'name', 'code', 'product', 'description', 'is_active', 
                 'created_at', 'updated_at', 'batch_jobs_count', 'last_activity']

    def get_batch_jobs_count(self, obj):
        return obj.batch_jobs.count()

    def get_last_activity(self, obj):
        last_job = obj.batch_jobs.first()
        return last_job.start_time if last_job else None


class GroupedCustomerSerializer(serializers.Serializer):
    """Serializer for grouped customers (by name and code)"""
    name = serializers.CharField()
    code = serializers.CharField()
    products = serializers.ListField(child=serializers.CharField())
    descriptions = serializers.DictField()  # {product: description}
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    batch_jobs_count = serializers.IntegerField()
    last_activity = serializers.DateTimeField(allow_null=True)
    customer_ids = serializers.ListField(child=serializers.IntegerField())  # List of individual customer IDs


class BatchJobSerializer(serializers.ModelSerializer):
    """Serializer for BatchJob model"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = BatchJob
        fields = ['id', 'customer', 'customer_name', 'job_name', 'job_id', 'jobrun_id', 'status',
                 'product', 'start_time', 'end_time', 'duration_minutes', 'duration_hours',
                 'exit_code', 'error_message', 'month', 'year', 'is_long_running', 'created_at']

    def get_duration_hours(self, obj):
        if obj.duration_minutes:
            return round(obj.duration_minutes / 60, 2)
        return None


class BatchJobSummarySerializer(serializers.Serializer):
    """Serializer for batch job summary statistics"""
    total_jobs = serializers.IntegerField()
    completed_normal = serializers.IntegerField()
    completed_abnormal = serializers.IntegerField()
    completed_normal_star = serializers.IntegerField()
    long_running = serializers.IntegerField()
    failed = serializers.IntegerField()
    pending = serializers.IntegerField()
    success_rate = serializers.FloatField()
    average_duration = serializers.FloatField()
    month = serializers.CharField()
    product = serializers.CharField()


class VolumetricDataSerializer(serializers.ModelSerializer):
    """Serializer for VolumetricData model"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    efficiency_rating = serializers.SerializerMethodField()

    class Meta:
        model = VolumetricData
        fields = ['id', 'customer', 'customer_name', 'job_name', 'date',
                 'total_volume', 'total_runtime_minutes', 'records_processed_per_minute',
                 'peak_volume', 'average_volume', 'peak_runtime', 'average_runtime',
                 'min_performance', 'max_performance', 'processing_efficiency',
                 'efficiency_rating', 'created_at']

    def get_efficiency_rating(self, obj):
        if obj.processing_efficiency:
            if obj.processing_efficiency >= 90:
                return 'Excellent'
            elif obj.processing_efficiency >= 75:
                return 'Good'
            elif obj.processing_efficiency >= 60:
                return 'Average'
            else:
                return 'Poor'
        return 'Unknown'


class VolumetricSummarySerializer(serializers.Serializer):
    """Serializer for volumetric summary statistics"""
    total_volume = serializers.IntegerField()
    average_volume = serializers.FloatField()
    peak_volume = serializers.IntegerField()
    total_runtime = serializers.FloatField()
    average_runtime = serializers.FloatField()
    peak_runtime = serializers.FloatField()
    average_efficiency = serializers.FloatField()
    min_performance = serializers.FloatField()
    max_performance = serializers.FloatField()
    job_name = serializers.CharField()


class SLADefinitionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = SLADefinition
        fields = [
            'id', 'customer', 'customer_name', 'product', 'job_name', 
            'sla_target_time', 'description', 'is_active', 
            'created_at', 'updated_at'
        ]


class SLADataSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    sla_target_hours = serializers.SerializerMethodField()
    actual_runtime_hours = serializers.SerializerMethodField()
    batch_job_id = serializers.CharField(source='batch_job.id', read_only=True)
    sla_definition_id = serializers.CharField(source='sla_definition.id', read_only=True)
    
    class Meta:
        model = SLAData
        fields = [
            'id', 'customer', 'customer_name', 'product', 'job_name', 'date',
            'sla_definition', 'sla_definition_id', 'batch_job', 'batch_job_id',
            'sla_target_time', 'actual_completion_time', 'sla_target_minutes',
            'actual_runtime_minutes', 'sla_target_hours', 'actual_runtime_hours',
            'completed_next_day', 'days_late', 'sla_status', 'variance_minutes',
            'variance_percentage', 'business_impact', 'analyzed_at', 'created_at'
        ]
    
    def get_sla_target_hours(self, obj):
        return round(obj.sla_target_minutes / 60, 2) if obj.sla_target_minutes else 0
    
    def get_actual_runtime_hours(self, obj):
        return round(obj.actual_runtime_minutes / 60, 2) if obj.actual_runtime_minutes else 0


class SLASummarySerializer(serializers.Serializer):
    """Serializer for SLA summary statistics"""
    total_jobs = serializers.IntegerField()
    sla_met = serializers.IntegerField()
    sla_missed = serializers.IntegerField()
    at_risk = serializers.IntegerField()
    sla_compliance_rate = serializers.FloatField()
    average_variance = serializers.FloatField()
    month = serializers.CharField()
    product = serializers.CharField()


class BatchScheduleSerializer(serializers.ModelSerializer):
    """Serializer for BatchSchedule model - supports Tidal format"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    file_size_mb = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    formatted_last_modified = serializers.SerializerMethodField()

    class Meta:
        model = BatchSchedule
        fields = [
            'id', 'customer', 'customer_name', 
            # Core job information
            'job_name', 'job_id', 'category', 'job_type',
            # Status and enablement
            'status', 'enabled_status',
            # Hierarchy and organization  
            'parent_group',
            # Calendar and timing
            'calendar', 'calendar_offset', 'time_zone', 'start_time', 'until_time',
            # Command and execution details
            'command', 'parameters',
            # Dependencies and execution
            'dependencies', 'agent_or_agent_list',
            # Repeat and occurrence settings
            'repeats', 'run_new_rerun_same', 'max_number_of_runs',
            # Agent and runtime settings
            'agent_agent_list', 'runtime_user',
            # Tracking and monitoring
            'for_tracking_use', 'exit_code_range', 'scan_output_normal', 'exclude_completed_abnormally',
            # Resource management
            'required_virtual_resource', 'amount_required',
            # Runtime behavior
            'if_job_currently_running', 'if_not_enough_time_b4_outage', 'save_output_option',
            # Permission settings
            'allow_unscheduled', 'allow_operator_rerun', 'require_operator_release', 'disable_carryover',
            # History and documentation
            'history_retention_days', 'run_book', 'notes',
            # Metadata
            'class_name', 'owner', 'last_modified_on', 'formatted_last_modified',
            # Legacy fields
            'schedule_name', 'schedule_pattern', 'next_run_time', 'last_run_time', 'priority',
            # File tracking
            'file_path', 'file_name', 'file_size', 'file_size_mb', 
            # Computed fields
            'is_overdue', 'created_at', 'updated_at'
        ]

    def get_file_size_mb(self, obj):
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return None

    def get_is_overdue(self, obj):
        return obj.next_run_time < timezone.now() if obj.next_run_time else False
    
    def get_formatted_last_modified(self, obj):
        if obj.last_modified_on:
            return obj.last_modified_on.strftime('%Y-%m-%d %H:%M:%S')
        return None


class FileUploadSerializer(serializers.ModelSerializer):
    """Serializer for FileUpload model"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    file_size_mb = serializers.SerializerMethodField()

    class Meta:
        model = FileUpload
        fields = ['id', 'customer', 'customer_name', 'file_type', 'file_name',
                 'file_path', 'file_size', 'file_size_mb', 'upload_date',
                 'processed', 'processing_log', 'uploaded_by', 'uploaded_by_username']

    def get_file_size_mb(self, obj):
        return round(obj.file_size / (1024 * 1024), 2)


class DashboardOverviewSerializer(serializers.Serializer):
    """Serializer for dashboard overview data"""
    total_customers = serializers.IntegerField()
    active_customers = serializers.IntegerField()
    total_jobs_today = serializers.IntegerField()
    successful_jobs_today = serializers.IntegerField()
    failed_jobs_today = serializers.IntegerField()
    sla_compliance_rate = serializers.FloatField()
    average_processing_efficiency = serializers.FloatField()
    total_files_processed = serializers.IntegerField()
    last_updated = serializers.DateTimeField()

 
# Smart Predictor Serializers

class PredictionModelSerializer(serializers.ModelSerializer):
    """Serializer for PredictionModel"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    prediction_type_display = serializers.CharField(source='get_prediction_type_display', read_only=True)
    active_predictions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PredictionModel
        fields = [
            'id', 'customer', 'customer_name', 'prediction_type', 'prediction_type_display',
            'job_name', 'lookback_days', 'confidence_threshold', 'accuracy', 'precision',
            'recall', 'f1_score', 'last_trained', 'training_data_points', 'is_active',
            'active_predictions_count', 'created_at', 'updated_at'
        ]
    
    def get_active_predictions_count(self, obj):
        return obj.results.filter(predicted_date__gte=timezone.now().date()).count()


class PredictionResultSerializer(serializers.ModelSerializer):
    """Serializer for PredictionResult"""
    prediction_type = serializers.CharField(source='prediction_model.prediction_type', read_only=True)
    prediction_type_display = serializers.CharField(source='prediction_model.get_prediction_type_display', read_only=True)
    customer_name = serializers.CharField(source='prediction_model.customer.name', read_only=True)
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    days_until_prediction = serializers.SerializerMethodField()
    
    class Meta:
        model = PredictionResult
        fields = [
            'id', 'prediction_model', 'prediction_type', 'prediction_type_display',
            'customer_name', 'job_name', 'predicted_date', 'prediction_confidence',
            'risk_level', 'risk_level_display', 'predicted_failure_probability',
            'predicted_duration_minutes', 'predicted_sla_miss_probability',
            'predicted_volume', 'contributing_factors', 'historical_patterns',
            'actual_outcome_known', 'prediction_accurate', 'actual_value',
            'days_until_prediction', 'created_at'
        ]
    
    def get_days_until_prediction(self, obj):
        delta = obj.predicted_date - timezone.now().date()
        return delta.days


class HistoricalPatternSerializer(serializers.ModelSerializer):
    """Serializer for HistoricalPattern"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    pattern_type_display = serializers.CharField(source='get_pattern_type_display', read_only=True)
    data_range_days = serializers.SerializerMethodField()
    
    class Meta:
        model = HistoricalPattern
        fields = [
            'id', 'customer', 'customer_name', 'pattern_type', 'pattern_type_display',
            'job_name', 'pattern_description', 'confidence_score', 'pattern_data',
            'occurrence_frequency', 'time_of_day', 'day_of_week', 'day_of_month',
            'month_of_year', 'discovered_at', 'data_range_start', 'data_range_end',
            'data_range_days', 'sample_size', 'is_active'
        ]
    
    def get_data_range_days(self, obj):
        delta = obj.data_range_end - obj.data_range_start
        return delta.days


class PredictionAlertSerializer(serializers.ModelSerializer):
    """Serializer for PredictionAlert"""
    prediction_type = serializers.CharField(source='prediction_result.prediction_model.prediction_type', read_only=True)
    customer_name = serializers.CharField(source='prediction_result.prediction_model.customer.name', read_only=True)
    job_name = serializers.CharField(source='prediction_result.job_name', read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    days_until_impact = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = PredictionAlert
        fields = [
            'id', 'prediction_result', 'prediction_type', 'customer_name', 'job_name',
            'alert_type', 'alert_type_display', 'severity', 'severity_display',
            'status', 'status_display', 'title', 'message', 'recommended_actions',
            'alert_date', 'predicted_impact_date', 'expiry_date', 'acknowledged_at',
            'acknowledged_by', 'resolved_at', 'resolution_notes', 'days_until_impact',
            'is_overdue'
        ]
    
    def get_days_until_impact(self, obj):
        delta = obj.predicted_impact_date - timezone.now().date()
        return delta.days
    
    def get_is_overdue(self, obj):
        return obj.predicted_impact_date < timezone.now().date()


class PredictionSummarySerializer(serializers.Serializer):
    """Serializer for prediction summary statistics"""
    total_predictions = serializers.IntegerField()
    high_risk_predictions = serializers.IntegerField()
    critical_risk_predictions = serializers.IntegerField()
    active_alerts = serializers.IntegerField()
    critical_alerts = serializers.IntegerField()
    failure_predictions = serializers.IntegerField()
    long_runner_predictions = serializers.IntegerField()
    sla_miss_predictions = serializers.IntegerField()
    volume_spike_predictions = serializers.IntegerField()
    prediction_accuracy = serializers.FloatField()
    patterns_discovered = serializers.IntegerField()


class PredictionDashboardSerializer(serializers.Serializer):
    """Serializer for prediction dashboard data"""
    summary = PredictionSummarySerializer()
    recent_predictions = PredictionResultSerializer(many=True)
    active_alerts = PredictionAlertSerializer(many=True)
    top_patterns = HistoricalPatternSerializer(many=True)
    risk_timeline = serializers.ListField(
        child=serializers.DictField()
    )
    job_risk_scores = serializers.ListField(
        child=serializers.DictField()
    )


class PredictionAnalyticsSerializer(serializers.Serializer):
    """Serializer for detailed prediction analytics"""
    prediction_accuracy_trends = serializers.ListField(
        child=serializers.DictField()
    )
    pattern_effectiveness = serializers.ListField(
        child=serializers.DictField()
    )
    job_failure_trends = serializers.ListField(
        child=serializers.DictField()
    )
    volume_trend_analysis = serializers.ListField(
        child=serializers.DictField()
    )
    sla_risk_analysis = serializers.ListField(
        child=serializers.DictField()
    )
    recommendations = serializers.ListField(
        child=serializers.DictField()
    )

 