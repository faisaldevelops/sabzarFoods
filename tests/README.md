# E-Commerce API Test Framework

A comprehensive Python test framework for testing the e-commerce backend API, including stock hold system, concurrent checkouts, authentication, cart, products, and order management.

## Prerequisites

**⚠️ IMPORTANT: The backend server must be running before running tests!**

```bash
# Terminal 1: Start the backend server
cd /path/to/project
npm run dev
# Server should be running on http://localhost:5000
```

Then in a separate terminal, run the tests.

## Features

- **Authentication Tests**: User signup, login, logout, guest users
- **Product Tests**: Viewing products, stock validation, admin operations
- **Cart Tests**: Add/remove items, update quantities, cart sync
- **Stock Hold Tests**: 
  - Stock reservation on checkout
  - Hold expiration
  - Concurrent checkout scenarios
  - Edge cases
- **Order Tests**: Order viewing, tracking, history
- **Concurrent Testing**: Multi-threaded tests for race conditions

## Installation

1. **Install Python 3.8+** if not already installed

2. **Install dependencies**:
   ```bash
   cd tests
   pip install -r requirements.txt
   ```

3. **Configure environment** (optional):
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit with your settings
   TEST_API_URL=http://localhost:5000/api
   TEST_ADMIN_EMAIL=admin@test.com
   TEST_ADMIN_PASSWORD=admin123
   ```

## Usage

### Step 1: Start the Backend Server

```bash
# In the project root directory
npm run dev
```

Wait until you see: `Server is running on http://localhost:5000`

### Step 2: Run Tests (in a separate terminal)

```bash
cd tests
python run_tests.py
```

### Run Specific Test Suites
```bash
# Authentication tests
python run_tests.py test_auth

# Stock hold tests (most important for concurrent scenarios)
python run_tests.py test_stock_hold

# Product tests
python run_tests.py test_products

# Cart tests
python run_tests.py test_cart

# Order tests
python run_tests.py test_orders
```

### Run with Options
```bash
# Verbose output
python run_tests.py -v

# Run tests matching pattern
python run_tests.py -k "concurrent"
python run_tests.py -k "checkout"

# Run in parallel (faster)
python run_tests.py --parallel

# Combine options
python run_tests.py test_stock_hold -v -k "concurrent"
```

### Run with pytest directly
```bash
# All tests
pytest

# Specific file
pytest test_stock_hold.py -v

# Specific test class
pytest test_stock_hold.py::TestConcurrentCheckout -v

# Specific test
pytest test_stock_hold.py::TestConcurrentCheckout::test_concurrent_checkouts_limited_stock -v
```

## Test Coverage

### Stock Hold System Tests (`test_stock_hold.py`)

| Test | Description |
|------|-------------|
| `test_create_hold_order` | Verify hold order creation reserves stock |
| `test_hold_order_has_expiration` | Verify 15-minute expiration time |
| `test_get_hold_status` | Check hold status endpoint |
| `test_cancel_hold_order` | Verify cancellation releases stock |
| `test_insufficient_stock_returns_error` | Validate stock check on checkout |
| `test_zero_stock_returns_error` | Validate zero stock rejection |
| `test_concurrent_checkouts_limited_stock` | **Critical**: Multiple users checkout simultaneously |
| `test_sequential_holds_exhaust_stock` | Verify stock exhaustion |
| `test_empty_cart_checkout` | Edge case: empty cart |
| `test_missing_address_checkout` | Edge case: no address |
| `test_invalid_product_id_checkout` | Edge case: bad product ID |
| `test_negative_quantity_checkout` | Edge case: negative quantity |
| `test_double_cancel_hold` | Edge case: cancel twice |

### Authentication Tests (`test_auth.py`)

| Test | Description |
|------|-------------|
| `test_signup_success` | Successful registration |
| `test_signup_duplicate_email` | Duplicate email rejection |
| `test_signup_invalid_email` | Invalid email rejection |
| `test_login_success` | Successful login |
| `test_login_wrong_password` | Wrong password rejection |
| `test_logout` | Session clearing |
| `test_create_guest_user` | Guest user creation |
| `test_get_profile_authenticated` | Profile access |

