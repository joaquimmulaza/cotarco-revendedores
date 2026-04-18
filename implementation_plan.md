# Cotarco: Unified UI Refactor & Feature Roadmap

This plan integrates the **Premium Sidebar Refactor** as the foundational gateway for all platform operations, ensuring a consistent and state-of-the-art experience for both Administrators and Partners.

## User Review Required

> [!IMPORTANT]
> **TDD-First Enforcement**: No UI code will be written until Playwright E2E tests are passing in an empty/skeleton state.
> **Stitch MCP Requirement**: All UI components (Sidebars, Cards, Modals) must be generated via Stitch to ensure consistency with the design tokens.
> **Mobile vs Desktop**: Sidebars must implement a responsive pattern (Sheet/Drawer on mobile) as per the project context.

## Proposed Changes

### Phase 0: Foundational UI Refactor (Architecture & Sidebar)
*Baseline for all subsequent tasks.*

#### [NEW] [Sidebar Layout Spec](file:///c:/cotarco-revendedores/.specs/features/sidebar-layout-refactor/spec.md)
- Define structure for `AdminSidebar` and `PartnerSidebar`.
- Identify dependencies (Radix UI Sidebar, Lucide Icons, Framer Motion).

#### [NEW] [AdminLayout](file:///c:/cotarco-revendedores/cotarco-client/src/components/layouts/AdminLayout.jsx) & [PartnerLayout](file:///c:/cotarco-revendedores/cotarco-client/src/components/layouts/PartnerLayout.jsx)
- Compose these layouts using Stitch-generated Sidebar components.
- Implement responsive behavior (Mobile Drawer).

#### [MODIFY] [App.jsx](file:///c:/cotarco-revendedores/cotarco-client/src/App.jsx)
- Refactor routing to use Layout wrappers for protected sections.

---

### Phase 1: Core Business Logic (Admin & Partner)

#### [MODIFY] Tasks 1-10 Implementation
- Each task will now be implemented into the views accessed via the new Sidebars.
- **Task 6 (Metrics)**, **Task 7 (Product Edit)**, and **Task 9 (Rejection Reason)** will be prioritized for Admin.
- **Tasks 1-4** will be prioritized for Partners.

---

## Technical Workflow (The "TDD + Stitch" Loop)

For every UI component/page:
1. **Spec**: Define requirements in `.specs/features/`.
2. **Test**: Write E2E test in `tests/e2e/` following `E2E_TEST_ARCHITECTURE_v2.md`.
3. **Draft**: Run `npx playwright test` (Expect Failure).
4. **Design**: Use `stitch.generate_screen_from_text` (Desktop & Mobile).
5. **Implement**: Convert Stitch output to React components.
6. **Verify**: Ensure tests go **GREEN**.

## Open Questions (Resolved)

- **Logo Placement**: Feature the logo (Task 2) in both the **Sidebar Header** and **Profile Page**.
- **Collapsible State**: Implementation will support `collapsible="icon"`. 
- **Persistence**: SideBar state will be persisted in `localStorage`.

## Verification Plan

### Automated Tests
- `npm run test:e2e` (Playwright):
  - Assert Sidebar visibility and role-based items.
  - Assert Expanded/Collapsed visual states (checking for label visibility).
  - Assert highlight behavior for `activeLink` in both states.
  - Assert state persistence after page reload via `localStorage`.


### Manual Verification
- Testing the sidebar "Drawer" behavior on mobile viewports.
- Verifying the "ActiveLink" highlighting in the sidebar as the user navigates.
