# Stock Hold System - Monitoring & Maintenance

## How the System Works

### Automatic Cleanup (Background Job)

The hold expiry cleanup job runs **continuously** while the server is running:

1. **On Server Startup**: Runs immediately to catch any holds that expired during server downtime
2. **Every 60 Seconds**: Continuously checks for and releases expired holds
3. **Even if server runs for months**: The job keeps running every minute

### Timeline Example

```
User A starts checkout → HOLD created, expiresAt = now + 15 minutes
    ↓
After 15 minutes → Hold expires
    ↓
Within 60 seconds → Background job finds and releases the hold
    ↓
Reserved stock released, order marked as expired
```

### Monitoring the Background Job

Check if the background job is working correctly:

```bash
# Call the health check endpoint
curl http://localhost:5000/api/payments/hold-expiry-job-health
```

**Response:**
```json
{
  "success": true,
  "startTime": "2024-12-02T10:00:00.000Z",
  "lastRunTime": "2024-12-02T10:15:00.000Z",
  "totalRuns": 16,
  "totalReleased": 5,
  "errors": 0,
  "isRunning": true,
  "uptimeSeconds": 900,
  "secondsSinceLastRun": 30
}
```

**What to check:**
- `isRunning`: Should be `true`
- `secondsSinceLastRun`: Should be < 70 seconds (if > 70, job might be stuck)
- `errors`: Should be 0 (if > 0, check server logs)
- `totalReleased`: Total expired holds released since server started

### When Stuck Reservations Can Occur

Despite the background job, reservations can get stuck in these scenarios:

#### 1. **Server Downtime**
- **Problem**: Server stopped for 2 hours, holds expired during downtime
- **Solution**: Background job runs immediately on startup and releases them
- **Manual**: If you see stuck reservations, run cleanup script

#### 2. **Payment Webhook Failure**
- **Problem**: Payment succeeded but webhook didn't fire to finalize order
- **Result**: Hold stays active, reserved quantity not decremented
- **Solution**: Webhook retries (Razorpay retries webhooks), or hold expires after 15 min
- **Manual**: If payment succeeded but order shows "hold" for > 15 min, run cleanup script

#### 3. **Database Inconsistency**
- **Problem**: Manual database edits, migration issues, or race conditions
- **Solution**: Run cleanup script periodically as maintenance

### Manual Cleanup Script

For any stuck reservations, run:

```bash
# Option 1: Using npm script
npm run cleanup:reservations

# Option 2: Direct execution
node backend/scripts/cleanupStuckReservations.js
```

**When to run:**
- After extended server downtime (> 30 minutes)
- If you notice products with reservedQuantity > 0 for > 20 minutes
- After deployments as a precaution
- Weekly/monthly as routine maintenance

### Verifying Everything is Working

**1. Check Background Job Health:**
```bash
curl http://localhost:5000/api/payments/hold-expiry-job-health | jq
```

**2. Check Server Logs:**
```bash
# Look for these logs:
🔄 Starting hold expiry cleanup job (runs every 60 seconds)
✓ Initial cleanup: No expired holds found
✓ Released 3 expired hold orders  # When holds are released
```

**3. Check Database:**
```javascript
// In MongoDB shell or Compass
// Check for products with reservedQuantity
db.products.find({ reservedQuantity: { $gt: 0 } })

// Check for hold orders older than 15 minutes
db.orders.find({ 
  status: "hold", 
  expiresAt: { $lte: new Date() } 
})
```

If you find:
- Products with `reservedQuantity > 0` AND no active holds → Run cleanup script
- Hold orders with `status: "hold"` and `expiresAt` in the past → Run cleanup script (or wait 60 seconds for background job)

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     Stock Hold System                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User Checkout                                               │
│      ↓                                                        │
│  Create HOLD order (expiresAt = now + 15 min)              │
│      ↓                                                        │
│  Reserve stock (increment reservedQuantity)                 │
│      ↓                                                        │
│  User has 15 minutes to complete payment                    │
│      ↓                                                        │
│  ┌──────────────────┬──────────────────┐                   │
│  │ Payment Success  │ Payment Failed   │                   │
│  │ or 15 min passes │                  │                   │
│  └────────┬─────────┴────────┬─────────┘                   │
│           ↓                  ↓                              │
│  Finalize Order      Hold Expires                          │
│  - Decrement stock   - Release reserved                    │
│  - Release reserved  - Mark as expired                     │
│  - Mark as paid                                            │
│                                                               │
│  Background Job (every 60 seconds)                          │
│      ↓                                                        │
│  Find holds with expiresAt < now                           │
│      ↓                                                        │
│  Release reserved stock                                     │
│      ↓                                                        │
│  Mark order as expired                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Troubleshooting

**Problem**: Products show reservedQuantity = 2 for 2 days

**Diagnosis:**
```bash
# 1. Check if background job is running
curl http://localhost:5000/api/payments/hold-expiry-job-health

# 2. Check if there are expired holds
# In MongoDB:
db.orders.find({ status: "hold", expiresAt: { $lte: new Date() } }).count()
```

**Solution:**
```bash
# If job is not running or secondsSinceLastRun > 70:
# Restart the server

# If there are stuck reservations:
npm run cleanup:reservations

# Check server logs for errors in hold expiry job
```

### Prevention

The system is designed to be self-healing:
- ✅ Background job runs every 60 seconds
- ✅ Runs immediately on startup
- ✅ Uses atomic operations to prevent race conditions
- ✅ Handles null/undefined reservedQuantity gracefully
- ✅ Health check endpoint for monitoring
- ✅ Manual cleanup script for emergencies

**Best Practices:**
1. Monitor the health check endpoint in your monitoring system (Datadog, New Relic, etc.)
2. Set up alerts if `secondsSinceLastRun > 120` or `errors > 0`
3. Run cleanup script after deployments
4. Check for stuck reservations weekly
