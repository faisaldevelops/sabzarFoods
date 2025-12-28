# Finance Module - System Flow Diagram

## Overview Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FINANCE / COSTING SYSTEM                     │
│                  (Inventory-Based Accounting)                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐      ┌─────────────────┐      ┌──────────────┐
│   DATA INPUTS   │      │   CALCULATIONS  │      │   OUTPUTS    │
└─────────────────┘      └─────────────────┘      └──────────────┘
```

## Detailed Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. CONFIGURATION (One-Time Setup)                                    │
└──────────────────────────────────────────────────────────────────────┘

   Admin → Product BOM Configuration
   
   ┌────────────────────────────────────┐
   │ Product: Organic Honey 500g        │
   ├────────────────────────────────────┤
   │ Component    │ Qty per Unit        │
   ├──────────────┼─────────────────────┤
   │ Glass Jar    │ 1                   │
   │ Metal Lid    │ 1                   │
   │ Label        │ 1                   │
   │ Raw Honey    │ 0.5 kg              │
   │ Box          │ 1                   │
   └────────────────────────────────────┘
   
        ↓
   [Stored in ProductBOM collection]


┌──────────────────────────────────────────────────────────────────────┐
│ 2. EXPENSE ENTRY (Day-to-Day Operations)                             │
└──────────────────────────────────────────────────────────────────────┘

   Admin Enters Purchase:
   
   ┌────────────────────────────────────┐
   │ Expense Entry Form                 │
   ├────────────────────────────────────┤
   │ Product: Organic Honey 500g        │
   │ Component: Glass Jar               │
   │ Quantity: 100 jars                 │
   │ Total Cost: ₹10,000                │
   │ Paid By: Sayib                     │
   │ Date: 2024-01-15                   │
   └────────────────────────────────────┘
   
        ↓
   [Stored in Expense collection]
   [NOT expensed yet - treated as inventory]


┌──────────────────────────────────────────────────────────────────────┐
│ 3. SALES (Automatic - No Manual Entry)                               │
└──────────────────────────────────────────────────────────────────────┘

   Customer Completes Order:
   
   Order Status: "paid" ──→ [Automatically captured]
   
   ┌────────────────────────────────────┐
   │ Order Data (Existing System)       │
   ├────────────────────────────────────┤
   │ Product: Organic Honey 500g        │
   │ Quantity: 3 units                  │
   │ Price: ₹800 per unit               │
   │ Total: ₹2,400                      │
   │ Date: 2024-01-20                   │
   └────────────────────────────────────┘
   
        ↓
   [Read from Order collection]


┌──────────────────────────────────────────────────────────────────────┐
│ 4. COST CALCULATION ENGINE                                           │
└──────────────────────────────────────────────────────────────────────┘

   Step A: Calculate Cost per Component Unit
   ┌────────────────────────────────────────────────────────────┐
   │ Component: Glass Jar                                       │
   │ All expenses: 100 jars @ ₹10,000 + 50 jars @ ₹6,000       │
   │ Total: 150 jars for ₹16,000                               │
   │ Cost per jar = ₹16,000 / 150 = ₹106.67                   │
   └────────────────────────────────────────────────────────────┘

   Step B: Calculate Cost per Product Unit (Using BOM)
   ┌────────────────────────────────────────────────────────────┐
   │ Component        │ Qty Needed │ Cost/Unit │ Total         │
   ├──────────────────┼────────────┼───────────┼───────────────┤
   │ Glass Jar        │ 1          │ ₹106.67   │ ₹106.67       │
   │ Metal Lid        │ 1          │ ₹30.00    │ ₹30.00        │
   │ Label            │ 1          │ ₹25.00    │ ₹25.00        │
   │ Raw Honey        │ 0.5 kg     │ ₹500/kg   │ ₹250.00       │
   │ Box              │ 1          │ ₹50.00    │ ₹50.00        │
   ├──────────────────┴────────────┴───────────┼───────────────┤
   │ COST PER UNIT                              │ ₹461.67       │
   └────────────────────────────────────────────┴───────────────┘

   Step C: Calculate COGS (Only for Sold Units)
   ┌────────────────────────────────────────────────────────────┐
   │ Units Sold: 40                                            │
   │ Cost per Unit: ₹461.67                                    │
   │ COGS = 40 × ₹461.67 = ₹18,467                           │
   │ (This is the RECOVERED expense)                           │
   └────────────────────────────────────────────────────────────┘

   Step D: Calculate Locked Inventory Cost
   ┌────────────────────────────────────────────────────────────┐
   │ Total Expenses Paid: ₹50,000                             │
   │ Recovered via Sales (COGS): ₹18,467                      │
   │ Locked in Inventory: ₹50,000 - ₹18,467 = ₹31,533       │
   │ (This represents 68 unsold units worth of components)     │
   └────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│ 5. PROFIT CALCULATION                                                │
└──────────────────────────────────────────────────────────────────────┘

   ┌────────────────────────────────────────────────────────────┐
   │ Revenue (40 units @ ₹800):              ₹32,000          │
   │ Less: COGS (40 units @ ₹461.67):       -₹18,467         │
   │ ───────────────────────────────────────────────────       │
   │ NET PROFIT:                              ₹13,533          │
   │                                                            │
   │ Profit Split:                                             │
   │ • Dawood (70%):                          ₹9,473          │
   │ • Sayib & Faisal (30%):                  ₹4,060          │
   └────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│ 6. DASHBOARD DISPLAY                                                 │
└──────────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────┐
   │                    FINANCE DASHBOARD                        │
   ├─────────────────────────────────────────────────────────────┤
   │                                                             │
   │  ╔══════════════╗  ╔══════════════╗  ╔══════════════╗     │
   │  ║ Total Revenue║  ║  Recovered   ║  ║   Locked     ║     │
   │  ║   ₹32,000    ║  ║   Expenses   ║  ║  Inventory   ║     │
   │  ║              ║  ║   ₹18,467    ║  ║   ₹31,533    ║     │
   │  ╚══════════════╝  ╚══════════════╝  ╚══════════════╝     │
   │                                                             │
   │  ╔══════════════╗                                          │
   │  ║  Net Profit  ║                                          │
   │  ║   ₹13,533    ║                                          │
   │  ╚══════════════╝                                          │
   │                                                             │
   ├─────────────────────────────────────────────────────────────┤
   │ Profit Split (Net Profit: ₹13,533)                         │
   ├─────────────────────────────────────────────────────────────┤
   │ Dawood (70%):           ₹9,473                             │
   │ Sayib & Faisal (30%):   ₹4,060                             │
   ├─────────────────────────────────────────────────────────────┤
   │ Product-wise Breakdown                                      │
   ├─────────────────────────────────────────────────────────────┤
   │ Product          │ Sold │ Revenue │ COGS    │ Profit       │
   │ Honey 500g       │ 40   │ ₹32,000 │ ₹18,467 │ ₹13,533     │
   │ Pickle 250g      │ 0    │ ₹0      │ ₹0      │ ₹0          │
   └─────────────────────────────────────────────────────────────┘
```

