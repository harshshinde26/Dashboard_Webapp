"""
URL configuration for dashboard_project project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('dashboard_app.urls')),
    # Serve React index for the app root
    path('', TemplateView.as_view(template_name='index.html'), name='frontend'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Catch-all to serve React for client-side routes (non-API)
urlpatterns += [
    re_path(r'^(?!api/).*$', TemplateView.as_view(template_name='index.html')),
] 