# Cotarco Project Roadmap

This document summarizes the pending tasks, organized into a logical execution flow centered around the new Sidebar UI architecture.

## Executive Summary
The roadmap is now focused on a **UI-First Refactor**, establishing a premium Sidebar layout for both Admin and Distributor roles, followed by the implementation of 10 core business features.

## Task List & Execution Order

### Phase 1: Foundational UI Refactor (Stitch + TDD)
0.  **[Sidebar Architecture Refactor](file:///c:/cotarco-revendedores/.specs/features/sidebar-layout-refactor/spec.md)**: (NEW) Premium Sidebar for Admin/Partner using `shadcn/ui`. *Baseline for all other tasks.*

### Phase 2: Admin Operational Excellence
1.  **[Admin Dashboard Metrics](file:///c:/cotarco-revendedores/.specs/features/admin-dashboard-analytics/spec.md)**: Real-time calculation of Revenue, Orders, and AOV.
2.  **[Admin Product Editing](file:///c:/cotarco-revendedores/.specs/features/admin-product-editing/spec.md)**: UI/API for managing product details directly.
3.  **[Partner Rejection Feedback](file:///c:/cotarco-revendedores/.specs/features/partner-rejection-feedback/spec.md)**: Custom messaging for rejected applications.
4.  **[Stock Destination Routing](file:///c:/cotarco-revendedores/.specs/features/stock-destination-routing/spec.md)**: Handling "BOTH" destinations for stock files.

### Phase 3: Partner Experience & Orders
5.  **[Partner Profile & Company Logo](file:///c:/cotarco-revendedores/.specs/features/partner-profile-management/spec.md)**: Self-service identity and branding.
6.  **[Partner Order History](file:///c:/cotarco-revendedores/.specs/features/partner-order-history/spec.md)**: Visibility into past purchases.
7.  **[Order Attribute Tracking](file:///c:/cotarco-revendedores/.specs/features/order-attribute-tracking/spec.md)**: Capturing variants (Color, Capacity) in orders/invoices.

### Phase 4: Systems & Housekeeping
8.  **[Payment Performance Benchmark](file:///c:/cotarco-revendedores/.specs/features/payment-performance-benchmarking/spec.md)**: Audit of AppyPay reference generation latency.
9.  **[Admin Profile Management](file:///c:/cotarco-revendedores/.specs/features/admin-profile-management/spec.md)**: Admin self-service account updates.

---

## Technical Context
- **Frameworks**: Laravel 12.x + React 19 + Vite.
- **Tools**: TDD mandatory, Stitch for UI, AppyPay for payments.
- **Spec Repository**: All features are documented in `.specs/features/[feature-name]/spec.md`.
- **E2E Strategy**: Playwright tests must pass (Green) before any component implementation.
