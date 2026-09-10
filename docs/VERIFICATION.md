# Verification

## Last verified

- 23 frontend tests passed across financial logic, dialogs/filtering, and data-adapter suites.
- 13 backend tests passed against a temporary SQLite database.
- Optimized production build passed.
- The updated API started under Gunicorn 26.2.0 and returned a successful health response.
- Compatible npm updates reduced reported advisories from 62 (including 2 critical) to 30 (9 low, 7 moderate, 14 high), concentrated in the inherited React Scripts build/test/development dependency tree. No forced breaking upgrade was applied.
- Flask, Flask-CORS, PyJWT, Werkzeug, and Gunicorn were upgraded to verified patched releases and the API suite was rerun.

## Automated scope

- **API:** Temporary SQLite, two accounts, owned-record reads and writes, immutable ownership, expired/malformed JWTs, malformed JSON, invalid money and dates, partial edits, atomic validation failures, exact summary arithmetic, normalized login, monthly filtering, deletion, and JSON errors.
- **Frontend financial logic:** Cents, savings separation, prototype-named categories, monthly recurrence evidence, morning/evening consistency, charges due today, month-end clamping, future-charge deduplication, variable-spending scenarios, completed months, CSV escaping, seed dates, and corrupt local storage.
- **Data adapter:** Late responses after logout, concurrent mutations completing out of order, and local demo persistence without account requests.
- **Dialog/filter interactions:** Edit classification preservation, failed-save feedback, invalid allocation prevention, visible-label command search, and spending-only history drilldowns.
- **Build:** Production compilation includes React/JSX and lint checks.

## Commands

```bash
cd frontend
CI=true npm test -- --watchAll=false --runInBand --watchman=false
npm run build
```

```bash
cd backend
.venv/bin/python -m unittest discover -s tests -v
```

The `--watchman=false` option keeps one-shot CI tests independent of a machine’s Watchman daemon.

## Limits

Automated checks do not establish visual perfection or production security certification. This implementation has source-level responsive and accessibility review. The README includes actual demo screenshots of Overview and Forecast; the forecast slider was exercised while capturing its example. These captures are not a comprehensive browser test. Automated browser interaction suites, screenshot comparisons, and assistive-technology testing have not been performed.

Useful browser acceptance checks before public launch:

1. Review Overview, Transactions, Budgets, Recurring, Forecast, login, and signup at desktop and narrow mobile widths.
2. Complete create/edit/delete, search/filter/export, allocation edits, recurrence evidence, scenario slider, and reset flows.
3. Verify keyboard navigation, focus return, mobile menu dismissal, native dialog focus trapping, reduced motion, and 200% text enlargement.
4. Test live account creation, sign-in, session expiry, network errors, and empty accounts against the deployment environment.
5. Run dependency audits and address remaining inherited build-tool advisories before deployment.
