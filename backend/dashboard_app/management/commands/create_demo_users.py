from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Create demo users for the dashboard'

    def add_arguments(self, parser):
        parser.add_argument(
            '--recreate',
            action='store_true',
            help='Delete existing demo users and recreate them',
        )

    def handle(self, *args, **options):
        demo_users = [
            {
                'username': 'admin',
                'email': 'admin@dashboard.com',
                'password': 'admin123',
                'is_staff': True,
                'is_superuser': True,
                'first_name': 'Admin',
                'last_name': 'User'
            },
            {
                'username': 'manager',
                'email': 'manager@dashboard.com',
                'password': 'manager123',
                'is_staff': False,
                'is_superuser': False,
                'first_name': 'Manager',
                'last_name': 'User'
            },
            {
                'username': 'viewer',
                'email': 'viewer@dashboard.com',
                'password': 'viewer123',
                'is_staff': False,
                'is_superuser': False,
                'first_name': 'Viewer',
                'last_name': 'User'
            },
            {
                'username': 'demo',
                'email': 'demo@dashboard.com',
                'password': 'demo',
                'is_staff': False,
                'is_superuser': False,
                'first_name': 'Demo',
                'last_name': 'User'
            },
        ]

        if options['recreate']:
            self.stdout.write('Deleting existing demo users...')
            User.objects.filter(username__in=[u['username'] for u in demo_users]).delete()

        created_count = 0
        updated_count = 0

        for user_data in demo_users:
            username = user_data['username']
            
            try:
                user = User.objects.get(username=username)
                if options['recreate']:
                    # Update existing user
                    for field, value in user_data.items():
                        if field == 'password':
                            user.set_password(value)
                        elif field != 'username':
                            setattr(user, field, value)
                    user.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Updated user: {username}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'User already exists: {username}')
                    )
            except User.DoesNotExist:
                # Create new user
                password = user_data.pop('password')
                user = User.objects.create(**user_data)
                user.set_password(password)
                user.save()
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created user: {username}')
                )

        self.stdout.write('\n' + '='*50)
        self.stdout.write(f'Demo users setup complete!')
        self.stdout.write(f'Created: {created_count} users')
        self.stdout.write(f'Updated: {updated_count} users')
        self.stdout.write('='*50)
        
        self.stdout.write('\nAll available users:')
        for user in User.objects.all().order_by('username'):
            role = 'Admin' if user.is_superuser else ('Staff' if user.is_staff else 'Regular')
            self.stdout.write(f'  - {user.username} ({user.email}) - {role}') 