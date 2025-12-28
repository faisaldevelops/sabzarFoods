# Finance / Costing Module

## Overview

This module implements an **inventory-based cost accounting system** for the ecommerce platform. It automatically tracks expenses, calculates costs only when inventory sells, and provides profit calculations with partner splits.

## Key Concepts

### Inventory-Based Costing
Unlike traditional expense tracking where costs are recorded immediately:
- **Expenses are treated as inventory purchases**, not immediate costs
- **Costs are recovered ONLY when units sell** (COGS = Cost of Goods Sold)
- **Unsold inventory cost automatically carries forward** to future periods
- This accurately reflects the locked capital in unsold inventory

### Bill of Materials (BOM)
Each product has a recipe (BOM) that defines:
- What components are needed (jars, lids, labels, raw materials, etc.)
- How much of each component goes into one sellable unit
- This allows automatic cost-per-unit calculation based on component prices

## Features

### 1. Expense Management
**Purpose**: Track all inventory purchases (NOT sales - those are automatic)

**What to enter**:
- Product (which product this expense is for)
- Component (jar, lid, label, raw honey, etc.)
- Quantity purchased
- Total cost
- Who paid for it (Dawood, Sayib, Faisal, etc.)
- Date of expense

**Example**:
```
Product: Organic Honey 500g
Component: Glass Jar
Quantity: 100 jars
Total Cost: ₹5,000
Paid By: Sayib
Date: 2024-01-15
```

### 2. Bill of Materials (BOM)
**Purpose**: Define the recipe for each product

**Example BOM for "Organic Honey 500g"**:
- Glass Jar: 1 unit per product
- Lid: 1 unit per product
- Label: 1 unit per product
- Raw Honey: 0.5 kg per product
- Packaging Box: 1 unit per product

### 3. Finance Dashboard
**Automatic calculations**:
- **Total Revenue**: Automatically captured from paid orders
- **Cost Per Unit**: Calculated from BOM + expense data
- **COGS (Cost of Goods Sold)**: Only for units actually sold
- **Locked Inventory Cost**: Expenses not yet recovered (unsold inventory)
- **Net Profit**: Revenue - COGS
- **Profit Split**: 70% Dawood, 30% Sayib & Faisal

**Views**:
- Summary cards with key metrics
- Product-wise breakdown showing cost, revenue, and profit per product
- Monthly profit trend
- Date range filtering
- CSV export

## How It Works

### Cost Calculation Flow

1. **You buy components**:
   ```
   Buy 100 jars for ₹5,000
   Buy 100 lids for ₹2,000
   Buy 50kg raw honey for ₹20,000
   Total Expenses: ₹27,000
   ```

2. **BOM defines recipe**:
   ```
   1 product needs:
   - 1 jar
   - 1 lid  
   - 0.5kg honey
   ```

3. **System calculates cost per unit**:
   ```
   Jar cost: ₹5,000 / 100 = ₹50
   Lid cost: ₹2,000 / 100 = ₹20
   Honey cost: ₹20,000 / 50kg = ₹400/kg × 0.5kg = ₹200
   
   Cost per unit = ₹50 + ₹20 + ₹200 = ₹270
   ```

4. **Customer buys 40 units**:
   ```
   Revenue: 40 × ₹500 = ₹20,000
   COGS: 40 × ₹270 = ₹10,800 (recovered expense)
   Locked Cost: ₹27,000 - ₹10,800 = ₹16,200 (unsold inventory)
   Profit: ₹20,000 - ₹10,800 = ₹9,200
   ```

5. **Profit split**:
   ```
   Dawood (70%): ₹6,440
   Sayib & Faisal (30%): ₹2,760
   ```

## API Endpoints

### Expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses` - Get all expenses (with filters)
- `GET /api/expenses/:id` - Get single expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary` - Get expense summary by product

### BOM (Bill of Materials)
- `POST /api/bom` - Create/Update BOM entry
- `GET /api/bom` - Get all BOM entries
- `GET /api/bom/product/:productId` - Get BOM for specific product
- `DELETE /api/bom/:id` - Delete BOM entry
- `DELETE /api/bom/product/:productId` - Delete all BOM for product

### Finance Dashboard
- `GET /api/finance/dashboard` - Get complete finance dashboard data
- `GET /api/finance/product/:productId` - Get detailed costing for specific product
- `GET /api/finance/export/csv` - Export finance report as CSV
- `GET /api/finance/trends/monthly` - Get monthly profit trend

### Query Parameters
All finance endpoints support:
- `startDate` - Filter by start date (ISO format)
- `endDate` - Filter by end date (ISO format)
- `productId` - Filter by specific product

## Usage Guide

### For Day-to-Day Operations

1. **When you buy inventory components**:
   - Go to Admin Dashboard → Finance / Costing → Add Expense
   - Fill in what you bought and who paid
   - Submit (takes 10 seconds)

2. **When you set up a new product**:
   - Go to Admin Dashboard → Finance / Costing → Product BOM
   - Select the product
   - Add each component and specify how much is needed per unit
   - Save

3. **To check profitability**:
   - Go to Admin Dashboard → Finance / Costing → Dashboard
   - View real-time profit, costs, and splits
   - Filter by date range if needed
   - Export to CSV for external analysis

### For Month-End Review

1. Set date range to the month
2. Check:
   - Total revenue (from sales)
   - Recovered expenses (COGS)
   - Locked inventory cost (capital tied up)
   - Net profit
   - Each partner's share
3. Export CSV for records

## Important Notes

### ✅ DO
- Enter expenses when you buy inventory
- Configure BOM for each product
- Review locked inventory costs regularly
- Use date filters to analyze specific periods

### ❌ DON'T
- Don't manually enter sales (automatic from orders)
- Don't worry about "when to expense" - system handles it
- Don't delete BOM entries unless recipe changed
- Don't delete expenses unless it was entered wrong

## Technical Details

### Models

**Expense**:
```javascript
{
  product: ObjectId (ref: Product),
  component: String,
  quantityPurchased: Number,
  totalCost: Number,
  paidBy: String,
  expenseDate: Date,
  timestamps: true
}
```

**ProductBOM**:
```javascript
{
  product: ObjectId (ref: Product),
  component: String,
  quantityPerUnit: Number,
  description: String,
  timestamps: true,
  unique: [product, component]
}
```

### Key Algorithms

**Cost Per Unit Calculation**:
1. Get all BOM entries for product
2. For each component in BOM:
   - Get all expenses for that component
   - Calculate average cost per component unit
   - Multiply by quantity needed per product
3. Sum all component costs

**COGS Calculation**:
```
COGS = Quantity Sold × Cost Per Unit
```

**Locked Inventory Cost**:
```
Locked Cost = Total Expenses - COGS
```

**Profit Calculation**:
```
Net Profit = Revenue - COGS
Dawood Share = Net Profit × 0.70
Others Share = Net Profit × 0.30
```

## Security

- All finance endpoints require admin authentication
- Uses existing middleware: `protectRoute` and `adminRoute`
- No public access to financial data

## Future Enhancements

Potential additions:
- [ ] Support for waste/damaged inventory
- [ ] Multi-currency support
- [ ] Component-level stock tracking
- [ ] Predictive inventory needs based on sales velocity
- [ ] Integration with accounting software
- [ ] Mobile-friendly expense entry app
- [ ] Receipt photo upload

## Support

For questions or issues:
1. Check this documentation
2. Review the code comments in controllers
3. Test with sample data first
4. Contact the development team

---

**Remember**: This system gives you accurate profit numbers because it only counts costs when inventory sells. Your locked inventory cost tells you how much capital is tied up in unsold stock - this is valuable information for business decisions!
