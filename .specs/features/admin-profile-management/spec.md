# Spec: Admin Profile Management

## Goal
Allow administrators to manage their own account details.

## Features
- **Update Profile**: Change name and email.
- **Security**: Change password (out of scope for now, but a placeholder).

## Technical Details

### Backend (Laravel)
- **Controller**: `App\Http\Controllers\Admin\AdminController@updateOwnProfile`.
- **Logic**: Use standard Laravel validation for `name` and `email`.

### Frontend (React)
- **Page**: `src/pages/Admin/Settings.jsx`.
- **UI**: Side-nav based settings page with high-quality form components.

## Verification Plan
- **TDD (PHPUnit)**: `AdminProfileTest`.
- **Manual**: Update name and check if it reflects in the layout header.
