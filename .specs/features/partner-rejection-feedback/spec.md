# Spec: Partner Rejection Feedback

## Goal
Improve the onboarding experience by providing clear, custom reasons why a partner application was rejected.

## Features
- **Rejection Reason**: Admin provides a text message during rejection.
- **Dynamic Email**: The `PartnerRejected` email displays this message.

## Technical Details

### Backend (Laravel)
- **Controller**: `App\Http\Controllers\Admin\PartnerController@updateStatus`.
- **Logic**: Ensure `reason` is validated and passed to the `PartnerRejected` Mailable.
- **Mail**: Update `App\Mail\PartnerRejected` to accept the reason in the constructor and view.

### Frontend (React)
- **Component**: Update rejection modal in `PartnerManager.jsx`.
- **UI**: Add a textarea for the "Rejection Reason".

## Verification Plan
- **TDD (PHPUnit)**: `PartnerRejectionTest` verifying that the mail content contains the reason.
- **Manual**: Reject a test partner and inspect the "Mailtrap" or log output.
