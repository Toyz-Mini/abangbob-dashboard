"""
TestSprite Test Configuration
Configure base URL and common settings for all tests
"""

import os

# Environment-based URL selection
# Set TEST_ENV=local to test against localhost, otherwise use production
TEST_ENV = os.environ.get('TEST_ENV', 'production')

# Base URLs
URLS = {
    'local': 'http://localhost:3000',
    'production': 'https://abangbob-dashboard.vercel.app'
}

# Current base URL
BASE_URL = URLS.get(TEST_ENV, URLS['production'])

# Test credentials
ADMIN_EMAIL = 'admin@abangbob.com'
ADMIN_PASSWORD = 'Admin123!'
MANAGER_EMAIL = 'manager@abangbob.com'
MANAGER_PASSWORD = 'Manager123!'
STAFF_PIN = '3456'

# Supabase API configuration
SUPABASE_URL = 'https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdta2VpcWZpY3BzZml3aHFjaHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mjc1MDgsImV4cCI6MjA4MTIwMzUwOH0.yUsDxYw3c8vtSWew_ACiLYAYJHRwDz0X9EgQAPuwTts'

# Common headers for Supabase API calls
SUPABASE_HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# Timeout settings (in milliseconds)
DEFAULT_TIMEOUT = 10000
NAVIGATION_TIMEOUT = 30000
ACTION_TIMEOUT = 5000

# Debug mode
DEBUG = os.environ.get('DEBUG', 'false').lower() == 'true'

def get_url(path: str = '') -> str:
    """Get full URL with optional path"""
    return f"{BASE_URL}{path}"

# Print configuration on import if debug mode
if DEBUG:
    print(f"🧪 TestSprite Config:")
    print(f"   Environment: {TEST_ENV}")
    print(f"   Base URL: {BASE_URL}")
