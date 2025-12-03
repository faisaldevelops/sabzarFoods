# Environment Setup Guide for Browser Tests

## Quick Answer

**For running browser automation tests, you need a `.env` file in the project root directory (not in e2e-tests folder).**

Here's what you need:

```bash
# Create .env file in project root
cd /home/runner/work/mern-ecommerce-sabzarFoodTv/mern-ecommerce-sabzarFoodTv
touch .env
```

## Required .env Configuration

Copy this into your `.env` file in the **project root**:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB (REQUIRED)
MONGO_URI=mongodb://localhost:27017/ecommerce
# OR use MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce

# Redis (REQUIRED for stock hold system)
UPSTASH_REDIS_URL=redis://localhost:6379
# OR use Upstash Redis:
# UPSTASH_REDIS_URL=rediss://:password@endpoint.upstash.io:6379

# JWT Secrets (REQUIRED)
ACCESS_TOKEN_SECRET=your_random_secret_here_min_32_chars
REFRESH_TOKEN_SECRET=another_random_secret_here_min_32_chars

# Frontend URL (REQUIRED)
CLIENT_URL=http://localhost:5173

# Cloudinary (OPTIONAL - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Gateways (OPTIONAL for tests - but REQUIRED for checkout)
# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Razorpay (used by tests)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Twilio (OPTIONAL - for OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Minimum Configuration for Tests

If you just want to run tests without full payment integration:

```env
# Absolute minimum to run backend + tests
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/ecommerce
UPSTASH_REDIS_URL=redis://localhost:6379
ACCESS_TOKEN_SECRET=my-super-secret-access-token-key-min-32-characters
REFRESH_TOKEN_SECRET=my-super-secret-refresh-token-key-min-32-characters
CLIENT_URL=http://localhost:5173

# Optional but recommended for checkout tests
RAZORPAY_KEY_ID=rzp_test_dummy_key
RAZORPAY_KEY_SECRET=dummy_secret
```

## Generate Secure JWT Secrets

Use these commands to generate secure random secrets:

```bash
# Generate ACCESS_TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate REFRESH_TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Local MongoDB Setup

### Option 1: MongoDB locally
```bash
# Install MongoDB Community Edition
# Start MongoDB
mongod --dbpath /path/to/data/directory

# Your .env
MONGO_URI=mongodb://localhost:27017/ecommerce
```

### Option 2: MongoDB Atlas (Free Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Use in .env:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority
```

## Local Redis Setup

### Option 1: Redis locally
```bash
# Install Redis
# Start Redis
redis-server

# Your .env
UPSTASH_REDIS_URL=redis://localhost:6379
```

### Option 2: Upstash Redis (Free Cloud)
1. Go to https://upstash.com
2. Create Redis database
3. Copy REST URL
4. Use in .env:
```env
UPSTASH_REDIS_URL=rediss://:password@endpoint.upstash.io:6379
```

## Payment Gateway Setup (Optional)

### For Razorpay (used in tests)
1. Sign up at https://razorpay.com
2. Get test API keys from Dashboard
3. Add to .env:
```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

### For Stripe
1. Sign up at https://stripe.com
2. Get test API keys
3. Add to .env:
```env
STRIPE_SECRET_KEY=sk_test_...
```

## Verification Steps

After setting up .env:

```bash
# 1. Check .env exists in project root
ls -la .env

# 2. Start backend - it should connect to MongoDB and Redis
npm run dev

# 3. Check logs for successful connections:
# ✅ "MongoDB Connected"
# ✅ "Redis Connected"
# ✅ "Server is running on http://localhost:5000"

# 4. Start frontend
npm run dev --prefix frontend

# 5. Run tests
npm run test:e2e
```

## Test-Specific Environment Variables (Optional)

For the e2e tests themselves, these are optional:

```env
# Test configuration (optional - has defaults)
BASE_URL=http://localhost:5173
API_URL=http://localhost:5000/api
AUTO_START_SERVERS=false  # Keep false - start servers manually
```

## Troubleshooting

### Error: "MongoDB connection failed"
- Check MONGO_URI is correct
- Verify MongoDB is running
- Check network connectivity

### Error: "Redis connection failed"
- Check UPSTASH_REDIS_URL is correct
- Verify Redis is running
- Check if Redis requires authentication

### Error: "Invalid JWT secret"
- Ensure secrets are at least 32 characters
- Use the crypto command above to generate secure ones

### Tests skip or fail during checkout
- Add Razorpay credentials (at least dummy ones)
- Or tests will skip payment-related scenarios

## Complete Example

Here's a complete, working example for local development:

```env
# .env in project root

PORT=5000
NODE_ENV=development

# Local MongoDB
MONGO_URI=mongodb://localhost:27017/ecommerce-test

# Local Redis
UPSTASH_REDIS_URL=redis://localhost:6379

# Generated JWT secrets
ACCESS_TOKEN_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
REFRESH_TOKEN_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4

# Frontend
CLIENT_URL=http://localhost:5173

# Payment (test keys)
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=test_secret_key_1234567890

# Optional
STRIPE_SECRET_KEY=sk_test_1234567890
CLOUDINARY_CLOUD_NAME=demo
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuv
```

## Summary

**What you MUST set:**
1. ✅ MONGO_URI (MongoDB connection)
2. ✅ UPSTASH_REDIS_URL (Redis connection)
3. ✅ ACCESS_TOKEN_SECRET (JWT secret)
4. ✅ REFRESH_TOKEN_SECRET (JWT secret)
5. ✅ CLIENT_URL (Frontend URL)

**What is OPTIONAL but recommended:**
- RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (for checkout tests)
- STRIPE_SECRET_KEY (for Stripe checkout)
- Cloudinary credentials (for image uploads)

**What you DON'T need for tests:**
- Twilio credentials (unless testing OTP specifically)

---

After setting up .env, remember:
1. Start backend: `npm run dev`
2. Start frontend: `npm run dev --prefix frontend`
3. Run tests: `npm run test:e2e`
