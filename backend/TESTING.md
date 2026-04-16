# Backend Testing Guide

This document explains how to run backend unit tests, what is covered, and how the test strategy works.

## Requirements

- Node.js installed
- Backend dependencies installed:

```bash
cd backend
npm install
```

## Run tests

Run all backend unit tests:

```bash
npm test
```

This uses the script from `backend/package.json`:

```json
"test": "vitest run"
```

## Current test files

- `src/services/auth.service.test.ts`
- `src/services/category.service.test.ts`
- `src/services/task.service.test.ts`

## What is being tested

### AuthService

File: `src/services/auth.service.ts`

- `register(nombre, email, password)`
  - Hashes password with bcrypt
  - Inserts user with `pool.query`
  - Returns created row
  - Error propagation (hash/db failures)
- `login(email, password)`
  - User lookup by email
  - Password comparison
  - JWT generation
  - Correct response shape
  - Error paths (missing user, wrong password, db/compare failures)
- `validateToken(token)`
  - Returns payload when valid
  - Maps verify failures to `Token inválido o expirado`

### CategoryManager

File: `src/services/category.service.ts`

- `isValidColorHex`
  - Accept/reject hex formats
- `createCategory`
  - Uses provided color
  - Uses default color if omitted
- `getCategoriesByUser`
  - Executes ordered query and returns rows
- `deleteCategory`
  - Returns boolean based on `rowCount`

### TaskService

File: `src/services/task.service.ts`

- Helper behavior
  - `isValidEstado`
  - `storageBasenameFromPublicUrl`
- Core flows
  - `createTask` with category deduplication and ownership checks
  - `getTasksByUser` relation normalization (`archivos`/`categorias`)
  - `updateTaskStatus` invalid-state rejection
  - `assignCategory` not-found and created paths
  - `setCategories` transaction flow (`BEGIN`/`COMMIT`/`ROLLBACK`)

## How the tests work (architecture)

All tests are unit tests and **mock external dependencies**:

- Database (`pool.query`) is mocked.
- Crypto/JWT libs (`bcrypt`, `jsonwebtoken`) are mocked in Auth tests.

This means:

- Tests are fast and deterministic.
- No real DB, hashing, or JWT signing is performed during test execution.
- We validate service logic, branch behavior, and query contract (arguments/flow).

## Mocking pattern used

Each test file uses `vi.mock(...)` to replace modules:

- `../db/pool.js`
- `bcrypt` (Auth tests)
- `jsonwebtoken` (Auth tests)

Then tests control outcomes with:

- `mockResolvedValueOnce(...)`
- `mockRejectedValueOnce(...)`
- call assertions (`toHaveBeenCalledWith`, call counts, etc.)

## Recommended test conventions

- Keep one `describe` block per method group.
- Cover:
  - success path
  - validation/business-rule failures
  - dependency failures
- Prefer small fixture objects reused across tests.
- Clear mocks in `beforeEach()` to avoid state leakage.

## Troubleshooting

- If tests fail after query changes, update expected SQL fragment assertions.
- If TypeScript typing complains on mocks, use `vi.mocked(...)` references consistently.
- If a new service behavior is added, add at least:
  - 1 success test
  - 1 validation/error-path test

