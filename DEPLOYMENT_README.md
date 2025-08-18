# Dashboard WebApp Deployment Guide

This guide explains how to deploy the Dashboard WebApp with separate Django backend and React frontend applications.

## 🏗️ Architecture Overview

The application now consists of:
- **Django Backend**: REST API server (Port 8000)
- **React Frontend**: Single Page Application (Port 3000) 
- **PostgreSQL Database**: Data storage (Port 5432)
- **Nginx**: Reverse proxy and static file serving (Port 80/443)

## 🚀 Quick Start Deployment

### Prerequisites
- Docker and Docker Compose installed
- Git (for cloning/pulling updates)

### 1. Clone and Setup
```bash
git clone <your-repository-url>
cd Dashboard_WebApp
```

### 2. Configure Environment Variables
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your production values
nano .env  # or use your preferred editor
```

### 3. Deploy with One Command
```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy everything
./deploy.sh deploy
```

## 📋 Deployment Commands

```bash
# Deploy (remove existing and deploy fresh)
./deploy.sh deploy

# Check status
./deploy.sh status

# View logs
./deploy.sh logs

# Stop all services
./deploy.sh stop

# Cleanup only
./deploy.sh cleanup
```

## 🔧 Manual Deployment Steps

If you prefer manual deployment:

### 1. Environment Setup
```bash
# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env

# Edit configurations as needed
```

### 2. Build and Start Services
```bash
# Build all images
docker-compose build --no-cache

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Create admin user
docker-compose exec backend python manage.py createsuperuser
```

## 🌐 Service URLs

After deployment, access your applications at:

- **Frontend (React)**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/
- **Database**: localhost:5432

## 🔐 Security Configuration

### Environment Variables

Key environment variables to configure:

#### Django Backend
```env
DJANGO_SECRET_KEY=your-super-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,localhost
DJANGO_CSRF_TRUSTED_ORIGINS=https://yourdomain.com
DATABASE_URL=postgresql://user:password@db:5432/dashboard_db
```

#### React Frontend
```env
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_ENVIRONMENT=production
```

### Production Security
- Change default admin credentials immediately
- Use strong, unique secret keys
- Configure proper CORS origins
- Enable HTTPS in production
- Set up proper firewall rules

## 📊 Monitoring and Logs

### View Service Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
docker-compose logs -f nginx
```

### Health Checks
```bash
# Backend health
curl http://localhost:8000/api/health/

# Frontend health  
curl http://localhost:3000/

# Nginx health
curl http://localhost/health
```

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest code
git pull origin main

# Redeploy
./deploy.sh deploy
```

### Database Backups
```bash
# Create backup
docker-compose exec db pg_dump -U dashboard_user dashboard_db > backup.sql

# Restore backup
docker-compose exec -T db psql -U dashboard_user dashboard_db < backup.sql
```

### Scaling
```bash
# Scale backend workers
docker-compose up -d --scale backend=3

# Scale with load balancer
# (Modify docker-compose.yml nginx upstream configuration)
```

## 🐛 Troubleshooting

### Common Issues

#### Services not starting
```bash
# Check service status
docker-compose ps

# Check logs for errors
docker-compose logs backend
docker-compose logs frontend
```

#### Database connection issues
```bash
# Check database logs
docker-compose logs db

# Test database connection
docker-compose exec backend python manage.py dbshell
```

#### Frontend not loading
```bash
# Check if React build was successful
docker-compose logs frontend

# Verify environment variables
docker-compose exec frontend env | grep REACT_APP
```

#### CORS errors
- Verify `DJANGO_CORS_ALLOWED_ORIGINS` in `.env`
- Check `REACT_APP_API_URL` matches your backend URL
- Ensure Django settings include frontend URL in CORS_ALLOWED_ORIGINS

### Reset Everything
```bash
# Complete reset (DESTROYS ALL DATA)
docker-compose down --volumes
docker system prune -a --volumes
./deploy.sh deploy
```

## 🏭 Production Deployment

### Azure App Service
1. Use the provided `azure-pipelines.yml`
2. Configure environment variables in Azure portal
3. Set up Application Insights for monitoring

### AWS ECS/EKS
1. Build and push images to ECR
2. Create ECS task definitions
3. Set up Application Load Balancer

### DigitalOcean/VPS
1. Use Docker Compose on your VPS
2. Set up SSL with Let's Encrypt
3. Configure domain and DNS

### Example Production docker-compose.override.yml
```yaml
version: '3.8'

services:
  nginx:
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./nginx/production.conf:/etc/nginx/nginx.conf

  backend:
    environment:
      - DJANGO_DEBUG=False
      - DJANGO_SETTINGS_MODULE=dashboard_project.settings_production

  db:
    volumes:
      - /var/lib/postgresql/data:/var/lib/postgresql/data
```

## 📱 Development vs Production

### Development
- SQLite database
- Debug mode enabled
- Hot reloading
- Detailed error pages

### Production  
- PostgreSQL database
- Debug mode disabled
- Optimized builds
- Error logging to files
- Security headers
- SSL/HTTPS

## 🆘 Support

For deployment issues:
1. Check this README
2. Review logs with `./deploy.sh logs`
3. Check environment variables
4. Verify Docker and Docker Compose versions
5. Create an issue in the repository with error details

---

**⚠️ Important**: Always change default passwords and secrets before production deployment! 