### Product Tests (`test_products.py`)

| Test | Description |
|------|-------------|
| `test_get_all_products` | Fetch all products |
| `test_get_featured_products` | Fetch featured products |
| `test_get_products_by_category` | Category filtering |
| `test_products_have_required_fields` | Data validation |
| `test_create_product_unauthorized` | Admin-only check |
| `test_product_has_stock_quantity` | Stock field validation |

### Cart Tests (`test_cart.py`)

| Test | Description |
|------|-------------|
| `test_add_to_cart` | Add product |
| `test_update_cart_quantity` | Update quantity |
| `test_remove_from_cart` | Remove product |
| `test_clear_cart` | Clear all items |
| `test_sync_guest_cart` | Sync after login |

### Order Tests (`test_orders.py`)

| Test | Description |
|------|-------------|
| `test_get_my_orders_authenticated` | View user orders |
| `test_get_all_orders_admin` | Admin order view |
| `test_get_order_tracking` | Tracking info |
| `test_update_tracking_admin` | Admin tracking update |
| `test_order_has_tracking_history` | History validation |

## Concurrent Testing Details

The concurrent testing simulates real-world scenarios where multiple users attempt to checkout simultaneously:

```
Scenario: Limited Stock Checkout
================================
Product Stock: 5 units
User A: Tries to checkout 3 units
User B: Tries to checkout 3 units
User C: Tries to checkout 3 units

Expected: Only 1 user succeeds (3 units)
         Or 1 user gets 3, 1 user gets 2 if partial fills allowed
         Remaining users get "Insufficient Stock" error
```

### Running Concurrent Tests

```bash
# Run all concurrent tests
python run_tests.py test_stock_hold -k "concurrent" -v

# Run with detailed output
pytest test_stock_hold.py::TestConcurrentCheckout -v --tb=long
```

## Configuration

Edit `config.py` to customize:

```python
# API endpoint
API_BASE_URL = "http://localhost:5000/api"

# Test credentials
TEST_ADMIN_EMAIL = "admin@test.com"
TEST_ADMIN_PASSWORD = "admin123"

# Timeouts
REQUEST_TIMEOUT = 30  # seconds
HOLD_DURATION_SECONDS = 15 * 60  # 15 minutes

# Concurrent test settings
MAX_CONCURRENT_USERS = 10
```

## API Client

The `api_client.py` provides a reusable HTTP client:

```python
from api_client import APIClient

client = APIClient()

# Authentication
client.signup(name="John", email="john@test.com", password="pass123")
client.login(email="john@test.com", password="pass123")
client.logout()

# Products
products = client.get_products().json()

# Cart
client.add_to_cart(product_id="...")
client.update_cart_quantity(product_id="...", quantity=3)

# Checkout
client.create_razorpay_order(products=[...], address={...})
client.get_hold_status(local_order_id="...")
client.cancel_hold(local_order_id="...")
```

## Test Data Generation

The `test_data.py` provides data generators using Faker:

```python
from test_data import generate_user_data, generate_address, generate_product_data

user = generate_user_data()
# {'name': 'John Doe', 'email': 'john@example.com', 'password': 'xY9kL2mN...'}

address = generate_address()
# {'name': '...', 'phoneNumber': '...', 'city': '...', ...}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure the backend server is running
   - Check `API_BASE_URL` in config.py

2. **Authentication Failures**
   - Verify test user credentials
   - Check if cookies are being handled

3. **Timeout Errors**
   - Increase `REQUEST_TIMEOUT` in config.py
   - Check server performance

4. **Missing Packages**
   ```bash
   pip install -r requirements.txt
   ```

### Debug Mode

```bash
# Run with maximum verbosity
pytest test_file.py -v --tb=long -s

# Print all output
pytest test_file.py -v -s --capture=no
```

## Contributing

1. Add new tests to appropriate test files
2. Use descriptive test names: `test_<action>_<condition>`
3. Include docstrings explaining test scenarios
4. Run full test suite before committing

## License

MIT License - See repository LICENSE file.
