# Spec: Partner Profile Management

## Goal
Allow Distributors and Resellers to manage their own identity and branding within the platform.

## Features
- **Edit Personal Data**: Name and contact info.
- **Edit Company Data**: Company name and phone number.
- **Company Logo**: Upload a logo that appears in the dashboard and (potentially) in future invoices.

## Technical Details

### Backend (Laravel)
- **Model**: `App\Models\PartnerProfile` (update to add `logo_path`).
- **Migrations**: Add `logo_path` (string, nullable) to `partner_profiles`.
- **Controller**: `App\Http\Controllers\Api\PartnerProfileController@update`.
- **Validation**:
    - `company_name`: string, max 255.
    - `phone_number`: string, max 20.
    - `logo`: image, max 2MB.

### Frontend (React)
- **Page**: `src/pages/ProfileSettings.jsx`.
- **UI**: Modern form with glassmorphism/premium design tokens.
- **Interactions**: Immediate feedback on upload success/fail.

## Verification Plan
- **TDD (PHPUnit)**: `PartnerProfileTest` covering update and file storage validation.
- **Manual**: Verify logo persistence and display in header.
