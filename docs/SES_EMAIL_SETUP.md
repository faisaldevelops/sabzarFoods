# Amazon SES Email Notifications Setup

This document explains how to configure Amazon SES (Simple Email Service) for email notifications in the e-commerce platform.

## Overview

The platform sends email notifications for:
1. **Waitlist Notifications** - When a product is back in stock
2. **Order Confirmation** - When payment is confirmed
3. **Order Shipped** - When order status changes to "shipped"
4. **Order Delivered** - When order status changes to "delivered"

## Environment Variables

Add these environment variables to your `.env` file:

```env
# AWS SES Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_SES_REGION=ap-south-1

# Email Settings
SES_FROM_EMAIL=noreply@yourdomain.com
BRAND_NAME=YourBrandName
CLIENT_URL=https://yourdomain.com
```

## AWS Setup Steps

### 1. Create an AWS Account
If you don't have one, create an AWS account at https://aws.amazon.com

### 2. Access SES Console
Navigate to Amazon SES in the AWS Console: https://console.aws.amazon.com/ses

### 3. Verify Email Addresses/Domains

**For Development (Sandbox Mode):**
- Verify sender email: Go to "Verified identities" → "Create identity" → Enter your email
- You'll receive a verification email - click the link to verify
- Verify recipient emails the same way (required in sandbox mode)

**For Production:**
- Verify your sending domain instead
- Request production access to remove sending limits

### 4. Create IAM User for SES

1. Go to IAM Console → Users → Create User
2. Name: `ses-email-sender`
3. Attach policy: `AmazonSESFullAccess` (or create a custom policy with limited permissions)
4. Create access key for the user
5. Copy the Access Key ID and Secret Access Key

### 5. (Production) Request Production Access

While in sandbox mode, you can only send to verified emails. To send to any email:
1. Go to SES Dashboard → "Request production access"
2. Fill out the request form with use case details
3. Wait for AWS approval (usually 24-48 hours)

## Testing

### Check if SES is Configured

If AWS credentials are not set, the system will log emails instead of sending them:

```
[SES] AWS credentials not configured - logging email instead
[SES LOG] To: customer@example.com
[SES LOG] Subject: Order Confirmed - #ORD-123
[SES LOG] Would send email...
```

### Test Email Sending

You can test email sending by:
1. Adding a product to waitlist, then marking it as back in stock
2. Completing a test order
3. Changing order status to "shipped" or "delivered"

## Email Templates

All email templates are embedded in `backend/lib/ses.js` with:
- Responsive HTML design
- Consistent branding (uses `BRAND_NAME` env variable)
- Fallback plain text versions
- Mobile-friendly styling

### Template Functions:
- `sendWaitlistNotification(email, productName, productId)`
- `sendOrderConfirmation({ email, customerName, orderId, products, ... })`
- `sendOrderShippedNotification({ email, customerName, orderId, trackingNumber, ... })`
- `sendOrderDeliveredNotification({ email, customerName, orderId })`

## Troubleshooting

### Email Not Sending

1. **Check credentials**: Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct
2. **Check region**: Ensure AWS_SES_REGION matches your SES region
3. **Sandbox mode**: Verify both sender and recipient emails if in sandbox
4. **Check logs**: Look for `[SES]` prefixed log messages

### Common Errors

- `MessageRejected`: Sender email not verified
- `AccessDenied`: IAM permissions issue
- `InvalidParameterValue`: Check email format

## Cost

Amazon SES pricing (as of 2024):
- $0.10 per 1,000 emails sent from EC2 or AWS services
- First 62,000 emails free when sending from EC2

## Security Best Practices

1. Use IAM roles with minimal permissions in production
2. Never commit AWS credentials to version control
3. Rotate access keys periodically
4. Monitor SES sending quotas and bounce rates
5. Set up SNS notifications for bounces and complaints

