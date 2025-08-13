#!/bin/bash
set -euo pipefail

APP_ROOT="/home/site/wwwroot"
cd "$APP_ROOT"

# If Oryx produced a compressed build output, extract it so the app files are present
if [ -f "$APP_ROOT/output.tar.gz" ]; then
	echo "Extracting Oryx output.tar.gz..."
	tar -xzf "$APP_ROOT/output.tar.gz" -C "$APP_ROOT"
fi

# Run database migrations
python backend/manage.py migrate --noinput || true

# Start Gunicorn serving Django from the backend module
exec gunicorn --chdir backend --bind=0.0.0.0 --workers=4 dashboard_project.wsgi 