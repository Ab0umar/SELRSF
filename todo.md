# SELRS Accounting App - TODO

## Completed Features
- [x] Remove OneDrive sync functionality
- [x] Create Khazina screen with year tabs (2024, 2025, 2026)
- [x] Display Khazina transactions in list format
- [x] Add local file sync selection for Khazina
- [x] Create Sulf (Advances) screen
- [x] Display Sulf data with totals
- [x] Add local file sync selection for Sulf
- [x] Create Qard (Loans) screen
- [x] Display Qard data with totals
- [x] Add local file sync selection for Qard
- [x] Create Settings screen with app info
- [x] Update tab navigation with proper icons
- [x] Fix TypeScript errors (Date type handling)
- [x] SELRS branding and logo integration

## In Progress
- [ ] Implement CSV parsing for Khazina auto-sync
- [ ] Implement CSV parsing for Sulf auto-sync
- [ ] Implement CSV parsing for Qard auto-sync
- [ ] Add duplicate prevention logic on import
- [ ] Test auto-sync on app launch

## Pending Features
- [ ] Add/Edit/Delete functionality for Khazina
- [ ] Add/Edit/Delete functionality for Sulf
- [ ] Add/Edit/Delete functionality for Qard (already has UI, needs API)
- [ ] Summary tab for each sheet with export
- [ ] Excel export functionality
- [ ] Date picker for easier date input
- [ ] Validation for all forms
- [ ] Error handling improvements

## Testing
- [ ] Test CSV import with user's files
- [ ] Test auto-sync on app launch
- [ ] Test duplicate prevention
- [ ] Test all CRUD operations
- [ ] Test on Android and iOS devices

## New User Request: Add CRUD Operations
- [x] Add update and delete API endpoints for Khazina
- [x] Add update and delete API endpoints for Sulf
- [x] Add update and delete API endpoints for Qard
- [x] Implement Add/Edit modal UI for Khazina
- [x] Implement Add/Edit modal UI for Sulf
- [x] Implement Add/Edit modal UI for Qard
- [x] Add delete confirmation dialogs for all sheets
- [x] Test all CRUD operations

## New User Request: PDF Export Functionality
- [x] Install expo-print and expo-sharing packages
- [x] Create PDF generation utility with Arabic support
- [x] Add PDF export button to Khazina screen
- [x] Add PDF export button to Sulf screen
- [x] Add PDF export button to Qard screen
- [x] Test PDF generation and sharing

## Bug Report: File Import Not Working
- [x] Investigate CSV import failure in Khazina screen
- [x] Investigate CSV import failure in Sulf screen
- [x] Investigate CSV import failure in Qard screen
- [x] Fix CSV parsing logic
- [x] Test import with sample files

## New User Request: Auto-Sync on App Open
- [x] Add auto-sync toggle to settings screen
- [x] Implement auto-sync for Khazina on screen mount
- [x] Implement auto-sync for Sulf on screen mount
- [x] Implement auto-sync for Qard on screen mount
- [ ] Add last sync timestamp display (optional)
- [x] Test auto-sync functionality

## New User Request: Convert to Fully Offline App
- [x] Create AsyncStorage utility for offline data management
- [x] Remove tRPC/API dependencies from Khazina screen
- [x] Remove tRPC/API dependencies from Sulf screen
- [x] Remove tRPC/API dependencies from Qard screen
- [x] Update all CRUD operations to use AsyncStorage
- [x] Test all features work offline
- [ ] Remove unused backend dependencies (optional cleanup)

## New User Request: Add Search Functionality
- [x] Add search input field to Khazina screen
- [x] Implement search filter logic for Khazina (date, notes, amounts)
- [x] Add search input field to Sulf screen
- [x] Implement search filter logic for Sulf (name, date, notes)
- [x] Add search input field to Qard screen
- [x] Implement search filter logic for Qard (name, date, notes)
- [x] Test search functionality on all screens

## Bug Fix: Excel Import Column Mapping
- [x] Fix Khazina import to match actual columns (الإجمالي، الرصيد، ID، الايراد، المصروف، التاريخ، ملاحظات)
- [x] Fix Sulf import to match actual columns (ID، الاسم، التاريخ، سداد، سلفه، ملاحظات، الاجمالي)
- [x] Fix Qard import to match actual columns (ID، الاسم، المبلغ، سداد، التاريخ، ملاحظات، المتبقي)
- [x] Handle Excel date serial numbers (convert to readable dates)
- [ ] Test import with actual exported files
- [ ] Add automatic OneDrive file discovery

## Bug: Excel Date Conversion
- [x] Fix Excel serial number to date conversion (e.g., 45566 → 2024-09-15)
- [x] Test with actual data files

## Bug: Import Duplicates Data
- [x] Fix import to clear existing data before adding new data
- [x] Update Khazina import handler
- [x] Update Sulf import handler
- [x] Update Qard import handler

