#!/bin/bash

# Dashboard WebApp Deployment Script
# This script removes existing deployment and redeploys both Django and React applications

set -e  # Exit immediately if a command exits with a non-zero status

echo "🚀 Starting Dashboard WebApp Deployment..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to stop and remove existing containers
cleanup_existing_deployment() {
    echo "🧹 Cleaning up existing deployment..."
    
    # Stop and remove containers if they exist
    docker-compose down --volumes --remove-orphans 2>/dev/null || true
    
    # Remove dangling images
    docker image prune -f
    
    echo "✅ Cleanup completed"
}

# Function to build and deploy applications
deploy_applications() {
    echo "🔨 Building and deploying applications..."
    
    # Check if .env file exists, if not create from example
    if [ ! -f .env ]; then
        echo "📝 Creating .env file from .env.example..."
        cp .env.example .env
        echo "⚠️  Please update the .env file with your production values before running again."
        exit 1
    fi
    
    # Build and start services
    echo "🏗️  Building Docker images..."
    docker-compose build --no-cache
    
    echo "🚀 Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    # Run database migrations
    echo "🗄️  Running database migrations..."
    docker-compose exec -T backend python manage.py migrate
    
    # Collect static files
    echo "📦 Collecting static files..."
    docker-compose exec -T backend python manage.py collectstatic --noinput
    
    # Create superuser if it doesn't exist
    echo "👤 Creating admin user (if needed)..."
    docker-compose exec -T backend python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Admin user created: username=admin, password=admin123')
else:
    print('Admin user already exists')
"
    
    echo "✅ Deployment completed successfully!"
}

# Function to show service status
show_status() {
    echo "📊 Service Status:"
    docker-compose ps
    
    echo ""
    echo "🌐 Access your applications:"
    echo "   Frontend (React): http://localhost:3000"
    echo "   Backend API (Django): http://localhost:8000"
    echo "   Django Admin: http://localhost:8000/admin"
    echo "   Database: localhost:5432"
    echo ""
    echo "🔑 Default admin credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "📝 To view logs: docker-compose logs -f [service_name]"
    echo "📝 To stop services: docker-compose down"
}

# Main deployment flow
main() {
    case "${1:-deploy}" in
        "cleanup")
            cleanup_existing_deployment
            ;;
        "deploy")
            cleanup_existing_deployment
            deploy_applications
            show_status
            ;;
        "status")
            show_status
            ;;
        "stop")
            echo "🛑 Stopping all services..."
            docker-compose down
            echo "✅ All services stopped"
            ;;
        "logs")
            docker-compose logs -f
            ;;
        *)
            echo "Usage: $0 {deploy|cleanup|status|stop|logs}"
            echo "  deploy   - Remove existing deployment and deploy fresh (default)"
            echo "  cleanup  - Only cleanup existing deployment"
            echo "  status   - Show current deployment status"
            echo "  stop     - Stop all services"
            echo "  logs     - Show and follow logs"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 