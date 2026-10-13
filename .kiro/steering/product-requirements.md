---
name: Product Requirements
description: Core product vision, features, and user roles for the Offline-First Multi-Tenant POS & Retail Inventory System
inclusion: always
---

# Product Requirements Document (PRD)
**Project:** Offline-First Multi-Tenant POS & Retail Inventory System

## 1. Product Vision
An integrated, web-based, and mobile-responsive system to manage end-to-end retail operations. Designed for high performance, accurate Cost of Goods Sold (COGS) tracking, and operational resilience during internet outages (offline-first).

## 2. Target Users (Role-Based Access)
*   **Cashier:** Accesses the Point of Sale (POS) module using a fast 4-6 digit PIN login.
*   **Store Manager / Admin:** Manages inbound goods, stock opname (inventory counting), and FEFO (First Expired, First Out) batch management.
*   **Owner / Stakeholder:** Accesses financial reports, gross profit margins, and multi-branch analytics.

## 3. Core Features
### 3.1. Inbound & Pricing
*   **Barcode Scanning:** Support for scanning SKUs during goods receipt.
*   **Pricing Management:** Input COGS upon receiving goods. System assists in calculating selling prices and managing discounts/promotions.
*   **Batch Tracking:** Record supplier details and manufacturing batches.

### 3.2. Inventory Management
*   **Real-time Deduction:** Cloud inventory updates in real-time when online.
*   **Mobile Stock Opname:** Progressive Web App (PWA) capability allowing admins to use smartphone cameras to scan and adjust physical stock in the aisles.
*   **Low Stock Alerts:** Notifications when items hit the reorder point.

### 3.3. Expiry Management (FEFO)
*   **Expiry Tracking:** Mandatory expiry date input for perishable goods batches.
*   **FEFO System:** The system automatically tracks and deducts from the batch with the closest expiry date.
*   **Early Warnings & Auto-Block:** Dashboards for items expiring in 7/14/30 days. The POS automatically blocks scanning if all available batches have expired.

### 3.4. POS Outbound (Cashier)
*   **High-Speed Scanning:** Keyboard emulation support for physical barcode scanners with instant auto-complete fallback.
*   **Cart Management:** Support for changing quantities, voiding items (requires Admin PIN), and holding transactions to serve the next customer.
*   **Multi-Payment:** Support for Cash (with auto-change calculation), QRIS, and Debit/Credit cards.
*   **Offline Tolerance:** The POS allows stock to go negative locally during an internet outage to prevent queue bottlenecks.

### 3.5. Reporting & Analytics
*   **Gross Profit Report:** Accurate COGS calculation based on specific FEFO batch deductions.
*   **Shift Reports:** End-of-day blind-close reconciliation (Expected Cash vs. Physical Cash).