## New Feature: API Server with Static IP
- [ ] Create Node.js API server to read/write Access database
- [ ] Add endpoints for Khazina (GET, POST, PUT, DELETE)
- [ ] Add endpoints for Sulf (GET, POST, PUT, DELETE)
- [ ] Add endpoints for Qard (GET, POST, PUT, DELETE)
- [ ] Add authentication (username/password)
- [ ] Create installation package for Windows
- [ ] Write setup documentation
- [ ] Modify app to connect to API (http://41.199.252.107:3000)
- [ ] Rename app to "SELRS"
- [ ] Test complete workflow

## Settings Screen - API Integration UI
- [x] Add Settings tab to tab navigation with gear icon
- [x] Create Settings screen with API mode toggle switch
- [x] Add server URL configuration input field
- [x] Add login button and authentication UI
- [x] Show connection status indicator (connected/disconnected)
- [x] Display last sync timestamp
- [x] Add logout functionality
- [x] Update all screens (Khazina, Sulf, Qard) to import from hybrid-storage instead of offline-storage
- [ ] Test API connection from mobile app to Windows server

## Bug Fix: Bait and InstaPay Tab Redesign
- [x] Update BaitItem type to match Sulf/Qard structure (name, advance, payment, date, notes)
- [x] Update InstapayItem type to match Sulf/Qard structure (name, advance, payment, date, notes)
- [x] Redesign Bait tab with summary cards (Total, Paid, Remaining)
- [x] Redesign InstaPay tab with summary cards (Total, Paid, Remaining)
- [x] Add search functionality to both tabs
- [x] Implement proper transaction list display
- [x] Add edit and delete functionality for each transaction
- [x] Integrate server sync for Bait and InstaPay
- [ ] Test data display and CRUD operations on both tabs
- [ ] Verify sync with Python server

## Server Update Tasks
- [x] Review and update Bait endpoints in server-lets-encrypt.py
- [x] Review and update InstaPay endpoints in server-lets-encrypt.py
- [x] Add error handling and data validation for all endpoints
- [x] Update Access database schema for Bait table (الاسم, التاريخ, الاجمالي, احمالي منه, ملاحظات)
- [x] Update Access database schema for InstaPay table (الاسم, التاريخ, الاجمالي, احمالي منه, ملاحظات)
- [ ] Test server endpoints with new data structure
- [ ] Verify sync between app and server

## Khazina Screen Redesign
- [x] Add summary cards (الإيرادات, المصروفات, الرصيد) like Sulf and Qard
- [x] Improve search functionality to include date, amount, and notes
- [x] Add proper formatting for numbers (toLocaleString)
- [x] Improve transaction list display with better styling
- [x] Keep year selector and file sync functionality
- [ ] Test summary card calculations with filtered data
- [ ] Verify sync with server for Khazina data

## Add Server Sync Button to All Tabs
- [x] Import baitApi and instapayApi in hybrid-storage
- [x] Add API-enabled getBaitItems function
- [x] Add API-enabled createBaitItem function
- [x] Add API-enabled updateBaitItem function
- [x] Add API-enabled deleteBaitItem function
- [x] Add API-enabled getInstapayItems function
- [x] Add API-enabled createInstapayItem function
- [x] Add API-enabled updateInstapayItem function
- [x] Add API-enabled deleteInstapayItem function
- [ ] Test Bait and InstaPay sync with server
- [ ] Verify data loads correctly from API

## Add Manual Refresh Button to All Tabs
- [x] Add refresh button to Khazina tab header
- [x] Add refresh button to Sulf tab header
- [x] Add refresh button to Qard tab header
- [x] Add refresh button to Bait tab header
- [x] Add refresh button to InstaPay tab header
- [x] Implement refresh functionality that reloads data from server
- [x] Add loading indicator during refresh (button opacity changes)
- [ ] Test refresh on all tabs with API mode enabled

## Add Error Logging with Toast Messages
- [x] Create toast notification component
- [x] Add error handling in refresh button functions
- [x] Show sync errors in toast messages
- [ ] Test error messages on all tabs

## Fix Monthly Summary and RTL Support
- [x] Fix monthly summary date parsing in index.tsx (convert DD-MM-YYYY to YYYY-MM-DD)
- [x] Enable RTL (Right-to-Left) in app.config.ts for iOS and Android
- [x] Add I18nManager.forceRTL(true) in app/_layout.tsx
- [x] Configure web RTL with htmlElement.dir and lang attributes
- [x] Add RTL styles to global.css
- [x] Test monthly summary calculation with current month data
- [x] Verify RTL layout on all screens

## Fix All TypeScript Errors - COMPLETED
- [x] Create BaitItem and InstapayItem interfaces in api-client.ts
- [x] Update Bait and InstaPay API to use correct types with معاه and منه fields
- [x] Fix Timeout type errors in server-sync.ts and server-sync-service.ts
- [x] Fix revenue property references in khazina.tsx (use income instead)
- [x] Add missing state variables (isImporting, syncFilePath) to bait.tsx and instapay.tsx
- [x] Fix clearKhazinaItems call to pass selectedYear parameter
- [x] Fix router.push type error in index.tsx
- [x] Remove invalid config properties from app.config.ts
- [x] Monthly summary now shows only Khazina data
- [x] All TypeScript errors resolved (0 errors)
