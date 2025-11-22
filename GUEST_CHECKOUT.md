# Guest Checkout Feature Documentation

## Overview
This feature allows users to make purchases without creating an account upfront. Guest users provide their phone number and optional email during checkout, which creates a minimal guest account that can later be upgraded via OTP login.

## User Journey

### For Guest Users:
1. Browse products without logging in
2. Add items to cart (stored in localStorage)
3. Navigate to cart page
4. Fill in delivery address with:
   - Name (required)
   - Phone Number (required, 10 digits)
   - Email (optional)
   - Complete address details
5. Click "Proceed to Checkout"
6. Complete Razorpay payment
7. Order is created and confirmed

### Account Creation:
- Guest account is automatically created when user provides phone number in address
- If phone number already exists, existing account is used
- Guest users can login later using phone number with OTP

### When Guest Logs In:
- LocalStorage cart automatically syncs to server
- All previous orders are linked to the account
- Full account features become available

## Technical Implementation

### Backend Changes:
- **User Model**: Added `phoneNumber` field, made `email` and `password` optional, added `isGuest` flag
- **Auth Controller**: Created `/api/auth/guest` endpoint
- **Middleware**: Implemented `optionalAuth` for routes supporting both guest and authenticated users
- **Payment Flow**: Modified to create guest users from address information
- **Cart Routes**: Updated to support optional authentication

### Frontend Changes:
- **Cart Store**: Implemented localStorage-based cart with validation
- **Address Modal**: Added optional email field
- **App Routes**: Removed authentication requirement from cart/checkout pages
- **Cart Sync**: Automatic sync when guest logs in

## API Endpoints

### Guest User Creation
```
POST /api/auth/guest
Body: {
  name: string,
  phoneNumber: string,
  email?: string
}
Response: User object with auth tokens
```

### Payment Flow (Guest-Compatible)
```
POST /api/payments/razorpay-create-order
No authentication required (uses optionalAuth)
Body: {
  products: Product[],
  address: {
    name: string,
    phoneNumber: string,
    email?: string,
    ...addressFields
  },
  couponCode?: string
}
```

## Security Considerations

### Implemented Security:
- ✅ Cryptographically secure password generation (crypto.randomBytes)
- ✅ Phone number uniqueness with sparse indexes
- ✅ LocalStorage cart data validation
- ✅ Email format validation
- ✅ Race condition handling for cart sync

### Limitations:
- Guest users cannot use coupons (requires authenticated account)
- Cart operations for guests are localStorage-only

## Future Enhancements

1. **OTP Authentication**: Implement SMS-based OTP login
2. **Phone Verification**: Add SMS verification during checkout
3. **Account Upgrade**: Allow guests to set password and upgrade
4. **Guest Coupons**: Enable coupon usage for guest users

## Configuration

No additional configuration required. The feature works with existing Razorpay setup.

## Testing

### Manual Testing Steps:
1. Clear browser localStorage
2. Navigate to product listing
3. Add product to cart (without logging in)
4. Verify items appear in cart
5. Fill address form with phone and name
6. Complete checkout
7. Verify order creation in database
8. Check that guest user account was created

### Database Verification:
```javascript
// Check guest user created
db.users.findOne({ phoneNumber: "1234567890", isGuest: true })

// Check order linked to guest user
db.orders.findOne({ user: guestUserId })
```

## Support

For questions or issues related to guest checkout, refer to the main repository documentation or contact the development team.
