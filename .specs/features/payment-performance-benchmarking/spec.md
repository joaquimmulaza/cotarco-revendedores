# Spec: Payment Performance Benchmarking

## Goal
Identify the cause of delays in generating entity/reference codes during checkout to prioritize optimizations.

## Tasks
- **Execution Timers**: Add millisecond-precision logging at the start and end of the AppyPay API call.
- **Log Enrichment**: Capture environmental data (API time, Network time, DB time).
- **Report**: Generate a summary of average latency.

## Technical Details

### Backend (Laravel)
- **Service**: `App\Services\AppyPayService@createCharge`.
- **Implementation**: 
    - Use `hrtime(true)` or `microtime(true)`.
    - Log results to a dedicated `performance.log` channel or standard log with prefix.

### Frontend (React)
- **Monitoring**: Log the time from `createPayment` request to `merchantTransactionId` receipt.

## Verification Plan
- **Analysis**: Run 10-20 test checkouts and analyze the log averages.
- **Goal**: Isolate whether the delay is in `AppyPayService` or `CreateAppyPayChargeJob` queue orchestration.
