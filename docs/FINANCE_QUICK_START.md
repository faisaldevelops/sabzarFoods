# Finance Module - Quick Start Guide

## Setup (One-Time Configuration)

### Step 1: Configure Product BOM

For each product, define its recipe:

**Example: Organic Honey 500g**

1. Go to: **Admin Dashboard → Finance / Costing → Product BOM**
2. Select Product: "Organic Honey 500g"
3. Add components:

| Component | Quantity per Unit | Description |
|-----------|-------------------|-------------|
| Glass Jar | 1 | 500ml glass jar |
| Metal Lid | 1 | Twist-off lid |
| Label | 1 | Front label with branding |
| Raw Honey | 0.5 | kg of raw honey |
| Cardboard Box | 1 | Individual packaging box |

Click "Save Component" after each entry.

## Day-to-Day Operations

### Recording Expenses (When You Buy Inventory)

**Scenario 1: Sayib buys 200 glass jars**

1. Go to: **Admin Dashboard → Finance / Costing → Add Expense**
2. Fill in:
   - Product: Organic Honey 500g
   - Component: Glass Jar
   - Quantity Purchased: 200
   - Total Cost: ₹10,000
   - Paid By: Sayib
   - Date: (today's date is pre-filled)
3. Click "Add Expense"
4. Done! ✅ (Takes 10 seconds)

**Scenario 2: Faisal buys raw honey in bulk**

1. Go to: **Admin Dashboard → Finance / Costing → Add Expense**
2. Fill in:
   - Product: Organic Honey 500g
   - Component: Raw Honey
   - Quantity Purchased: 50 (kg)
   - Total Cost: ₹25,000
   - Paid By: Faisal
   - Date: (today's date)
3. Click "Add Expense"

**Scenario 3: Company account pays for labels**

1. Same process, but set "Paid By: Company"

### Checking Profitability

1. Go to: **Admin Dashboard → Finance / Costing → Dashboard**
2. You'll see:

```
┌─────────────────────────────────────────────────────┐
│              FINANCE DASHBOARD                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Total Revenue: ₹85,000    Recovered Expenses: ₹42,000  │
│  Locked Inventory: ₹18,000    Net Profit: ₹43,000      │
│                                                     │
├─────────────────────────────────────────────────────┤
│              PROFIT SPLIT                           │
├─────────────────────────────────────────────────────┤
│  Dawood (70%): ₹30,100                             │
│  Sayib & Faisal (30%): ₹12,900                     │
└─────────────────────────────────────────────────────┘
```

3. Product-wise breakdown shows:
   - How many units sold
   - Revenue per product
   - Cost per unit
   - COGS (recovered expenses)
   - Locked inventory cost (unsold stock)
   - Profit per product

## Month-End Review

1. Go to Dashboard
2. Set date range: 
   - Start Date: 2024-01-01
   - End Date: 2024-01-31
3. Click "Apply"
4. Review metrics
5. Click "Export CSV" for records
6. Share profit split amounts with partners

## Example Walkthrough

### Complete Flow: From Purchase to Profit

**Day 1: Initial Purchases**
```
Sayib buys:
- 100 jars @ ₹10,000
- 100 lids @ ₹3,000
- 100 labels @ ₹2,000

Faisal buys:
- 50kg honey @ ₹25,000
- 100 boxes @ ₹5,000

Total Expenses: ₹45,000
```

**Day 2: Sales (Automatic)**
```
10 customers buy "Organic Honey 500g" @ ₹800 each
Total Revenue: ₹8,000
```

**Dashboard Shows:**
```
Cost per unit calculation:
- Jar: ₹10,000 / 100 = ₹100
- Lid: ₹3,000 / 100 = ₹30
- Label: ₹2,000 / 100 = ₹20
- Honey: ₹25,000 / 50kg × 0.5kg = ₹250
- Box: ₹5,000 / 100 = ₹50
Cost per unit = ₹450

Sales: 10 units
Revenue: 10 × ₹800 = ₹8,000
COGS: 10 × ₹450 = ₹4,500 (recovered)
Locked Inventory: ₹45,000 - ₹4,500 = ₹40,500 (for 90 unsold units)

Net Profit: ₹8,000 - ₹4,500 = ₹3,500

Profit Split:
- Dawood: ₹2,450
- Sayib & Faisal: ₹1,050
```

**Interpretation:**
- You made ₹3,500 profit
- You still have ₹40,500 locked in unsold inventory
- When more units sell, more costs will be recovered

## Tips

### For Efficient Entry
- Use suggested values from dropdown (Jar, Lid, Label, etc.)
- Product selection remembers last choice
- "Paid By" remembers for quick re-entry
- Date defaults to today

### For Accurate Costing
- Enter expenses as soon as you make purchases
- Keep BOM up-to-date when recipes change
- Review "Locked Inventory Cost" - this shows capital tied up
- Warning icon (⚠️) appears if BOM is incomplete

### Understanding Locked Inventory Cost
- This is NOT a loss - it's your investment in stock
- As units sell, this cost moves to "Recovered Expenses"
- High locked cost = lots of unsold inventory = more working capital needed
- Low locked cost = inventory is moving fast = healthy cash flow

## Common Questions

**Q: Why can't I enter sales manually?**
A: Sales are automatically captured from completed orders. This ensures accuracy and saves time.

**Q: What if I make a mistake in expense entry?**
A: Delete the wrong entry and create a new one.

**Q: Can I see who paid for what?**
A: Yes, the expense list shows "Paid By" for each entry.

**Q: What if product recipe changes?**
A: Update the BOM. Future cost calculations will use the new recipe.

**Q: Why is my cost per unit showing ₹0?**
A: Either BOM is not configured, or no expenses have been entered for the components yet.

## Support Scenarios

### "I just bought 500 jars, how do I record this?"
→ Finance → Add Expense → Select product → Component: "Jar" → Quantity: 500 → Total Cost: (what you paid) → Submit

### "How much profit did we make last month?"
→ Finance → Dashboard → Set date range to last month → Check "Net Profit" and "Profit Split"

### "What's my locked inventory cost?"
→ Finance → Dashboard → Look at "Locked Inventory Cost" card (orange) - this is money in unsold stock

### "I want to analyze data in Excel"
→ Finance → Dashboard → Click "Export CSV" → Open in Excel

---

## Interface Overview

### Tab Navigation
```
┌──────────────────────────────────────────────────┐
│  [Dashboard] [Add Expense] [Product BOM]         │
└──────────────────────────────────────────────────┘
```

### Dashboard Tab
- Summary cards (Revenue, COGS, Locked Cost, Profit)
- Profit split section
- Product-wise table
- Monthly trend
- Date filters
- Export button

### Add Expense Tab
- Simple form with dropdowns and suggestions
- Real-time cost-per-unit calculation
- One-click submit

### Product BOM Tab
- Product selector
- Add component form
- Existing BOM table with delete option
- Help text explaining BOM concept

---

That's it! The system is designed to minimize manual work while giving you accurate profit insights based on actual inventory movement. 🎉
