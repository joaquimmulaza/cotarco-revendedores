# Spec: Admin Product Editing

## Goal
Allow administrators to update product information (name, description, category) directly from the management list.

## Features
- **Edit Modal**: A pop-up form in the product list.
- **API Sync**: Save changes and refresh the list without a page reload.

## Technical Details

### Backend (Laravel)
- **Controller**: `App\Http\Controllers\Admin\AdminController@updateProduct`.
- **Validation**: Ensure name is unique/required, category exists.

### Frontend (React)
- **Component**: Update `src/components/admin/ProductListViewer.jsx`.
- **Features**: "Edit" button that opens a modal with a form.
- **Styles**: Use premium design system components.

## Verification Plan
- **TDD (PHPUnit)**: `AdminProductTest` covering successful update and validation errors.
- **Manual**: Edit a product and verify changes persist after page refresh.
