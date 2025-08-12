from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from dashboard_app.models import Customer, BatchJob
from dashboard_app.utils import ExcelProcessor
import os
import pandas as pd


class Command(BaseCommand):
    help = 'Test Excel file processing and status mapping for batch performance data'

    def add_arguments(self, parser):
        parser.add_argument(
            'excel_file',
            type=str,
            help='Path to the Excel file to process'
        )
        parser.add_argument(
            '--customer',
            type=str,
            help='Customer name (will create if not exists)',
            default='Test Customer'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be processed without actually creating records'
        )
        parser.add_argument(
            '--show-mappings',
            action='store_true',
            help='Show detailed status mapping analysis'
        )

    def handle(self, *args, **options):
        excel_file = options['excel_file']
        customer_name = options['customer']
        dry_run = options['dry_run']
        show_mappings = options['show_mappings']

        # Check if file exists
        if not os.path.exists(excel_file):
            raise CommandError(f'Excel file "{excel_file}" does not exist.')

        self.stdout.write(f'Processing Excel file: {excel_file}')
        self.stdout.write(f'Customer: {customer_name}')
        self.stdout.write(f'Dry run: {dry_run}')
        self.stdout.write('=' * 60)

        # Get or create customer
        customer, created = Customer.objects.get_or_create(
            name=customer_name,
            defaults={
                'code': customer_name.upper().replace(' ', '_'),
                'description': f'Test customer created for Excel processing test'
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created new customer: {customer.name} ({customer.code})')
            )
        else:
            self.stdout.write(f'Using existing customer: {customer.name} ({customer.code})')

        # Show file analysis
        try:
            df = pd.read_excel(excel_file)
            self.stdout.write(f'\nFile Analysis:')
            self.stdout.write(f'- Total rows: {len(df)}')
            self.stdout.write(f'- Columns: {list(df.columns)}')
            
            # Check for status column
            status_col = None
            for col in df.columns:
                if 'status' in col.lower():
                    status_col = col
                    break
            
            if status_col:
                unique_statuses = df[status_col].unique()
                self.stdout.write(f'- Status column: {status_col}')
                self.stdout.write(f'- Unique statuses: {list(unique_statuses)}')
                
                # Show status mapping if requested
                if show_mappings:
                    self.stdout.write('\nStatus Mapping Analysis:')
                    self.stdout.write('-' * 40)
                    
                    # Import the status mapping logic
                    status_mapping = {
                        'completed normally': 'COMPLETED_NORMAL',
                        'completed normal': 'COMPLETED_NORMAL',
                        'complete normally': 'COMPLETED_NORMAL',
                        'complete normal': 'COMPLETED_NORMAL',
                        'completed_normal': 'COMPLETED_NORMAL',
                        'normal': 'COMPLETED_NORMAL',
                        'success': 'COMPLETED_NORMAL',
                        'successful': 'COMPLETED_NORMAL',
                        'completed normally*': 'COMPLETED_NORMAL_STAR',
                        'completed normal*': 'COMPLETED_NORMAL_STAR',
                        'complete normally*': 'COMPLETED_NORMAL_STAR',
                        'complete normal*': 'COMPLETED_NORMAL_STAR',
                        'completed_normal_star': 'COMPLETED_NORMAL_STAR',
                        'completed_normal*': 'COMPLETED_NORMAL_STAR',
                        'normal*': 'COMPLETED_NORMAL_STAR',
                        'completed abnormally': 'COMPLETED_ABNORMAL',
                        'completed abnormal': 'COMPLETED_ABNORMAL',
                        'complete abnormally': 'COMPLETED_ABNORMAL',
                        'complete abnormal': 'COMPLETED_ABNORMAL',
                        'completed_abnormal': 'COMPLETED_ABNORMAL',
                        'abnormal': 'COMPLETED_ABNORMAL',
                        'warning': 'COMPLETED_ABNORMAL',
                        'completed with warnings': 'COMPLETED_ABNORMAL',
                        'completed with issues': 'COMPLETED_ABNORMAL',
                        'failed': 'FAILED',
                        'failure': 'FAILED',
                        'error': 'FAILED',
                        'aborted': 'FAILED',
                        'terminated': 'FAILED',
                        'long running': 'LONG_RUNNING',
                        'long-running': 'LONG_RUNNING',
                        'long_running': 'LONG_RUNNING',
                        'running': 'LONG_RUNNING',
                        'in progress': 'LONG_RUNNING',
                        'timeout': 'LONG_RUNNING',
                        'pending': 'PENDING',
                        'waiting': 'PENDING',
                        'queued': 'PENDING',
                        'scheduled': 'PENDING'
                    }
                    
                    for status in unique_statuses:
                        if pd.notna(status):
                            normalized = str(status).lower().strip()
                            mapped = status_mapping.get(normalized, 'UNKNOWN')
                            self.stdout.write(f"'{status}' -> {mapped}")
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error analyzing file: {str(e)}')
            )
            return

        if dry_run:
            self.stdout.write('\nDRY RUN - No records will be created')
            return

        # Count existing jobs for this customer before processing
        existing_jobs = BatchJob.objects.filter(customer=customer).count()
        self.stdout.write(f'\nExisting jobs for customer: {existing_jobs}')

        # Process the file
        try:
            success, message = ExcelProcessor.process_batch_performance_file(
                excel_file, 
                customer.id
            )
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Processing successful: {message}')
                )
                
                # Show what was created
                new_jobs = BatchJob.objects.filter(customer=customer).count()
                created_jobs = new_jobs - existing_jobs
                
                self.stdout.write(f'Jobs created: {created_jobs}')
                
                # Show status breakdown
                if created_jobs > 0:
                    recent_jobs = BatchJob.objects.filter(customer=customer).order_by('-created_at')[:created_jobs]
                    status_counts = {}
                    for job in recent_jobs:
                        if job.status not in status_counts:
                            status_counts[job.status] = 0
                        status_counts[job.status] += 1
                    
                    self.stdout.write('\nStatus Breakdown of Created Jobs:')
                    for status, count in status_counts.items():
                        self.stdout.write(f'- {status}: {count}')
                
            else:
                self.stdout.write(
                    self.style.ERROR(f'✗ Processing failed: {message}')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Processing error: {str(e)}')
            )

        self.stdout.write('\nProcessing completed!') 