# Sales Center Accounting App - Design Document

## Overview
A mobile app for sales center staff to manage income and expenses. The app connects to an existing Microsoft Access database and provides intuitive screens for viewing, editing, and entering financial records.

## Screen List

1. **Dashboard** - Overview of financial summary
2. **Transactions List** - View all income/expense records
3. **Transaction Detail** - View or edit a single transaction
4. **Add Transaction** - Form to enter new income or expense
5. **Reports** - Summary reports by year (2024, 2025, 2026)
6. **Settings** - App configuration and database sync

## Primary Content and Functionality

### Dashboard Screen
- **Content**: Financial summary cards showing:
  - Total Income (الايراد)
  - Total Expense (المصروف)
  - Current Balance (الرصيد)
  - Total (الاجمالي)
- **Functionality**: 
  - Display summary for current year
  - Quick access to add transaction button
  - Tap to view detailed reports

### Transactions List Screen
- **Content**: Scrollable list of all transactions with:
  - Date (التاريخ)
  - Type (Income/Expense)
  - Amount
  - Notes (ملاحظات)
  - Employee name (if applicable)
- **Functionality**:
  - Filter by year (2024, 2025, 2026)
  - Search by employee or date
  - Tap to view/edit transaction
  - Swipe to delete (with confirmation)

### Transaction Detail Screen
- **Content**: Full transaction details in edit mode:
  - Date picker
  - Income/Expense amount fields
  - Employee dropdown
  - Notes text area
  - Calculated total
- **Functionality**:
  - Edit and save changes
  - Delete transaction
  - Cancel without saving

### Add Transaction Screen
- **Content**: Form fields for new transaction:
  - Date (default: today)
  - Type selector (Income/Expense)
  - Amount input
  - Employee selector
  - Notes
  - Category (if applicable)
- **Functionality**:
  - Validate required fields
  - Save to database
  - Show success/error message
  - Return to list

### Reports Screen
- **Content**: Summary reports by year:
  - Year selector (tabs or dropdown)
  - Monthly breakdown
  - Summary statistics
  - Charts (optional)
- **Functionality**:
  - Switch between years
  - Export or share reports

### Settings Screen
- **Content**: App configuration:
  - Database connection status
  - Sync options
  - About app
- **Functionality**:
  - Manual sync trigger
  - Clear cache
  - App version info

## Key User Flows

### Flow 1: View and Edit Transaction
1. User opens app → Dashboard
2. Taps "View All Transactions" → Transactions List
3. Taps a transaction → Transaction Detail (read-only initially)
4. Taps "Edit" button → Edit mode enabled
5. Modifies fields and taps "Save"
6. Returns to list with updated data

### Flow 2: Add New Transaction
1. User taps "Add Transaction" button (from Dashboard or List)
2. Add Transaction form opens
3. Fills in date, type, amount, employee, notes
4. Taps "Save"
5. Success message shown
6. Returns to list with new transaction visible

### Flow 3: View Reports
1. User taps "Reports" tab
2. Selects year from tabs (2024, 2025, 2026)
3. Views monthly summary and totals
4. Can export or share report

## Color Choices

- **Primary**: #0a7ea4 (Teal/Blue) - Used for buttons, headers, highlights
- **Background**: #ffffff (Light) / #151718 (Dark)
- **Surface**: #f5f5f5 (Light) / #1e2022 (Dark) - Cards, input fields
- **Foreground**: #11181C (Light) / #ECEDEE (Dark) - Primary text
- **Muted**: #687076 (Light) / #9BA1A6 (Dark) - Secondary text
- **Success**: #22C55E - Income, positive values
- **Error**: #EF4444 - Expense, negative values, delete actions
- **Border**: #E5E7EB (Light) / #334155 (Dark) - Dividers, borders

## Data Model

### Transaction Table
- ID (primary key)
- التاريخ (Date)
- الايراد (Income amount)
- المصروف (Expense amount)
- الاجمالي (Total)
- الرصيد (Balance)
- ملاحظات (Notes)
- الموظف (Employee name)
- Year (2024, 2025, 2026)

### Employee Table
- ID (primary key)
- اسم الموظف (Employee name)

## Navigation Structure

```
Tab 1: Dashboard
  ├─ Dashboard Screen
  └─ Reports Screen

Tab 2: Transactions
  ├─ Transactions List
  ├─ Transaction Detail
  └─ Add Transaction

Tab 3: Settings
  └─ Settings Screen
```

## Responsive Design Notes

- All screens designed for portrait orientation (9:16)
- One-handed usage: important buttons positioned in lower half
- Tab bar at bottom for easy thumb access
- Scrollable content for lists and forms
- Touch targets minimum 44x44 points
- Safe area respected for notch/home indicator
