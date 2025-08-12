from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'customers', views.CustomerViewSet)
router.register(r'batch-jobs', views.BatchJobViewSet)
router.register(r'volumetrics', views.VolumetricDataViewSet)
router.register(r'sla-definitions', views.SLADefinitionViewSet)
router.register(r'sla-data', views.SLADataViewSet)
router.register(r'batch-schedules', views.BatchScheduleViewSet)
router.register(r'file-uploads', views.FileUploadViewSet)

# Smart Predictor routes
router.register(r'prediction-models', views.PredictionModelViewSet)
router.register(r'prediction-results', views.PredictionResultViewSet)
router.register(r'historical-patterns', views.HistoricalPatternViewSet)
router.register(r'prediction-alerts', views.PredictionAlertViewSet)

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Authentication APIs
    path('register/', views.register_user, name='register-user'),
    path('login/', views.login_user, name='login-user'),
    
    # File upload and processing APIs
    path('upload-file/', views.FileUploadAPIView.as_view(), name='upload-file'),
    path('process-file/', views.FileProcessingAPIView.as_view(), name='process-file'),
    
    # Smart Predictor APIs
    path('smart-predictor/', views.SmartPredictorAPIView.as_view(), name='smart-predictor'),
    path('prediction-dashboard/', views.PredictionDashboardAPIView.as_view(), name='prediction-dashboard'),
    path('prediction-analytics/', views.PredictionAnalyticsAPIView.as_view(), name='prediction-analytics'),
    
    # Other custom API views
    path('dashboard-overview/', views.DashboardOverviewAPIView.as_view(), name='dashboard-overview'),
    path('health/', views.health_check, name='health-check'),
    path('customers/<int:customer_id>/jobs-count/', views.customer_jobs_count, name='customer-jobs-count'),
] 