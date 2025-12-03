"""
API Test Configuration

This module provides configuration for the test framework.
Update these values based on your environment.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# API Base URL - Update this to match your server
API_BASE_URL = os.getenv("TEST_API_URL", "http://localhost:5000/api")

# MongoDB connection string for direct DB access in tests
MONGODB_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/ecommerce")

# Test user credentials
TEST_ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "admin@test.com")
TEST_ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "admin123")

TEST_USER_EMAIL = os.getenv("TEST_USER_EMAIL", "user@test.com")
TEST_USER_PASSWORD = os.getenv("TEST_USER_PASSWORD", "user123")

# Razorpay test keys (for payment testing)
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

# Test timeouts
REQUEST_TIMEOUT = 30  # seconds
HOLD_DURATION_SECONDS = 15 * 60  # 15 minutes (matches backend)

# Concurrent test settings
MAX_CONCURRENT_USERS = 10
CONCURRENT_TEST_ITERATIONS = 5

# Test data settings
TEST_PRODUCT_STOCK = 10
TEST_PRODUCT_PRICE = 100.00
