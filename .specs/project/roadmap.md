# Cotarco Project Roadmap

This document summarizes the 10 pending tasks and their associated specifications.

## Executive Summary
The roadmap focuses on three pillars: **Partner Empowerment**, **Admin Operational Excellence**, and **System Quality/Performance**.

## Task List & Execution Order

### Priority 1: Admin & High Impact
1.  **[Admin Dashboard Metrics](file:///c:/cotarco-revendedores/.specs/features/admin-dashboard-analytics/spec.md)**: Real-time calculation of Revenue, Orders, and AOV.
2.  **[Admin Product Editing](file:///c:/cotarco-revendedores/.specs/features/admin-product-editing/spec.md)**: UI/API for managing product details directly.
3.  **[Payment Performance Benchmark](file:///c:/cotarco-revendedores/.specs/features/payment-performance-benchmarking/spec.md)**: Technical audit of AppyPay reference generation latency.

### Priority 2: Partner Experience
4.  **[Partner Profile Management](file:///c:/cotarco-revendedores/.specs/features/partner-profile-management/spec.md)**: Editing personal and company data.
5.  **[Company Logo Upload](file:///c:/cotarco-revendedores/.specs/features/partner-profile-management/spec.md)**: Branding for distributors.
6.  **[Partner Order History](file:///c:/cotarco-revendedores/.specs/features/partner-order-history/spec.md)**: Visibility into past purchases.

### Priority 3: Data Fidelity & Processes
7.  **[Order Attribute Tracking](file:///c:/cotarco-revendedores/.specs/features/order-attribute-tracking/spec.md)**: Capturing variants (Color, Capacity) in orders/invoices.
8.  **[Partner Rejection Feedback](file:///c:/cotarco-revendedores/.specs/features/partner-rejection-feedback/spec.md)**: Custom messaging for rejected applications.
9.  **[Stock Destination Routing](file:///c:/cotarco-revendedores/.specs/features/stock-destination-routing/spec.md)**: Handling "BOTH" destinations for stock files.

### Priority 4: Housekeeping
10. **[Admin Profile Management](file:///c:/cotarco-revendedores/.specs/features/admin-profile-management/spec.md)**: Admin self-service data updates.

---

## Technical Context
- **Frameworks**: Laravel 12.x + React 19 + Vite.
- **Tools**: TDD mandatory, Stitch for UI, AppyPay for payments.
- **Specs Directory**: `.specs/features/[feature-name]/spec.md`
