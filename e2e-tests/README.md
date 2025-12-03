# Browser Automation E2E Test Suite

Comprehensive browser automation tests using Playwright covering all scenarios including concurrent orders, race conditions, and edge cases.

## 📋 Overview

This test suite provides complete end-to-end browser automation testing for the MERN e-commerce application. It tests:

- ✅ **Authentication flows** (signup, login, logout, session management)
- 🛒 **Cart operations** (add, update, remove, sync across sessions)
- 💳 **Checkout process** (address management, hold orders, payment flow)
- 🏃 **Concurrent operations** (multiple users, limited stock, race conditions)
- 📦 **Product browsing** (display, filtering, search, availability)
- 🔒 **Security** (protected routes, validation, error handling)
- 🚀 **Performance** (load times, responsiveness)
- 📱 **Responsive design** (mobile, tablet, desktop)

## 🎯 Test Coverage

### Authentication Tests (`auth.spec.js`)
- User registration with validation
- Login/logout flows
- Session persistence across refreshes
- Protected route access control
- Guest user functionality
- Concurrent login handling

### Cart Tests (`cart.spec.js`)
- Add products as guest and authenticated user
- Update quantities
- Remove items and clear cart
- Cart persistence in local storage
- Cart synchronization after login
- Rapid interaction handling
- Cart total calculations

### Checkout Tests (`checkout.spec.js`)
- Address management (add, select, validate)
- Hold order creation and management
- Stock validation during checkout
- Order cancellation and stock release
- Error handling (insufficient stock, invalid data)
- Empty cart and missing address handling

### Concurrent Order Tests (`concurrent-orders.spec.js`)
- **Multiple users checkout same product** with limited stock
- **Race condition prevention** for overselling
- Concurrent cart operations
- Stock hold system under concurrency
- Payment race conditions
- Session race conditions
- Proper stock locking and release

### Product Tests (`products.spec.js`)
- Product display and details
- Category filtering
- Search functionality
- Stock availability display
- Out of stock handling
- API endpoint testing
- Performance testing
- Responsive design validation

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ installed
- Backend server running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`
- MongoDB and Redis instances running

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### ⚠️ IMPORTANT: Start Servers First

**You MUST start the backend and frontend servers manually before running tests.**

```bash
# Terminal 1: Start backend server
npm run dev

# Terminal 2: Start frontend server (in a new terminal)
npm run dev --prefix frontend

# Wait for both servers to be fully running, then proceed to run tests
```

### Running Tests

**After servers are running**, run tests in a third terminal:

#### Run All Tests
```bash
npm run test:e2e
```

#### Run Specific Test Suite
```bash
# Authentication tests
npx playwright test auth.spec.js

# Cart tests
npx playwright test cart.spec.js

# Checkout tests
npx playwright test checkout.spec.js

# Concurrent order tests
npx playwright test concurrent-orders.spec.js

# Product tests
npx playwright test products.spec.js
```

#### Run Tests in UI Mode (Interactive)
```bash
npx playwright test --ui
```

#### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

#### Run Specific Test
```bash
npx playwright test -g "should handle concurrent checkouts"
```

#### Run Tests with Specific Number of Workers
```bash
npx playwright test --workers=1
```

## 📊 Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

Test results are saved in:
- `test-results/` - Screenshots, videos, and traces
- `playwright-report/` - HTML report

## 🏗️ Project Structure

```
e2e-tests/
├── utils/
│   ├── helpers.js          # Utility functions
│   ├── AuthPage.js         # Auth page object model
│   ├── CartPage.js         # Cart page object model
│   └── CheckoutPage.js     # Checkout page object model
├── auth.spec.js            # Authentication tests
├── cart.spec.js            # Cart management tests
├── checkout.spec.js        # Checkout flow tests
├── concurrent-orders.spec.js # Concurrent & race condition tests
├── products.spec.js        # Product browsing tests
└── README.md              # This file
```

## 🔧 Configuration

Edit `playwright.config.js` to customize:

```javascript
{
  baseURL: 'http://localhost:5173',  // Frontend URL
  apiURL: 'http://localhost:5000/api', // Backend API URL
  timeout: 60000,                    // Test timeout
  workers: 3,                        // Parallel workers
  retries: 0,                        // Retry failed tests
}
```

## 📝 Writing Tests

### Example Test Structure

```javascript
import { test, expect } from '@playwright/test';
import { AuthPage } from './utils/AuthPage.js';
import { generateUserData } from './utils/helpers.js';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    const authPage = new AuthPage(page);
    const userData = generateUserData();
    
    await authPage.signup(userData.name, userData.email, userData.password);
    
    expect(await authPage.isLoggedIn()).toBeTruthy();
  });
});
```

### Page Object Models

Use page object models for cleaner tests:

```javascript
const authPage = new AuthPage(page);
await authPage.login(email, password);

