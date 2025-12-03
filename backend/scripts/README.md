# Backend Scripts

## Cleanup Stuck Reservations

### Purpose
This script fixes products that have `reservedQuantity > 0` for extended periods (e.g., 2 days). This can happen if:

1. **Server was down** - Hold expiry job didn't run while server was stopped
2. **Payment webhook failed** - Payment succeeded but webhook didn't trigger stock finalization
3. **Database inconsistency** - Manual database edits or migration issues

### How to Run

```bash
# Option 1: Using npm script (recommended)
npm run cleanup:reservations

# Option 2: Direct node execution
node backend/scripts/cleanupStuckReservations.js
```

**Prerequisites:** Make sure you have installed dependencies with `npm install`

### What It Does

1. **Finds stale holds** - Locates all hold/expired/cancelled orders that should have been cleaned up
2. **Releases reserved stock** - Decrements `reservedQuantity` for products in those orders
3. **Updates order status** - Marks hold orders as expired
4. **Reconciles reservations** - For each product with reservations, calculates expected reserved quantity from active holds and corrects any mismatches

### Output Example

```
Starting cleanup of stuck reservations...
Found 5 stale hold/expired/cancelled orders
Processing order 64a1b2c3d4e5f6a7b8c9d0e1 (status: hold)
  - Released 2 units of product 64a1b2c3d4e5f6a7b8c9d0e2 (new reserved: 0)
  - Updated order status to expired

Found 3 products with reservedQuantity > 0

Product 64a1b2c3d4e5f6a7b8c9d0e2 (Premium Organic Tomatoes):
  - Current reservedQuantity: 2
  - Expected from active holds: 0
  - Active holds: 0
  - Correcting...
  ✓ Corrected to 0

✅ Cleanup completed successfully!
```

### When to Run

- **After server downtime** - If the server was stopped for more than 15 minutes
- **If you notice stuck reservations** - Products showing reserved quantities but no active checkouts
- **After deployment** - As a precautionary measure after major updates
- **Periodically** - Run weekly/monthly as maintenance

### Automatic Prevention

The server now runs a more aggressive cleanup on startup to catch expired holds from downtime. The background job runs every 60 seconds to release expired holds automatically.

### Safety

This script is **safe to run multiple times** - it only releases reservations for:
- Orders that have already expired
- Orders already marked as cancelled or expired
- Products where calculated reserved quantity doesn't match active holds

It will **never affect**:
- Active hold orders (not yet expired)
- Paid orders
- Actual stock quantities
