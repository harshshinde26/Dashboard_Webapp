@echo off
echo ================================
echo Dashboard Backend Setup (Windows)
echo ================================

echo.
echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and add it to your PATH
    pause
    exit /b 1
)

echo.
echo Creating virtual environment...
cd backend
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Upgrading pip...
python -m pip install --upgrade pip

echo.
echo Installing dependencies...
pip install -r ..\requirements.txt
if errorlevel 1 (
    echo.
    echo WARNING: Standard installation failed. Trying Python 3.13 compatible version...
    pip install -r ..\requirements-py313.txt
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        echo Please check your internet connection and try manual installation
        pause
        exit /b 1
    )
)

echo.
echo Creating database migrations...
python manage.py makemigrations
if errorlevel 1 (
    echo ERROR: Failed to create migrations
    pause
    exit /b 1
)

echo.
echo Applying database migrations...
python manage.py migrate
if errorlevel 1 (
    echo ERROR: Failed to apply migrations
    pause
    exit /b 1
)

echo.
echo ================================
echo Setup completed successfully!
echo ================================
echo.
echo To start the development server:
echo   cd backend
echo   venv\Scripts\activate
echo   python manage.py runserver
echo.
echo The server will be available at: http://localhost:8000
echo Admin interface: http://localhost:8000/admin
echo API endpoints: http://localhost:8000/api
echo.
pause 