## Data Model Relationships

```
┌──────────────┐
│   Product    │
│  (Existing)  │
└──────┬───────┘
       │
       │ Referenced by
       ├─────────────────────────┐
       │                         │
       ↓                         ↓
┌──────────────┐         ┌──────────────┐
│ ProductBOM   │         │   Expense    │
├──────────────┤         ├──────────────┤
│ product_id   │         │ product_id   │
│ component    │         │ component    │
│ qty_per_unit │         │ qty_purchased│
│ description  │         │ total_cost   │
└──────────────┘         │ paid_by      │
                         │ expense_date │
                         └──────────────┘
       │                         │
       │                         │
       └─────────┬───────────────┘
                 │
                 ↓
          ┌──────────────┐
          │   Finance    │
          │ Calculations │
          └──────────────┘
                 │
                 ↓
          ┌──────────────┐
          │  Dashboard   │
          │   Display    │
          └──────────────┘
```

## Timeline Example

```
Time ────────────────────────────────────────────────────────────────→

Day 1: Purchase Inventory
├─ Buy 100 jars (₹10,000)
├─ Buy 50kg honey (₹25,000)
└─ Total Expenses: ₹35,000
   Locked Cost: ₹35,000 ◄── All capital locked in inventory
   Recovered: ₹0

Day 7: First Sales (20 units)
├─ Revenue: ₹16,000
├─ COGS: ₹9,234 ◄────────── Expenses now "recovered"
└─ Profit: ₹6,766
   Locked Cost: ₹25,766 ◄── 80 units still in inventory
   Recovered: ₹9,234

Day 14: More Sales (30 units)
├─ Revenue: ₹24,000
├─ COGS: ₹13,851
└─ Profit: ₹10,149
   Locked Cost: ₹11,915 ◄── 50 units still in inventory
   Recovered: ₹23,085

Day 30: All Sold (50 remaining units)
├─ Revenue: ₹40,000
├─ COGS: ₹23,085
└─ Profit: ₹16,915
   Locked Cost: ₹0 ◄────── All inventory sold
   Recovered: ₹35,000 ◄─── All expenses recovered
```

## Key Insights from Flow

1. **Expenses → Inventory → COGS**: Expenses start as locked inventory, become COGS only when sold

2. **Locked Cost = Working Capital**: The locked inventory cost shows how much cash is tied up

3. **Automatic Recovery**: As units sell, costs automatically move from "locked" to "recovered"

4. **Accurate Profit**: Profit only counts what actually sold, not what you bought

5. **Carry Forward**: Unsold inventory costs automatically carry to next period

This system ensures you never overstate profit by counting unsold inventory!
