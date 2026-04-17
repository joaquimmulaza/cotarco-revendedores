# Spec: Stock Destination Routing

## Goal
Simplify stock management for administrators by allowing a single file upload to target both B2B and B2C pricing models.

## Features
- **"BOTH" Target**: A new option in the upload destination dropdown.
- **Bulk Processing**: Update both pricing tables from the same source file.

## Technical Details

### Backend (Laravel)
- **Model**: `App\Models\StockFile` (Update enum/validation for `target_business_model`).
- **Job**: `App\Jobs\ProcessStockFileJob`.
- **Logic**: If target is `BOTH`, iterate the processing logic for both B2B and B2C price columns.

### Frontend (React)
- **Component**: Update `src/components/StockFileManager.jsx`.
- **UI**: Add "Both (B2B + B2C)" to the destination dropdown.

## Verification Plan
- **TDD (PHPUnit)**: `StockRoutingTest` verifying that prices for both models are updated after a "Both" upload.
- **Manual**: Upload a file targeting both and verify product prices in the database for both segments.
