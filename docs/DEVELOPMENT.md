# Developer guide

Setup, financial calculations, API reference, and deployment for Tally.

[← Project overview](../README.md)

## Run the full stack

Use Node.js 20+ and Python 3.10+. The repository retains its React Scripts build and Python API architecture.

```bash
# From the repository root
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt

# Start the API in this terminal
cd backend
TALLY_DEV=1 .venv/bin/python app.py
```

In another terminal:

```bash
cd frontend
npm ci
npm start
```

The frontend runs on port **3000**, the API on **5000**. Creating an account starts a separate, empty ledger. Signup retains the original account fields (name, email, phone, and date of birth) for schema compatibility.

`TALLY_DEV=1` generates a random, process-local signing key. For persistent sessions and all deployed environments, configure a strong `SECRET_KEY` instead. Environment templates are in [backend/.env.example](../backend/.env.example) and [frontend/.env.example](../frontend/.env.example). The backend reads process environment variables; it does not automatically load `.env` files.

## How the numbers work

- **Available** = recorded income − recorded expenses, including savings transfers. This is a ledger balance for the selected month, not a bank balance.
- **Spending** excludes savings transfers. Savings appear as their own metric.
- **Budget targets** = recorded monthly income × the chosen percentage. Allocations must total exactly 100%.
- **Recurring estimates** require the same normalized merchant and category in different months, 25–35 calendar days apart. The next charge is estimated one calendar month after the most recent entry, clamped to the next month’s end. Older, overdue patterns drop out. This is deterministic inference, not bank data or an AI claim.
- **Forecast** starts with recorded income and outflows, adds unrecorded recurring estimates due this month, and projects remaining variable spending from the elapsed daily average. Recorded future charges are counted once and future variable entries reduce the amount still projected. No future income is invented. The scenario changes only unrecorded future variable spending.
- Frontend aggregates use integer cents. API validation and summary arithmetic use Python `Decimal` with rounding at money boundaries. The legacy floating-point database column remains compatible with existing records; an integer-cents migration is a documented next step.

## Architecture

```text
frontend/src/
├── contexts/AuthContext.js       Account session and safe cache recovery
├── services/api.js               Authenticated API adapter
├── lib/
│   ├── finance.js                Pure accounting, recurrence, forecast, CSV logic
│   └── demo.js                   Seed generation and validated local persistence
└── workspace/
    ├── Workspace.js              Navigation, shortcuts, dialogs, month state
    ├── useLedger.js              Shared data source; demo / account separation
    ├── Overview.js + Charts.js    Financial overview and visualizations
    ├── Views.js                  Transactions, budgets, recurring, forecast
    ├── Dialogs.js                Entry editing, budget settings, search
    └── AuthPage.js               Account entry points

backend/
├── app.py                        Flask routes, models, validation, auth
└── tests/test_api.py              Isolated API regression suite
```

One ledger feeds all views. Account writes are committed to the interface only after the server succeeds. Mutation responses are bound to their originating session, so late requests cannot repopulate the demo after logout. Concurrent completed mutations merge into the latest ledger state.

## Verification

```bash
# Frontend accounting and async data-isolation tests
cd frontend
CI=true npm test -- --watchAll=false --runInBand --watchman=false
npm run build

# Backend tests
cd ../backend
.venv/bin/python -m unittest discover -s tests -v
```

The backend suite creates a temporary SQLite database; it never touches your working `budget.db`. Tests exercise account isolation, auth failures, validation, atomic failed writes, normalized email login, partial-update classification, decimal arithmetic, date filtering, and JSON error responses. Frontend tests cover recurrence timing, planned-charge deduplication, scenario calculations, CSV formula escaping, corrupt demo recovery, persistent edits, and async session races.

[GitHub Actions](../.github/workflows/ci.yml) runs the frontend tests/build and backend tests on pushes and pull requests. See [verification notes](VERIFICATION.md) for scope and limitations.

## API

Protected endpoints require `Authorization: Bearer <token>`. Tokens expire after 24 hours.

| Method       | Endpoint           | Purpose                                |
| ------------ | ------------------ | -------------------------------------- |
| GET          | `/api/health`      | API health                             |
| POST         | `/api/auth/signup` | Create account and settings atomically |
| POST         | `/api/auth/login`  | Authenticate                           |
| GET / POST   | `/api/entries`     | List / create owned entries            |
| PUT / DELETE | `/api/entries/:id` | Update / delete an owned entry         |
| GET          | `/api/summary`     | Monthly or all-history summary         |
| GET / PUT    | `/api/settings`    | Read / update owned allocations        |

List and summary endpoints accept `?month=9&year=2026`. Invalid or incomplete month filters return `400`, rather than silently returning all history. All API errors are JSON. Unknown API routes return `404`.

```json
{
  "description": "Trader Joe’s",
  "amount": 64.83,
  "category": "Groceries",
  "date": "2026-09-05",
  "type": "expense",
  "expense_category": "need"
}
```

Amounts must be positive, finite numbers with at most two decimal places. Valid types are `income` and `expense`; expense allocations are `need`, `want`, or `saving`. Income entries have no expense allocation. Partial updates preserve omitted fields.

## Deployment

Build the frontend with `npm run build` from `frontend/`. The Flask application serves `frontend/build` and the API from the same origin.

Configure `SECRET_KEY` and a persistent `DATABASE_URL` (PostgreSQL is supported), then start from `backend/`:

```bash
gunicorn --bind 0.0.0.0:5000 --workers 2 app:app
```

When deploying to a provider that supplies a port, use that port in the bind address. For a separately hosted frontend, set `REACT_APP_API_URL` before building and configure the backend’s comma-separated `ALLOWED_ORIGINS` to include that frontend’s exact origin. Never put server secrets in `REACT_APP_*` variables.

The included [Dockerfile](../Dockerfile) builds the frontend and serves the complete application through Gunicorn. Persist the database externally; the container’s default SQLite file is ephemeral.

This revamp has not replaced the old public deployment. Flask requires a Python hosting runtime; publishing only the React bundle does not deploy account persistence.

## Deliberate boundaries

Tally is an independent portfolio project, with no Ramp affiliation. It does not connect to banks, move money, cancel subscriptions, or claim financial advice. Recurrence and forecasting are transparent estimates.

Before handling real customer financial data, the next work is account recovery and verification, rate limiting, a managed secret/session policy, HTTP-only cookie sessions, audited database migrations, an integer-cents storage migration, and modernization of the inherited React Scripts toolchain. The current account schema also retains phone and birth-date fields; a migration should remove these unnecessary fields. See the [case study](CASE_STUDY.md) for the reasoning behind the current scope.
