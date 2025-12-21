# Performance Optimization: Profile Endpoint Caching

## Problem
The `/api/auth/profile` endpoint (and other initialization APIs) were being called on every page load, causing:
- Unnecessary network requests
- Slow initial page renders
- Blocking UI until all requests completed

## Solution
Implemented comprehensive caching and request deduplication across all three stores:

### 1. **useUserStore.js** - User Authentication Caching
- **Added localStorage caching** with `user_cache` key
- **Skip redundant API calls**: If user is cached, return immediately without API call
- **Request deduplication**: Prevent multiple simultaneous `/auth/profile` calls
- **Changes**:
  - Initialize `user` state with `getCachedUser()` 
  - Change `checkingAuth` default to `false` (don't block render)
  - Update `checkAuth()` to skip API if user is cached
  - Cache user data in `signup()`, `login()`, and clear cache in `logout()`

### 2. **useCartStore.js** - Cart Caching
- **Added localStorage caching** with `cart_cache` key
- **Added `initCart()` method** for non-blocking initialization
- **Request deduplication**: Prevent multiple simultaneous cart fetches
- **Changes**:
  - Initialize `cart` state with `getCachedCart()`
  - New `initCart()` method called from App.jsx
  - Cache cart after every mutation (add, remove, update)
  - Guest cart still uses `guest_cart` for localStorage fallback

### 3. **useAddressStore.js** - Address Caching
- **Added localStorage caching** with `address_cache` key
- **Request deduplication**: Prevent multiple simultaneous address fetches
- **Changes**:
  - Initialize `address` state with `getCachedAddresses()`
  - Update `fetchAddresses()` to use request deduplication promise
  - Cache addresses after fetch and every mutation (create, update, delete)

### 4. **App.jsx** - Non-Blocking Initialization
- **Removed blocking LoadingSpinner**: Content renders immediately
- **Background initialization**: All three stores initialize in the background
- **Changes**:
  - Remove `checkingAuth` from useUserStore destructuring
  - Remove the `if (checkingAuth) return <LoadingSpinner />;` guard
  - Keep the three useEffect hooks for initializing stores

## Performance Improvements

### Repeat Visitors (Cached)
- **Before**: 3 API calls on load (profile + cart + addresses)
- **After**: 0 API calls (all data from localStorage)
- **Speed**: Page renders instantly

### First-Time Visitors
- **Before**: 3 blocking API calls, page frozen until all complete
- **After**: Content renders while 3 requests load in background
- **Speed**: Perceived load time dramatically reduced

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
- `user_cache`: Authenticated user profile data
- `cart_cache`: User's shopping cart items
- `address_cache`: User's saved addresses
- `guest_cart`: Guest checkout cart (existing, kept for backward compatibility)

## Testing Checklist
- [ ] First login: Cache is saved
- [ ] Refresh page: Data loads from cache, no loading spinner
- [ ] Add to cart: Cache updates immediately
- [ ] Logout: Cache cleared
- [ ] Create address: Cache updates
- [ ] Edit address: Cache updates
- [ ] Delete address: Cache updates
