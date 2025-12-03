"""
Pytest Configuration and Fixtures

This module provides shared fixtures and configuration for all test modules.
"""

import pytest
import requests
from config import API_BASE_URL


def check_server_running():
    """Check if the backend server is running."""
    try:
        response = requests.get(
            f"{API_BASE_URL}/products", 
            timeout=5
        )
        return True
    except requests.exceptions.ConnectionError:
        return False
    except Exception:
        return False


@pytest.fixture
def skip_if_no_server():
    """
    Fixture to skip individual tests if server is not running.
    Use this for tests that might be run in isolation.
    """
    if not check_server_running():
        pytest.skip(f"Server not running at {API_BASE_URL}")
