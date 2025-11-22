<h1 align="center">URBAN K E-Commerce Store 🛒</h1>

Features of this App

-   🚀 Project Setup
-   🗄️ MongoDB & Redis Integration
-   💳 Stripe Payment Setup
-   🔐 Robust Authentication System
-   🔑 JWT with Refresh/Access Tokens
-   📝 User Signup & Login
-   🛒 E-Commerce Core
-   📦 Product & Category Management
-   🛍️ Shopping Cart Functionality
-   💰 Checkout with Stripe
-   🏷️ Coupon Code System
-   👑 Admin Dashboard
-   📊 Sales Analytics
-   🎨 Design with Tailwind
-   🛒 Cart & Checkout Process
-   🔒 Security
-   🛡️ Data Protection
-   🚀Caching with Redis
-   ⌛ And a lot more...

### Setup .env file

```bash
PORT=5000
MONGO_URI=your_mongo_uri

UPSTASH_REDIS_URL=your_redis_url

ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Run this app locally

```shell
npm run build
```

### Start the app

```shell
npm run start
```

---

## 🔧 TO-DO List / Issues to Fix

This section documents known issues, incomplete features, and improvements needed for the website. Contributions to fix these items are welcome!

### 🚨 High Priority Issues

#### 1. Payment Gateway Configuration
- [ ] **Clean up commented Stripe code** - Remove or properly archive old Stripe implementation in:
  - `backend/server.js` (lines 1-51)
  - `backend/routes/payment.route.js` (lines 1-10)
  - `backend/controllers/payment.controller.js` (lines 149-281)
- [ ] **Update .env documentation** - Add missing Razorpay environment variables:
  ```bash
  RAZORPAY_KEY_ID=your_razorpay_key_id
  RAZORPAY_KEY_SECRET=your_razorpay_key_secret
  RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
  ```
- [ ] **Verify Razorpay integration** - Test complete payment flow from cart to order confirmation
- [ ] **Update README features** - Change "💳 Stripe Payment Setup" to reflect Razorpay integration
- [ ] **Remove hardcoded Stripe key** - Replace hardcoded Stripe public key in `frontend/src/components/OrderSummary.jsx:12` with environment variable

#### 2. Code Cleanup & Dead Code Removal
- [ ] **Remove commented code blocks** throughout the codebase:
  - `backend/models/order.model.js` (3 different versions of schema commented out)
  - `backend/lib/redis.js` (old implementation lines 1-6)
  - `backend/routes/address.route.js` (entire file commented)
  - `backend/controllers/address.controller.js` (entire file commented)
  - `frontend/src/components/OrderSummary.jsx` (old Stripe handler lines 27-48)
  - `frontend/src/components/OrdersTab.jsx`
  - `frontend/src/pages/AdminPage.jsx`
  - `frontend/src/stores/useOrderStore.js`
- [ ] **Fix typo** - Correct "cloduinary" to "cloudinary" in `backend/controllers/product.controller.js:79`

#### 3. Security & Authentication
- [ ] **Implement axios interceptors** - Add automatic access token refresh using refresh tokens (noted in `frontend/src/stores/useUserStore.js`)
- [ ] **Review cookie security settings** - Ensure proper `secure` and `sameSite` flags for production
- [ ] **Add rate limiting** - Implement rate limiting middleware for authentication endpoints
- [ ] **Validate environment variables** - Add startup validation to ensure all required env vars are set
- [ ] **Sanitize user inputs** - Add input validation middleware to prevent XSS and injection attacks

### 🔨 Medium Priority Issues

#### 4. Database & Data Management
- [ ] **Document migration script** - Add documentation for `scripts/fixOrderIssues.js` in README
- [ ] **Add database seeding** - Create seed scripts for development data (products, categories, test users)
- [ ] **Optimize database indexes** - Review and optimize MongoDB indexes for performance
- [ ] **Add data validation** - Strengthen Mongoose schema validations with custom validators
- [ ] **Handle orphaned data** - Implement cleanup for orders with deleted products/users

#### 5. Address Management Feature
- [ ] **Implement address CRUD operations** - Complete the address controller and routes:
  - Add address creation endpoint
  - Add address update endpoint
  - Add address deletion endpoint
  - Add get all addresses for user endpoint
- [ ] **Integrate address selection** - Complete address selection UI in cart/checkout flow
- [ ] **Add address validation** - Validate Indian postal codes and phone numbers
- [ ] **Support multiple addresses** - Allow users to save and select from multiple shipping addresses

#### 6. Error Handling & Logging
- [ ] **Implement proper logging** - Replace console.log statements (79 instances found) with proper logger (e.g., Winston, Pino)
- [ ] **Standardize error responses** - Create consistent error response format across all endpoints
- [ ] **Add error tracking** - Integrate error monitoring service (Sentry, Rollbar, etc.)
- [ ] **Improve error messages** - Make error messages more user-friendly and informative
- [ ] **Add request logging** - Log all API requests with relevant metadata

#### 7. Frontend Improvements
- [ ] **Add loading states** - Improve loading indicators throughout the application
- [ ] **Implement error boundaries** - Add React error boundaries to prevent full app crashes
- [ ] **Add form validation** - Implement comprehensive client-side validation for all forms
- [ ] **Improve accessibility** - Add ARIA labels and ensure keyboard navigation works
- [ ] **Optimize images** - Implement lazy loading and optimize image sizes
- [ ] **Add empty states** - Create proper empty state UI for cart, orders, and product lists

### 📦 Feature Enhancements

#### 8. Testing & Quality Assurance
- [ ] **Set up testing framework** - Configure Jest and React Testing Library
- [ ] **Add unit tests** - Write tests for:
  - Authentication controllers
  - Payment processing logic
  - Cart operations
  - Coupon validation
- [ ] **Add integration tests** - Test API endpoints end-to-end
- [ ] **Add E2E tests** - Implement Cypress or Playwright for critical user flows
- [ ] **Set up CI/CD** - Configure GitHub Actions for automated testing

#### 9. Order Management
- [ ] **Add order status tracking** - Implement order status updates (pending → processing → shipped → delivered)
- [ ] **Send order confirmation emails** - Integrate email service for order notifications
- [ ] **Add order history filtering** - Allow users to filter/search their order history
- [ ] **Implement order cancellation** - Allow users to cancel pending orders
- [ ] **Add invoice generation** - Generate PDF invoices for completed orders

#### 10. Product Management
- [ ] **Add product inventory tracking** - Track stock levels and prevent overselling
- [ ] **Implement product search** - Add full-text search for products
- [ ] **Add product filtering** - Enable filtering by price range, category, etc.
- [ ] **Support product variants** - Add size, color, and other variant support
- [ ] **Add product reviews** - Implement customer review and rating system
- [ ] **Add related products** - Show "customers also bought" recommendations

#### 11. Admin Dashboard Enhancements
- [ ] **Add user management** - Allow admins to view and manage users
- [ ] **Improve analytics visualization** - Add more charts and metrics
- [ ] **Add export functionality** - Export orders and analytics data to CSV/Excel
- [ ] **Add bulk operations** - Enable bulk product updates/deletions
- [ ] **Add notification system** - Alert admins of new orders, low stock, etc.

### 🎨 UX/UI Improvements

#### 12. User Experience
- [ ] **Add wishlist feature** - Allow users to save products for later
- [ ] **Implement product comparison** - Enable side-by-side product comparison
- [ ] **Add quick view modal** - Quick product preview without leaving current page
- [ ] **Improve mobile responsiveness** - Test and fix mobile UI issues
- [ ] **Add dark mode toggle** - Implement theme switching
- [ ] **Add breadcrumbs** - Improve navigation with breadcrumb trails
- [ ] **Optimize checkout flow** - Reduce steps and friction in checkout process

#### 13. Performance Optimization
- [ ] **Implement pagination** - Add pagination to product lists and order history
- [ ] **Add Redis caching** - Cache more frequently accessed data (user profiles, cart totals)
- [ ] **Optimize bundle size** - Analyze and reduce frontend JavaScript bundle size
- [ ] **Add service worker** - Implement PWA features for offline support
- [ ] **Optimize database queries** - Use aggregation pipelines and reduce query counts
- [ ] **Add CDN for static assets** - Serve images and static files from CDN

### 📚 Documentation

#### 14. Documentation Improvements
- [ ] **Add API documentation** - Document all API endpoints with examples (Swagger/OpenAPI)
- [ ] **Create deployment guide** - Add production deployment instructions
- [ ] **Add contributing guidelines** - Create CONTRIBUTING.md with development workflow
- [ ] **Document code architecture** - Add architecture diagrams and design decisions
- [ ] **Add troubleshooting guide** - Common issues and their solutions
- [ ] **Create user manual** - End-user guide for using the platform

### 🔐 Security Hardening

#### 15. Additional Security Measures
- [ ] **Add CORS configuration** - Properly configure CORS for production
- [ ] **Implement CSP headers** - Add Content Security Policy headers
- [ ] **Add request validation** - Validate all incoming request data with Joi or Yup
- [ ] **Implement 2FA** - Add two-factor authentication option
- [ ] **Add session management** - Implement proper session handling and timeout
- [ ] **Security audit** - Run security audit with npm audit and fix vulnerabilities
- [ ] **Add helmet.js** - Implement security headers middleware

---

## 📝 Notes

- This to-do list was generated through code review and represents both critical fixes and future enhancements
- Items are prioritized but can be tackled in any order based on business needs
- Some features (like address management) are partially implemented and need completion
- The codebase currently uses Razorpay for payments, but Stripe code remains for reference

## 🤝 Contributing

Contributions are welcome! Please check the to-do list above and submit PRs for any items you'd like to work on. Make sure to:
- Comment on the issue or create one before starting work
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
