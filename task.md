# Task List: Unified Sidebar & UI Refactor

## Phase 0: Foundations (Sidebar & Layouts) [TDD + Stitch]
- [x] **Infrastructure Setup**
  - [x] Add `sidebar` component via `npx shadcn@latest add sidebar`
  - [x] Verify dependencies: `lucide-react`, `collapsible`, `next-themes`
- [x] **TDD Baseline**
  - [x] Create `tests/e2e/sidebar.spec.js` (Role-based assertions)
  - [x] Create `tests/e2e/admin-sidebar.spec.js` (Admin-specific items)
  - [x] Run tests (Expect Failure)
- [x] **UI Generation (Google Stitch)**
  - [x] Generate `AdminSidebar` (Desktop + Mobile Sheet)
  - [x] Generate `PartnerSidebar` (Desktop + Mobile Sheet)
  - [x] Implement `Layout` wrappers (Admin & Partner)
- [x] **Integration & Persistence**
  - [x] Wrap routes in `App.jsx`
  - [x] Implement `localStorage` state persistence for `isCollapsed`
  - [x] Implement Logo fallback (Initials/Skeleton) in Sidebar Header (Task 2)
  - [x] Run Baseline tests (Goal: **GREEN**)

## Phase 1: Feature Integration (Admin Dashboard)
- [ ] Implement Task 6: Revenue/Orders/AOV Metrics (Admin Dashboard)
- [ ] Implement Task 7: Product List & Inline Editing
- [ ] Implement Task 9: Partner Rejection Modal with custom reason
- [ ] Implement Task 10: Stock Upload Routing ("BOTH" destination)

## Phase 2: Feature Integration (Partner Dashboard)
- [ ] Implement Task 1 & 2: Profile Page & Logo Upload
- [ ] Implement Task 3: Partner Order History View
- [ ] Implement Task 4: Order Attribute UI (Checkout/Details)

## Phase 3: Performance & Polish
- [ ] Implement Task 8: Performance logging for Payment references
- [ ] Implement Task 5: Admin Profile Management page
- [ ] Final E2E Regression run