const cartPage = new CartPage(page);
await cartPage.addToCart(0);

const checkoutPage = new CheckoutPage(page);
await checkoutPage.addNewAddress(address);
```

## 🎭 Concurrent Testing

The test suite includes comprehensive concurrent testing to verify:

### Race Condition Tests

1. **Concurrent Checkouts with Limited Stock**
   - Multiple users try to buy the same product
   - Verifies no overselling occurs
   - Ensures proper stock locking

2. **Cart Race Conditions**
   - Concurrent cart updates
   - Rapid quantity changes
   - Cart synchronization

3. **Stock Hold Races**
   - Hold creation and cancellation
   - Proper stock release
   - Expiration handling

4. **Payment Races**
   - Duplicate order prevention
   - Concurrent payment attempts

5. **Session Races**
   - Concurrent logins
   - Multiple session operations

### Running Concurrent Tests Only

```bash
npx playwright test concurrent-orders.spec.js
```

## 🐛 Debugging Tests

### Debug Specific Test
```bash
npx playwright test --debug -g "test name"
```

### Record New Tests
```bash
npx playwright codegen http://localhost:5173
```

### View Trace on Failure
Traces are automatically captured on failure. View them:
```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## 📈 Performance Testing

Tests include performance checks:
- Page load times
- API response times
- Concurrent operation handling
- Large data set handling

## 🔐 Security Testing

Tests verify:
- Authentication requirements
- Authorization checks
- Input validation
- XSS prevention (basic)
- CSRF protection (basic)

## 🌐 Environment Variables

Create `.env` file in project root:

```env
BASE_URL=http://localhost:5173
API_URL=http://localhost:5000/api
SKIP_WEB_SERVER=false
```

## 📱 Responsive Testing

Tests run on multiple viewports:
- Desktop: 1280x720
- Tablet: 768x1024
- Mobile: 375x667

## 🚨 Common Issues

### ❌ Error: "Process from config.webserver was not able to start"

**This is the most common error!** It means you need to start servers manually.

**Solution:**
1. Stop the test run (Ctrl+C)
2. Open Terminal 1 and run: `npm run dev` (backend)
3. Open Terminal 2 and run: `npm run dev --prefix frontend`
4. Wait until you see both servers are running
5. Open Terminal 3 and run: `npm run test:e2e`

**Why this happens:** The test configuration expects servers to be already running. Auto-start is disabled by default for better visibility of server logs.

### ❌ Browser Not Opening

**Solution:**
- Make sure Playwright browsers are installed: `npx playwright install chromium`
- Tests run in headless mode by default. To see the browser:
  ```bash
  npm run test:e2e:headed
  # or
  npm run test:e2e:ui  # Interactive mode (recommended)
  ```

### Tests Fail with "Connection Refused"
- Ensure backend is running: `npm run dev`
- Ensure frontend is running: `npm run dev --prefix frontend`
- Check `BASE_URL` and `API_URL` in config
- Verify both servers show "running" messages before starting tests

### Tests Timeout
- Increase timeout in `playwright.config.js`
- Check server performance
- Verify database connection

### Browser Not Found
- Run: `npx playwright install chromium`

### Tests Skip Due to Missing Data
- Ensure database has products with stock
- Run data seeding if available
- Check product availability via API

## 🎯 Best Practices

1. **Run tests serially for concurrent tests** to avoid interference
2. **Use page object models** for maintainable tests
3. **Generate unique test data** with helpers
4. **Clean up test data** in afterEach hooks
5. **Use API calls** for faster test setup
6. **Mock external services** when appropriate
7. **Take screenshots** on failures
8. **Use descriptive test names**

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Models](https://playwright.dev/docs/pom)
- [API Testing](https://playwright.dev/docs/api-testing)

## 🤝 Contributing

When adding new tests:
1. Follow existing patterns
2. Use page object models
3. Add appropriate assertions
4. Test edge cases
5. Update this README

## 📄 License

Same as parent project.

## 🏆 Test Statistics

Run `npm run test:e2e` to see:
- Total tests: 100+
- Coverage areas: Authentication, Cart, Checkout, Concurrency, Products
- Concurrent scenario tests: 15+
- Edge case tests: 30+
- Race condition tests: 10+

---

**Happy Testing! 🎉**
