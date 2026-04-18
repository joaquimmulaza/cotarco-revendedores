# Task List: Unified Sidebar & UI Refactor

## Phase 0: Foundations (Sidebar & Layouts) [TDD + Stitch]
- [ ] **Infrastructure Setup**
  - [ ] Add `sidebar` component via `npx shadcn@latest add sidebar`
  - [ ] Verify dependencies: `lucide-react`, `collapsible`, `next-themes`
- [ ] **TDD Baseline**
  - [ ] Create `tests/e2e/sidebar.spec.js` (Role-based assertions)
  - [ ] Create `tests/e2e/admin-sidebar.spec.js` (Admin-specific items)
  - [ ] Run tests (Expect Failure)
- [ ] **UI Generation (Google Stitch)**
  - [ ] Generate `AdminSidebar` (Desktop + Mobile Sheet)
  - [ ] Generate `PartnerSidebar` (Desktop + Mobile Sheet)
  - [ ] Implement `Layout` wrappers (Admin & Partner)
- [ ] **Integration & Persistence**
  - [ ] Wrap routes in `App.jsx`
  - [ ] Implement `localStorage` state persistence for `isCollapsed`
  - [ ] Implement Logo fallback (Initials/Skeleton) in Sidebar Header (Task 2)
  - [ ] Run Baseline tests (Goal: **GREEN**)

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
