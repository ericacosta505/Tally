# Tally: from a ledger to a decision

## The problem

A conventional budget tracker answers “What did I spend?” but often leaves the next decision to the user. The original app had authentication, transaction CRUD, charts, and a configurable 50/30/20 budget. These were useful pieces, but the experience felt like a collection of forms.

The redesign connects those pieces into a single journey: understand a number, inspect its source, make a change, and see the result elsewhere in the product.

## Product direction

Tally is personal finance with the rigor of a spend-management workspace. Its name and tally-mark identity connect the product to the act of accounting. Ink typography, chartreuse highlights, restrained ledger lines, and clear chart labels give the interface a recognizable system. Color distinguishes allocations and status without replacing text labels.

The overview opens directly on useful data. There is no signup wall in front of the portfolio experience. The demo is labeled throughout, uses credible sample activity, and persists locally. A real account starts empty; demonstration records never enter an authenticated ledger.

## Why these features

**Connected financial views.** Every metric, budget, table, recurring estimate, and forecast comes from the same transaction source. This makes a corrected transaction consequential across the experience.

**Evidence, not mystery.** Recurring insights expose the exact charges used in detection. A higher payment is labeled a possible price change, not guaranteed savings. The forecast states its inputs, assumptions, and limitations next to the result.

**A path from observation to action.** Spending categories open matching transactions. Recurring evidence opens all matching history. Budget editing updates the shared plan. A scenario slider shows the effect of changing future variable spending without modifying the actual ledger.

**A low-friction evaluation path.** A reviewer can inspect a complete product in seconds, then exercise its features. Account functionality remains available for demonstrating the full stack.

These choices were informed by Ramp’s emphasis on unified spend visibility, reporting drilldowns, proactive budgets, and evidence-based savings insights. Tally applies those qualities to a smaller personal finance problem while keeping an independent identity:

- [Ramp spend management](https://ramp.com/spend-management)
- [Ramp reporting](https://ramp.com/reporting)
- [Ramp budgets overview](https://support.ramp.com/budgets-overview-and-setup/)
- [Ramp savings insights](https://support.ramp.com/ramp-savings-insights/)

The personal cash-flow scenario is a Tally product choice, not a claim about Ramp’s feature set.

## A two-minute walkthrough

1. **Start at Overview.** Explain the distinction between monthly available money, spending, and savings. Compare cumulative spending with the previous month.
2. **Inspect a category.** Open Housing or Food & drink. Show that the filtered rows explain the overview total. Edit a transaction and return to see the updated picture.
3. **Find a recurring pattern.** Open Recurring, then expand a merchant. Compare the actual dates and amounts; demonstrate a detected price increase when the current demo includes it.
4. **Change the plan.** Adjust the Needs / Wants / Savings percentages to total 100%. Compare spending and estimated upcoming commitments against those targets.
5. **Explore a scenario.** Move the forecast slider. Explain exactly which future amount changes and why already recorded expenses do not.
6. **Show engineering depth.** Explain how a pending save is bound to its original session, how financial invariants are tested, and why a scenario is not a prediction.

Demo data is anchored to the current date. Reset it if revisiting in a later month, and use the previous month if the current month has little history.

## Engineering decisions worth discussing

| Decision                          | Benefit                                                                   | Tradeoff                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Pure financial functions          | Calculations can be tested independently of React and the API.            | Derived analytics currently run in the browser and load the full owned ledger.             |
| Explicit demo/account adapter     | The product is immediately usable; demo changes stay local.               | Local demo data does not sync between devices.                                             |
| Session-bound writes              | Late account requests cannot put private data into the demo after logout. | Authentication changes require discarding stale responses.                                 |
| Server-confirmed mutations        | Failed writes never appear as successful ledger updates.                  | There is a short pending state during network calls.                                       |
| Explainable monthly recurrence    | Reviewers can inspect the evidence and reproduce the calculation.         | Annual, weekly, irregular, and missed-payment patterns are intentionally outside the rule. |
| Cents / Decimal arithmetic        | Repeated sums and monetary boundaries stay predictable.                   | A database migration is still needed to replace legacy float storage.                      |
| Preserved full-stack architecture | Existing records, routes, and deployment structure remain compatible.     | Legacy account fields and build-tool debt remain explicit follow-up work.                  |

## Scope and future work

The project demonstrates product judgment and end-to-end implementation, not a production banking system. It intentionally avoids pretend bank connections, nonfunctional cancellation buttons, invented AI insights, and fake savings claims.

The most valuable next increment is a privacy and reliability release: remove unnecessary signup fields through a migration, move sessions to HTTP-only cookies, add recovery and verification, rate-limit auth, migrate money storage to integer cents, and replace the inherited React Scripts toolchain. For larger ledgers, add server-side pagination and analytics with the same financial invariants. CSV import would then require a preview, validation, duplicate detection, and atomic commit.

## Resume language

Use only claims that accurately reflect your own contribution and understanding. Suggested descriptions of the project’s implemented scope:

> Built Tally, a full-stack personal finance workspace with connected transaction analytics, configurable budgets, explainable recurring-charge detection, and interactive cash-flow scenarios using React and Flask.

> Implemented session-isolated demo and account persistence, validated financial inputs, cent-accurate aggregation, and automated regression coverage for cross-account access, asynchronous mutation races, and forecasting edge cases.

Do not claim usage, savings, performance gains, or business outcomes that have not been measured. Be ready to discuss the design, code, tradeoffs, and tests in your own words.
