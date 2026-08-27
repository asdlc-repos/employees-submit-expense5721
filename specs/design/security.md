# Expense Claims — Security

## Role resolution

Every request to `expense-api` carries a bearer token issued by Thunder,
validated by the platform gateway, which injects `X-User-Id`, `X-User-Name`,
and `X-User-Groups`. `expense-api` resolves the caller's role from
`X-User-Groups` against the roles this project declares — a caller in none of
those groups is denied every privileged action by default.

Because no organization directory service is registered for this project,
`expense-api` keeps its own minimal employee record per caller, keyed by the
exact `X-User-Name` on first sign-in, including which employee (if any) is
their manager. A caller's role determines WHICH claims they may see and act
on:

- An **Employee** may only read, edit, and resubmit their own claims (matched
by their resolved employee id) — never another employee's.
- A **Manager** may only read and decide on claims submitted by employees
whose `managerId` resolves to the manager's own employee id — never another
manager's direct reports.
- **Finance** may read and export any claim in `approved` status, and marks
each exported claim so it cannot be exported twice.

`X-User-Id` is an opaque IdP subject and is never compared against a stored
employee id or used to look a caller up directly.

## Public surfaces

None. Every screen and every `expense-api` operation requires a signed-in
caller; there is no unauthenticated surface.

## Notes

- Manager and Finance membership is granted outside the app (via the
`Administrators` platform group), since this project has no self-service
way to promote a signed-in Employee to either role.
- A rejected claim reopens for its own submitter only; a manager's decision
never reassigns ownership of a claim.

