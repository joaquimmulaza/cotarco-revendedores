# Spec: Order Attribute Tracking

## Goal
Ensure that product variants (color, capacity) selected during checkout are correctly captured and displayed in the order history and invoice.

## Features
- **Checkout Capture**: Save specific attributes selected in the cart.
- **Order Visualization**: Display attributes in the order summary and partner dashboard.
- **Invoicing**: Pass attributes to the AppyPay payment description and internal mail notifications.

## Technical Details

### Backend (Laravel)
- **Model**: `App\Models\OrderItem`.
- **Migration**: Add `attributes` (json, nullable) to `order_items`.
- **Logic**: 
    - Update `OrderController@createPayment` to accept an `attributes` field per item.
    - Update `OrderPlacedAdmin` and `OrderPlacedCustomer` mail classes to render these attributes.

### Frontend (React)
- **CheckoutPage.jsx**: Ensure the `items` payload sent to the API includes the selected attributes.
- **UI**: Show selected variants in the cart and order confirmation.

## Verification Plan
- **TDD (PHPUnit)**: `OrderAttributeTest` validating that attributes are correctly saved in the DB.
- **Manual**: Perform a checkout with a specific color and check the database record.
