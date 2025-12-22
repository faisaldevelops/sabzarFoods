# Performance Optimization: Bundle Optimization & Lazy Loading

## Problem
The application had performance issues with initial load times:
1. Large bundle sizes due to heavy dependencies like recharts (368 kB) and framer-motion (114 kB)
2. All libraries loaded on initial page load, even if not immediately needed
3. AdminPage bundle was 399.50 kB (mainly due to recharts)
4. Main bundle was 345.72 kB

## Solutions Implemented

### 1. **Bundle Optimization** - Code Splitting & Lazy Loading
- **Lazy loading recharts**: Split heavy charting library (368 kB) into separate chunk
  - Created `SalesChart.jsx` component with dynamic import
  - Only loads when Analytics tab is accessed in AdminPage
- **Manual chunk splitting in vite.config.js**:
  - `react-vendor`: React core libraries (162 kB)
  - `framer-motion`: Animation library (114 kB)
  - `recharts`: Charting library (368 kB, lazy loaded)
  - `ui-vendor`: UI libraries (46 kB)
- **Results**:
  - AdminPage: 399.50 kB → 26.50 kB (93% reduction)
  - Main bundle: 345.72 kB → 56.76 kB (84% reduction)
  - Total initial load reduced by ~366 kB (49% reduction)

### 2. **useUserStore.js** - User Authentication Caching
- **Added localStorage caching** with `user_cache` key
- **Skip redundant API calls**: If user is cached, return immediately without API call
- **Request deduplication**: Prevent multiple simultaneous `/auth/profile` calls
- **Changes**:
  - Initialize `user` state with `getCachedUser()` 
  - Change `checkingAuth` default to `false` (don't block render)
  - Update `checkAuth()` to skip API if user is cached
  - Cache user data in `signup()`, `login()`, and clear cache in `logout()`

### 3. **useCartStore.js** - Cart Caching
- **Added localStorage caching** with `cart_cache` key
- **Added `initCart()` method** for non-blocking initialization
- **Request deduplication**: Prevent multiple simultaneous cart fetches
- **Fixed bug**: Removed duplicate `initCart` method that existed in two places
- **Changes**:
  - Initialize `cart` state with `getCachedCart()`
  - New `initCart()` method called from App.jsx
  - Cache cart after every mutation (add, remove, update)
  - Guest cart still uses `guest_cart` for localStorage fallback

### 4. **useAddressStore.js** - Address Caching
- **Added localStorage caching** with `address_cache` key
- **Request deduplication**: Prevent multiple simultaneous address fetches
- **Changes**:
  - Initialize `address` state with `getCachedAddresses()`
  - Update `fetchAddresses()` to use request deduplication promise
  - Cache addresses after fetch and every mutation (create, update, delete)

### 4. **useAddressStore.js** - Address Caching
- **Added localStorage caching** with `address_cache` key
- **Request deduplication**: Prevent multiple simultaneous address fetches
- **Changes**:
  - Initialize `address` state with `getCachedAddresses()`
  - Update `fetchAddresses()` to use request deduplication promise
  - Cache addresses after fetch and every mutation (create, update, delete)

### 5. **App.jsx** - Non-Blocking Initialization
- **Removed blocking LoadingSpinner**: Content renders immediately
- **Background initialization**: All three stores initialize in the background
- **Changes**:
  - Remove `checkingAuth` from useUserStore destructuring
  - Remove the `if (checkingAuth) return <LoadingSpinner />;` guard
  - Keep the three useEffect hooks for initializing stores

### 5. **App.jsx** - Non-Blocking Initialization
- **Removed blocking LoadingSpinner**: Content renders immediately
- **Background initialization**: All three stores initialize in the background
- **Changes**:
  - Remove `checkingAuth` from useUserStore destructuring
  - Remove the `if (checkingAuth) return <LoadingSpinner />;` guard
  - Keep the three useEffect hooks for initializing stores

## Performance Improvements

### Repeat Visitors (Cached)
- **Before**: 3 API calls on load (profile + cart + addresses)
- **After**: 0 API calls if all data is cached
- **Speed**: Page renders instantly with cached data

### First-Time Visitors & Initial Load
- **Before**: Large bundle (745 kB+), blocking API calls, slow Time to Interactive
- **After**: Smaller initial bundle (379 kB), better code splitting, faster TTI
- **Speed**: 
  - 49% reduction in initial bundle size
  - 45% reduction in gzipped size (224 kB → 124 kB)
  - recharts (368 kB) only loads when needed

### Request Deduplication
- Prevents duplicate requests if multiple components mount simultaneously
- Uses promise caching to share ongoing requests

## Cache Invalidation

Caches are automatically cleared when:
- User logs out (user cache cleared)
- Cart is emptied (cart cache cleared)
- Logout is called (user cache cleared)

Caches are refreshed when:
- User logs in (new user cached)
- Items added/removed from cart (updated cart cached)
- Addresses are created/updated/deleted (updated addresses cached)

## LocalStorage Keys Used
- `user_cache`: Authenticated user profile data (no expiration)
- `cart_cache`: User's shopping cart items (no expiration)
- `address_cache`: User's saved addresses (no expiration)
- `guest_cart`: Guest checkout cart (existing, kept for backward compatibility)

## Bundle Chunks Created
- `react-vendor.js`: React, ReactDOM, React Router (162 kB)
- `framer-motion.js`: Animation library (114 kB)
- `recharts.js`: Chart library, lazy loaded (369 kB)
- `ui-vendor.js`: lucide-react, react-hot-toast, react-confetti (46 kB)
- `index.js`: Main application code (57 kB)

## Testing Checklist
- [ ] First login: Cache is saved
- [ ] Refresh page: Data loads from cache, no loading spinner
- [ ] Add to cart: Cache updates immediately
- [ ] Logout: Cache cleared
- [ ] Create address: Cache updates
- [ ] Edit address: Cache updates
- [ ] Delete address: Cache updates
- [ ] Admin Analytics tab: recharts loads only when tab is opened
- [ ] Initial page load is noticeably faster
