#!/usr/bin/env python3
"""
API Test Runner

Main script to run the API test suite.
Usage:
    python run_tests.py                    # Run all tests
    python run_tests.py test_auth          # Run auth tests only
    python run_tests.py test_stock_hold    # Run stock hold tests only
    python run_tests.py -v                 # Verbose output
    python run_tests.py -k "concurrent"    # Run tests matching pattern
    python run_tests.py --parallel         # Run tests in parallel
"""

import sys
import os
import argparse
import subprocess
from datetime import datetime

# Add tests directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def print_header():
    """Print test suite header."""
    print("=" * 70)
    print("E-Commerce API Test Suite")
    print("=" * 70)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()


def print_footer(return_code):
    """Print test suite footer."""
    print()
    print("=" * 70)
    status = "PASSED" if return_code == 0 else "FAILED"
    print(f"Test Suite {status}")
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)


def check_dependencies():
    """Check if required dependencies are installed."""
    required = ['pytest', 'requests', 'faker']
    missing = []
    
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
            
    if missing:
        print("Missing required packages:")
        for pkg in missing:
            print(f"  - {pkg}")
        print("\nInstall with: pip install -r requirements.txt")
        return False
        
    return True


def check_server_running():
    """Check if the backend server is running."""
    import requests
    from config import API_BASE_URL
    
    try:
        response = requests.get(f"{API_BASE_URL}/products", timeout=5)
        return True, API_BASE_URL
    except requests.exceptions.ConnectionError:
        return False, API_BASE_URL
    except Exception as e:
        return False, API_BASE_URL


def print_server_not_running_error(api_url):
    """Print helpful error message when server is not running."""
    print("=" * 70)
    print("ERROR: Backend server is not running!")
    print("=" * 70)
    print()
    print("The tests require the backend server to be running.")
    print()
    print("Please start the server first:")
    print("  1. Open a new terminal")
    print("  2. Navigate to the project root directory")
    print("  3. Run: npm run dev")
    print("  4. Wait for: 'Server is running on http://localhost:5000'")
    print("  5. Then run the tests again in this terminal")
    print()
    print(f"Current API URL: {api_url}")
    print("(Change via TEST_API_URL environment variable if needed)")
    print("=" * 70)


def run_tests(args):
    """Run pytest with given arguments."""
    print_header()
    
    if not check_dependencies():
        return 1
    
    # Check if server is running
    server_running, api_url = check_server_running()
    if not server_running:
        print_server_not_running_error(api_url)
        return 1
    
    print(f"Server check: OK ({api_url})")
    print()
        
    # Build pytest command
    cmd = ['python', '-m', 'pytest']
    
    # Add verbosity
    if args.verbose:
        cmd.append('-v')
    else:
        cmd.append('-q')
        
    # Add output options
    cmd.extend(['--tb=short', '--color=yes'])
    
    # Add parallel execution
    if args.parallel:
        cmd.extend(['-n', 'auto'])
        
    # Add pattern filter
    if args.pattern:
        cmd.extend(['-k', args.pattern])
        
    # Add specific test files
    if args.test_files:
        for test_file in args.test_files:
            if not test_file.endswith('.py'):
                test_file = f"{test_file}.py"
            cmd.append(test_file)
    else:
        # Run all tests in current directory
        cmd.append('.')
        
    # Add extra pytest args
    if args.pytest_args:
        cmd.extend(args.pytest_args)
        
    print(f"Running: {' '.join(cmd)}")
    print()
    
    # Run pytest
    return_code = subprocess.call(cmd)
    
    print_footer(return_code)
    return return_code


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Run API test suite',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                          Run all tests
  %(prog)s test_auth                Run authentication tests
  %(prog)s test_stock_hold          Run stock hold tests
  %(prog)s test_cart test_orders    Run cart and order tests
  %(prog)s -v                       Verbose output
  %(prog)s -k "concurrent"          Run tests matching pattern
  %(prog)s --parallel               Run tests in parallel
        """
    )
    
    parser.add_argument(
        'test_files',
        nargs='*',
        help='Specific test files to run (without .py extension)'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Verbose test output'
    )
    
    parser.add_argument(
        '-k', '--pattern',
        help='Only run tests matching pattern'
    )
    
    parser.add_argument(
        '--parallel',
        action='store_true',
        help='Run tests in parallel (requires pytest-xdist)'
    )
    
    parser.add_argument(
        'pytest_args',
        nargs='*',
        help='Additional arguments to pass to pytest'
    )
    
    args = parser.parse_args()
    
    # Change to tests directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    return run_tests(args)


if __name__ == '__main__':
    sys.exit(main())
