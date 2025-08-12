from django.core.management.base import BaseCommand
from django.utils import timezone
from dashboard_app.models import Customer
from datetime import datetime, timedelta
import random


class Command(BaseCommand):
    help = 'Create demo customers for the Client Inventory module'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=15,
            help='Number of demo customers to create (default: 15)',
        )
        parser.add_argument(
            '--recreate',
            action='store_true',
            help='Delete existing demo customers and recreate them',
        )

    def handle(self, *args, **options):
        count = options['count']
        recreate = options['recreate']

        # Demo customer data with realistic business profiles
        demo_customers_base = [
            {
                'name': 'TechCorp Solutions',
                'code': 'TECH001',
                'description': 'Leading technology solutions provider with complex enterprise systems',
                'products': ['FACETS', 'QNXT']
            },
            {
                'name': 'Global Manufacturing Inc',
                'code': 'GMFG002', 
                'description': 'Large-scale manufacturing operations with supply chain management',
                'products': ['TMS', 'EDM']
            },
            {
                'name': 'FinanceFirst Bank',
                'code': 'FFB003',
                'description': 'Premier financial institution with regulatory compliance requirements',
                'products': ['FACETS', 'CAE']
            },
            {
                'name': 'HealthCare Plus',
                'code': 'HCP004',
                'description': 'Healthcare provider with patient data processing requirements',
                'products': ['FACETS', 'EDM']
            },
            {
                'name': 'RetailMax Chain',
                'code': 'RMX005',
                'description': 'Multi-location retail chain with inventory and sales analytics',
                'products': ['TMS', 'CLSP']
            },
            {
                'name': 'LogiFlow Transport',
                'code': 'LFT006',
                'description': 'Transportation and logistics company with route optimization',
                'products': ['TMS']
            },
            {
                'name': 'PowerGrid Utilities',
                'code': 'PGU007',
                'description': 'Utility company managing smart grid data and energy analytics',
                'products': ['QNXT', 'EDM']
            },
            {
                'name': 'MediaStream Digital',
                'code': 'MSD008',
                'description': 'Digital media company with content processing and distribution',
                'products': ['CAE', 'CLSP']
            },
            {
                'name': 'BioPharma Research',
                'code': 'BPR009',
                'description': 'Pharmaceutical research with clinical trial data processing',
                'products': ['FACETS', 'EDM', 'CAE']
            },
            {
                'name': 'InsureTech Corp',
                'code': 'ITC010',
                'description': 'Insurance technology with automated claims processing',
                'products': ['QNXT', 'TMS']
            },
            {
                'name': 'EduTech Institute',
                'code': 'EDU011',
                'description': 'Educational institution with student information systems',
                'products': ['CAE']
            },
            {
                'name': 'StartupTech Labs',
                'code': 'STL012',
                'description': 'Growing technology startup with emerging data needs',
                'products': ['CLSP']
            },
            {
                'name': 'AutoMotive Dynamics',
                'code': 'AMD013',
                'description': 'Automotive manufacturer with supply chain optimization',
                'products': ['TMS', 'EDM']
            },
            {
                'name': 'CloudNet Services',
                'code': 'CNS014',
                'description': 'Cloud service provider with automated deployment workflows',
                'products': ['CAE', 'CLSP']
            },
            {
                'name': 'TravelHub Network',
                'code': 'THN015',
                'description': 'Travel and hospitality platform with booking systems',
                'products': ['QNXT']
            }
        ]

        # Select customers based on count
        demo_customers = demo_customers_base[:count]

        if recreate:
            self.stdout.write('Deleting existing demo customers...')
            # Delete customers with demo codes
            demo_codes = [customer['code'] for customer in demo_customers_base]
            deleted_count = Customer.objects.filter(code__in=demo_codes).delete()[0]
            self.stdout.write(f'Deleted {deleted_count} existing demo customers')

        created_count = 0
        updated_count = 0
        skipped_count = 0

        for customer_data in demo_customers:
            name = customer_data['name']
            code = customer_data['code']
            description = customer_data['description']
            products = customer_data['products']

            # Create a customer record for each product
            for product in products:
                customer_key = f"{name}-{product}"
                
                try:
                    # Check if this exact customer-product combination exists
                    existing_customer = Customer.objects.get(
                        name=name,
                        code=code,
                        product=product
                    )
                    
                    if recreate:
                        # Update existing customer
                        existing_customer.description = description
                        existing_customer.is_active = True
                        existing_customer.save()
                        updated_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f'Updated: {name} - {product}')
                        )
                    else:
                        skipped_count += 1
                        self.stdout.write(
                            self.style.WARNING(f'Already exists: {name} - {product}')
                        )
                        
                except Customer.DoesNotExist:
                    # Create new customer
                    customer = Customer.objects.create(
                        name=name,
                        code=code,
                        product=product,
                        description=description,
                        is_active=True,
                        created_at=timezone.now(),
                        updated_at=timezone.now()
                    )
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Created: {name} - {product}')
                    )

        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(f'Demo customers setup complete!')
        self.stdout.write(f'Created: {created_count} customer records')
        self.stdout.write(f'Updated: {updated_count} customer records')
        self.stdout.write(f'Skipped: {skipped_count} customer records (already exist)')
        self.stdout.write('='*60)
        
        # Show summary by product
        self.stdout.write('\nCustomers by Product:')
        products = ['FACETS', 'QNXT', 'TMS', 'EDM', 'CAE', 'CLSP']
        for product in products:
            count = Customer.objects.filter(product=product).count()
            self.stdout.write(f'  - {product}: {count} customers')
        
        total_customers = Customer.objects.count()
        self.stdout.write(f'\nTotal customers in database: {total_customers}')
        
        # Show grouped customers (as they appear in Customer Management)
        self.stdout.write('\nGrouped customers (as seen in Customer Management):')
        grouped_customers = {}
        for customer in Customer.objects.all().order_by('name', 'product'):
            key = f"{customer.name} ({customer.code})"
            if key not in grouped_customers:
                grouped_customers[key] = []
            grouped_customers[key].append(customer.product)
        
        for customer_name, products in grouped_customers.items():
            self.stdout.write(f'  - {customer_name}: {", ".join(products)}') 