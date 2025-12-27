# Label PDF Feature Documentation

## Overview
The Label PDF feature allows admins to generate printable shipping labels for orders in the "Processing" state. Labels are grouped by product name and can be filtered by delivery type (local/national), phone number, and order ID.

## Features

### 1. Product-Based Grouping
Labels are automatically organized by product name:
- Each product gets a dedicated header page
- Labels for that product follow on subsequent pages
- Products are sorted alphabetically
- Label count shown on each product header

**Example Structure:**
```
Page 1: Filter Information
Page 2: "Product A" Header (5 labels)
Page 3: Product A Labels (up to 6 per page)
Page 4: "Product B" Header (3 labels)  
Page 5: Product B Labels
...
```

### 2. Local vs National Filtering
Filter labels based on delivery type using Indian pincode logic:

**Local Deliveries (J&K Region):**
- Pincodes starting with: 180, 190, 191, 192, 193, 194
- Includes Jammu, Srinagar, Kashmir, and Ladakh regions

**National Deliveries:**
- All other Indian pincodes

**Filter Options:**
- **All Deliveries**: Shows all processing orders
- **Local (J&K)**: Only J&K region orders
- **National**: Only non-J&K orders

### 3. Applied Filters Display
The PDF header shows all active filters for reference:
```
┌──────────────────────────────────────────────────────────┐
│ Applied Filters: Status: Processing | Delivery Type:    │
│ Local | Phone: 9876543210                                │
└──────────────────────────────────────────────────────────┘
```

### 4. Processing Status Only
- Only orders with `trackingStatus: 'processing'` are included
- This ensures only orders ready for shipping get labels
- Cannot be overridden - hardcoded for safety

### 5. Quantity-Aware Labels
For orders with multiple quantities of the same product:
- Creates one label per item
- Shows "Item X of Y" on each label
- Example: Order has 3x Product A → generates 3 separate labels

## User Interface

### Admin Orders Page
Located at: Admin Panel → Orders Tab

**Filter Section:**
1. **Phone Number** (text input)
2. **Order ID** (text input)  
3. **Status** (dropdown) - affects order list, not PDF
4. **Delivery Type** (dropdown) - NEW
   - All Deliveries
   - Local (J&K)
   - National

**Action Buttons:**
- **Print All Labels**: Generates PDF with all processing orders matching filters
- **Export CSV**: Exports filtered orders to CSV
- **Print Label** (per order): Single order label

## Technical Implementation

### Backend API

**Endpoint:** `GET /api/orders/bulk-address-sheets`

**Query Parameters:**
- `phoneNumber`: Filter by customer phone number
- `publicOrderId`: Filter by specific order ID
- `deliveryType`: Filter by 'local' or 'national'
- `status`: Ignored (always uses 'processing')

**Response:** HTML page with printable labels

**Logic Flow:**
```javascript
1. Query orders with trackingStatus: 'processing'
2. Apply additional filters (phone, orderId)
3. Populate product details
4. Filter by deliveryType using getDeliveryType(address)
5. Group labels by product name
6. Generate label for each item (respecting quantity)
7. Create product header pages
8. Build filter info section
9. Return formatted HTML with CSS for printing
```

**Key Functions:**
- `getDeliveryType(address)`: Determines if address is local/national based on pincode
- `getBulkAddressSheets()`: Main controller function

### Frontend Integration

**Component:** `frontend/src/components/OrdersTab.jsx`

**Filter State:**
```javascript
{
  phoneNumber: '',
  orderId: '',
  status: 'all',      // For order list display
  deliveryType: 'all' // For PDF generation
}
```

**Print Labels Function:**
```javascript
handlePrintAllLabels() {
  // Build query params from filters
  const params = new URLSearchParams();
  if (deliveryType !== 'all') params.append('deliveryType', deliveryType);
  // ... other filters
  
  // Open in new window
  window.open(`/orders/bulk-address-sheets?${params}`, '_blank');
}
```

## Label Layout

### Individual Label
```
┌─────────────────────────────────────┐
│          Product Name               │
│        Order #ORD-12345             │
│   Date: 27/12/2024 | Item 1 of 2   │
├─────────────────────────────────────┤
│ DELIVER TO:                         │
│ Customer Name                       │
│                                     │
│ PHONE:                              │
│ 9876543210                          │
│                                     │
│ ADDRESS:                            │
│ House 123, Street Name              │
│ Near: Landmark                      │
│ City, State                         │
│ PIN: 190001                         │
└─────────────────────────────────────┘
```

