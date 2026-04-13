# Testing Infrastructure

## Seeding Endpoints

To support deterministic and fast end-to-end tests, a few special endpoints have been added to the backend. These endpoints bypass standard validations (e.g., file uploads, email verifications) and allow tests to directly manipulate the database state.

**CRITICAL:** These endpoints are strictly guarded and will only be registered when the application environment is set to `testing` (`APP_ENV=testing`). In any other environment (e.g., `production`, `local`, `staging`), these routes will return a `404 Not Found`.

### `POST /api/testing/seed-partner`

Creates a partner record directly in the database with a specified initial status.

**Payload (JSON):**
- `name`: string (required)
- `email`: string (required, unique)
- `initial_status`: string (required). Valid values: `'pending_email_validation'`, `'pending_approval'`, `'active'`.

**Returns:**
- `201 Created` with the created user object `{ id, name, email, status }`

### `DELETE /api/testing/seed-partner/:id`

Hard deletes a previously seeded partner from the database along with associated profiles to clean up state after tests.

**Path Parameters:**
- `id`: integer (required) - The user ID to delete.

**Returns:**
- `204 No Content`
- `404 Not Found` if the user ID does not exist.
