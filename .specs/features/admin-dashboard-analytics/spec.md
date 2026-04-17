# Spec: Admin Dashboard Analytics

## Goal
Provide administrators with a real-time overview of the business performance.

## Features
- **Total Revenue**: Sum of all `total_amount` for orders with status `paid`.
- **Order Count**: Number of confirmed orders.
- **AOV (Average Order Value)**: Revenue divided by total orders.

## Technical Details

### Backend (Laravel)
- **Controller**: `App\Http\Controllers\Admin\AdminController@getDashboardStats`.
- **Logic**: 
    - Query `Order::where('status', 'paid')`.
    - Use `sum()`, `count()`, and math for AOV.

### Frontend (React)
- **Component**: `src/components/admin/MetricsGrid.jsx`.
- **UI**: Premium data cards with trends (if possible) and vivid colors from design tokens.

## Verification Plan
- **TDD (PHPUnit)**: `AdminDashboardTest` with mock data for various order statuses.
- **Manual**: Verify numbers match database records in a staging environment.
