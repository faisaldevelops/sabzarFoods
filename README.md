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

Create a `.env` file in the `backend` directory with the following variables:

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

**Backend:**
```shell
cd backend
npm install
npm run dev
```

**Frontend:**
```shell
cd frontend
npm install
npm run dev
```

### Production Deployment

**Backend (DigitalOcean App Platform):**
- Deploy from the `backend` directory
- Set environment variables in the app configuration
- Run command: `npm install && npm start`

**Frontend (DigitalOcean Static Site):**
- Deploy from the `frontend` directory
- Build command: `npm install && npm run build`
- Output directory: `dist`