### Product Header Page
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│          Product Name               │
│           15 labels                 │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Page Layout
- **6 labels per page** (3x2 grid)
- A4 page size
- Optimized for printing
- Auto-print on page load
- Page breaks between product groups

## Usage Examples

### Example 1: Print All Local Orders
1. Navigate to Admin → Orders
2. Click "Show Filters"
3. Select "Delivery Type: Local (J&K)"
4. Click "Print All Labels"
5. PDF opens with:
   - Filter info showing "Delivery Type: Local"
   - Only orders with J&K pincodes
   - Grouped by product

### Example 2: Print Specific Phone Number Orders
1. Show Filters
2. Enter phone: "9876543210"
3. Select "Delivery Type: All Deliveries"
4. Click "Print All Labels"
5. PDF shows:
   - Filter info: "Status: Processing | Phone: 9876543210"
   - All processing orders for that phone number
   - Grouped by product

### Example 3: Single Order Label
1. Find order in list
2. Click "Print Label" button on order card
3. Single page PDF opens with 1 label
4. Contains all order products (one label each)

## Edge Cases Handled

### No Orders Match Filters
- Shows friendly message: "No orders found matching the current filters"
- Prevents empty/broken PDF generation

### Deleted Products
- Shows "PRODUCT_REMOVED" as product name
- Label still generates with available order info
- Grouped under "PRODUCT_REMOVED" category

### Large Order Volumes
- Efficiently handles hundreds of orders
- Proper pagination within product groups
- Page breaks maintain 6-labels-per-page layout

### Missing Address Data
- Falls back to user data if address incomplete
- Shows "N/A" for completely missing fields
- Prevents PDF generation errors

### Multi-Item Orders
- Each item gets its own label
- Clearly marked: "Item 1 of 5", "Item 2 of 5", etc.
- All go to same address but separated for tracking

## Printing Guidelines

### Browser Print Settings
**Recommended:**
- Paper size: A4
- Orientation: Portrait
- Margins: Default or None
- Scale: 100%
- Background graphics: On

### Label Dimensions
- Each label: ~185mm x 127mm (1/6 of A4)
- Border: 2mm solid black
- Padding: 15-20mm inside
- Font sizes: 11-20px depending on element

### PDF Features
- Auto-prints on page load
- Can save as PDF before printing
- Works in all modern browsers
- Mobile-friendly viewing (print from desktop recommended)

## Configuration

### Pincode Prefixes (Backend)
File: `backend/config/pricing.yaml`
```yaml
delivery:
  localPincodePrefixes:
    - "180"  # Jammu region
    - "190"  # Srinagar/Kashmir
    - "191"  # Kashmir
    - "192"  # Kashmir
    - "193"  # Kashmir
    - "194"  # Kashmir/Ladakh
```

To add more local regions, update this configuration.

### Labels Per Page
File: `backend/controllers/orders.controller.js`
```javascript
const labelsPerPage = 6; // Change to 4, 8, etc.
```

## Future Enhancements

### Potential Improvements:
1. **Barcode Integration**: Add QR codes to labels
2. **Batch Numbers**: Group labels by batch/delivery date
3. **Carrier Integration**: Add tracking number fields
4. **Custom Templates**: Multiple label layout options
5. **Bulk Operations**: Mark orders as shipped after printing
6. **Export Options**: Save as PDF file instead of print dialog
7. **Label Sizes**: Support different label paper sizes

## Troubleshooting

### PDF Not Opening
- Check browser popup blocker
- Ensure backend server is running
- Check browser console for errors

### Wrong Orders in PDF
- Verify filter settings
- Check that orders are in "Processing" status
- Confirm deliveryType matches address pincodes

### Layout Issues When Printing
- Use Chrome/Edge for best results
- Check print preview before printing
- Ensure "Background graphics" is enabled
- Try adjusting scale to 90-100%

### Performance with Large Datasets
- Consider filtering by date range (future enhancement)
- Use phone/order ID filters to narrow results
- Contact support if generation takes >30 seconds

## Support
For issues or questions:
1. Check this documentation
2. Review test scenarios in `/docs/test_scenarios.md`
3. Check backend logs for errors
4. Contact development team

## Version History
- **v1.0** (Dec 2024): Initial release with product grouping and local/national filtering
