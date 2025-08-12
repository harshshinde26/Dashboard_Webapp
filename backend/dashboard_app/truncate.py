#!/usr/bin/env python
"""
Script to truncate (clear) batch jobs table
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dashboard_project.settings')
django.setup()

from django.db import connection
from dashboard_app.models import BatchJob

def truncate_batch_jobs():
    """Clear all batch jobs from the database"""
    
    try:
        # Get count before deletion
        initial_count = BatchJob.objects.count()
        print(f"📊 Current batch jobs count: {initial_count}")
        
        if initial_count == 0:
            print("✅ No batch jobs to delete")
            return
        
        # Delete all batch jobs using Django ORM (safer than raw SQL)
        deleted_count, details = BatchJob.objects.all().delete()
        
        print(f"✅ Successfully deleted {deleted_count} batch jobs")
        print(f"📋 Details: {details}")
        
        # Verify deletion
        final_count = BatchJob.objects.count()
        print(f"📊 Final batch jobs count: {final_count}")
        
    except Exception as e:
        print(f"❌ Error truncating batch jobs: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    truncate_batch_jobs()