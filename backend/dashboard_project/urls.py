"""
URL configuration for dashboard_project project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.contrib.staticfiles.storage import staticfiles_storage
from django.views.generic.base import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('dashboard_app.urls')),
    # Root serves React index
    path('', TemplateView.as_view(template_name='index.html'), name='frontend'),
    # Root-level assets CRA expects
    path('favicon.ico', RedirectView.as_view(url=staticfiles_storage.url('favicon.ico'), permanent=False)),
    path('manifest.json', RedirectView.as_view(url=staticfiles_storage.url('manifest.json'), permanent=False)),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Catch-all to serve React for client-side routes (non-API)
urlpatterns += [
    re_path(r'^(?!api/).*$', TemplateView.as_view(template_name='index.html')),
] 