# Spec: Partner Order History

## Goal
Provide transparency to partners regarding their purchase history and order status.

## Features
- **Order List**: Overview of all orders placed by the authenticated partner.
- **Order Detail**: Line items, payment reference, and delivery status.

## Technical Details

### Backend (Laravel)
- **Model**: `App\Models\Order`.
- **Controller**: `App\Http\Controllers\OrderController@index`.
- **Logic**: 
    - Paginated list of orders where `user_id == auth()->id()`.
    - Include `items`.

### Frontend (React)
- **Page**: `src/pages/Orders.jsx`.
- **UI**: Clean table or list with status badges (Pending, Paid, Delivered).
- **Interactions**: Click to view full details.

## Verification Plan
- **TDD (PHPUnit)**: `OrderHistoryTest` ensuring users only see their own orders.
- **Manual**: Create an order and verify it appears in the list.
