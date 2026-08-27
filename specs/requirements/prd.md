# Expense Claims — PRD

## Problem Statement

Employees pay for business costs out of pocket and today chase paper receipts, email
threads, and spreadsheets to get reimbursed. Managers have no single place to review
what they're approving, and finance has to manually reconcile scattered approvals
before it can pay anyone through payroll. The result is slow reimbursement, lost
receipts, and no clean audit trail from claim to payment.

## Solution

A shared expense-claims system where employees submit claims online, their manager
approves or rejects them, and finance exports the approved claims into payroll for
payment — one workflow, one status per claim, from submission to payout.

## Actors

- **Employee** — submits expense claims, tracks their status, and can edit and
resubmit a claim their manager rejected.
- **Manager** — reviews claims submitted by their direct reports and approves or
rejects each one.
- **Finance** — reviews approved claims and exports them to payroll for payment.

## User Stories

1. As an Employee, I want to submit an expense claim with an amount, category, date,
and description, so that I can request reimbursement.
2. As an Employee, I want to attach a receipt image to my claim, so that I have proof
of purchase on record.
3. As an Employee, I want to see the status of all my claims (pending, approved,
rejected), so that I know where each one stands.
4. As an Employee, I want to edit and resubmit a claim my manager rejected, so that I
can correct it and get it reconsidered.
5. As a Manager, I want to see the pending claims submitted by my direct reports, so
that I can review them.
6. As a Manager, I want to approve or reject a claim, optionally with a comment
explaining my decision, so that the employee understands the outcome.
7. As a Finance user, I want to see all approved claims awaiting export, so that I
can process them.
8. As a Finance user, I want to export approved claims to payroll, so that employees
are reimbursed through the normal payroll run.
9. As a Finance user, I want exported claims to be marked as exported, so that the
same claim is never sent to payroll twice.

## Product Decisions

- Sign-in is via SSO through Thunder, the platform identity provider.
- A claim needs approval from the employee's direct manager only; there is no
multi-level or amount-based escalation.
- A rejected claim stays open: the employee edits and resubmits the same claim rather
than starting a new one.
- Each claim carries one receipt attachment, stored as an uploaded file; attaching it
is optional.
- There are no email notifications; employees and managers check claim status in the
app itself.
- Claims use a fixed category list (Travel, Meals, Lodging, Supplies, Other) rather
than free-text categories.
- Claims are single-currency (USD); multi-currency support is not part of this
product. *assumed*
- Finance exports approved claims as a downloadable file (CSV) rather than pushing
directly into a specific payroll vendor's API, since no payroll system has been
named yet. *assumed*

## Out of Scope

- Multi-level or amount-based approval escalation.
- Multi-currency expense claims.
- Direct API integration with a named payroll vendor (export is file-based for now).
- Mileage tracking or per-diem calculators.
- A mobile app (web only).

## Open Questions

1. Which payroll system, if any, should a future integration target — is a CSV
export sufficient long-term, or does finance need a direct feed into a specific
vendor?

## Further Notes

None.