# Validation test plan — Expense Claims (issue #7)

Targets: `expense-webapp` (primary, OIDC sign-in via Thunder) and `expense-api`
(reached through the webapp's `/api` proxy — the direct gateway URL in
`targets.json` rejects the SPA's bearer token with 401, since the token's
audience is the webapp's own OAuth client, not the API's; the webapp's proxy
is the only path this run could authenticate through, and it is the same path
a real user's browser uses).

Auth: three role logins (`test-employee`, `test-manager`, `test-finance`,
from this milestone's roles-gate ticket #3) are signed in once via the real
Thunder OIDC + PKCE flow in `global-setup.ts`, which saves each session's
`storageState` to `tests/e2e/.auth/<role>.json` (gitignored). UI specs restore
that state with `test.use({ storageState })`; API specs pull the raw
`access_token` out of it via `lib/auth.ts:tokenFor()` and attach it as
`Authorization: Bearer <token>` when calling `expense-webapp/api/...` with the
`request` fixture.

## Confirmed platform defect — blocks REQ-004(b)/005/006/007/008/009

Live exploration (playwright-cli, both browser UI and direct authenticated
`fetch`) established that **no mechanism anywhere in the deployed system ever
sets an employee's `managerId`**:

- `expense-api/db.bal` creates every employee row with `manager_id = NULL`
  (`getOrCreateEmployee` in `auth.bal`) on first sign-in, and no endpoint,
  admin screen, or seed data ever updates it.
- `isClaimVisible` / `decideOnClaim` (`expense-api/claims.bal`,
  `service.bal`) gate a manager's visibility and approve/reject rights on
  `owner.managerId == caller.id` — which can never be true.
- Confirmed live: signed in as `test-manager` (whose ID token correctly
  carries `groups: ["Manager"]` after a fresh login), calling
  `POST /api/expense-claims/{id}/approve` against a claim `test-employee`
  had just submitted returns `403 {"message":"forbidden","description":
  "caller is not this claim's manager"}`.

Consequence: **no claim can ever reach `approved` or `rejected` status** in
this deployment. Every criterion whose setup requires a decided claim
(AC-004-a, AC-004-b, AC-006-a/b/c/d, AC-007-a/b, AC-008-b, AC-009-a/b) is
authored to drive the real flow end to end and fails honestly at the
approve/reject step, per `authoring.md`: "the app misbehaves: author the spec
anyway so it fails honestly." AC-005-a fails the same way (a manager can
never be seeded with a real direct report). This is one root cause, not eight
independent bugs.

## AC-003-c — testing-account substitution

The roles-gate ticket provisions exactly one Employee-role account
(`test-employee`), so there is no second real Employee identity to sign in as
a "peer" for a literal cross-employee test. AC-003-c is instead verified with
`test-manager`'s session acting purely as *a distinct authenticated caller who
does not own the claim* (not exercising its Manager role): it must not be
able to `GET` the employee's specific claim by id, and the claim must not
appear in that caller's own claims list. This demonstrates the same
ownership-scoping boundary the criterion describes, given the accounts
available.

## AC-004-c — manual

`method: manual` in the criteria file. Rendered as an unchecked checklist
item in the report; not automated this run.

---

## AC-001-a — An employee can create a claim by entering amount, category, date, and description

- Target: expense-webapp (UI)
- Steps: sign in as employee → New claim → fill category/date/amount/description → Submit
- Assert: redirected to the claim detail page showing the entered category, amount, and description
- Source: `expense-webapp/src/pages/ClaimForm.tsx`; confirmed live via playwright-cli exploration

## AC-001-b — A newly submitted claim has status pending

- Target: expense-api via webapp proxy (API)
- Steps: POST /api/expense-claims as employee with valid fields
- Assert: 201, response body `status === "pending"`

## AC-001-c — Category must be one of the fixed list

- Target: expense-api via webapp proxy (API)
- Steps: (a) POST with `category: "NotACategory"` (b) POST with `category: "Lodging"`
- Assert: (a) 400 (b) 201 with `category === "Lodging"`

## AC-002-a — An employee can attach a receipt image when submitting

- Target: expense-webapp (UI)
- Steps: New claim, fill required fields, attach a small PNG via the file input, submit
- Assert: claim detail page shows a receipt thumbnail (not "No receipt attached.")
- Source: `ClaimForm.tsx` FileInput + `fileToBase64`; confirmed live

## AC-002-b — A claim can be submitted without a receipt attachment

- Target: expense-api via webapp proxy (API)
- Steps: POST /api/expense-claims with no `receiptContentType`/`receiptData`
- Assert: 201, `hasReceipt === false`

## AC-002-c — An attached receipt can be viewed later from the claim

- Target: expense-api via webapp proxy (API)
- Steps: POST with a receipt, then GET /api/expense-claims/{id}
- Assert: GET response's `receiptContentType`/`receiptData` match what was submitted

## AC-003-a — An employee sees a list of all claims they submitted

- Target: expense-webapp (UI)
- Steps: create two claims via API as employee, open My Claims
- Assert: both claims' descriptions appear in the table

## AC-003-b — Each listed claim shows its current status

- Target: expense-webapp (UI)
- Steps: open My Claims after creating a claim
- Assert: a "Pending" status badge is visible on the row

## AC-003-c — An employee cannot see another employee's claims

- Target: expense-api via webapp proxy (API)
- Steps: create a claim as employee; as manager (non-owner substitute — see note above), GET the claim by id and GET manager's own claims list
- Assert: GET by id → 403; claim id absent from the second caller's own list

## AC-004-a — A rejected claim can be edited by the employee who submitted it

- Target: expense-api via webapp proxy (API)
- Steps: employee submits claim; manager attempts to reject it (required setup); employee PUTs an edit
- Assert: reject → 200 status rejected; PUT → 200 status pending
- Expected outcome: fails at the reject step (see defect note)

## AC-004-b — Resubmitting an edited claim sets its status back to pending

- Target: expense-api via webapp proxy (API)
- Steps: same setup as AC-004-a, then re-check status after PUT
- Assert: status === "pending" after edit
- Expected outcome: fails at the reject step (see defect note)

## AC-004-c — A claim that is not rejected cannot be resubmitted (manual)

- Not automated. Listed in the report as an unchecked manual checklist item.

## AC-005-a — A manager sees a list of pending claims submitted by their direct reports

- Target: expense-api via webapp proxy (API)
- Steps: employee submits a claim; manager GETs /api/expense-claims?status=pending
- Assert: the claim id is present
- Expected outcome: fails (no direct-report link possible — see defect note)

## AC-005-b — A manager does not see pending claims from non-direct-reports

- Target: expense-api via webapp proxy (API)
- Steps: employee submits a claim; manager GETs /api/expense-claims?status=pending (employee is not, and cannot be made, this manager's report)
- Assert: the claim id is absent
- Expected outcome: passes — this is a true, meaningful negative-scoping check independent of the defect

## AC-006-a — A manager can approve a pending claim

- Target: expense-api via webapp proxy (API)
- Steps: employee submits a claim; manager POSTs /approve
- Assert: 200, status === "approved"
- Expected outcome: fails, 403 (see defect note)

## AC-006-b — A manager can reject a pending claim

- Target: expense-api via webapp proxy (API)
- Steps: employee submits a claim; manager POSTs /reject
- Assert: 200, status === "rejected"
- Expected outcome: fails, 403 (see defect note)

## AC-006-c — A manager can add a comment when approving or rejecting

- Target: expense-api via webapp proxy (API)
- Steps: employee submits a claim; manager POSTs /approve with `{comment: "..."}`
- Assert: 200, `managerComment` echoes the comment
- Expected outcome: fails, 403 (see defect note)

## AC-006-d — The employee can see the manager's decision and comment on their claim

- Target: expense-api via webapp proxy (API)
- Steps: after AC-006-c's approve, employee GETs the claim
- Assert: status + managerComment visible to the employee
- Expected outcome: fails — setup (approve) never succeeds (see defect note)

## AC-007-a — A finance user sees a list of approved claims not yet exported

- Target: expense-api via webapp proxy (API)
- Steps: get a claim approved (required setup), then finance GETs ?status=approved&exported=false
- Assert: claim id present
- Expected outcome: fails at setup (see defect note)

## AC-007-b — A previously exported claim no longer appears in the awaiting-export list

- Target: expense-api via webapp proxy (API)
- Steps: approve + export a claim (required setup), then re-check the awaiting-export list
- Assert: claim id absent after export
- Expected outcome: fails at setup (see defect note)

## AC-008-a — A finance user can trigger an export of approved claims

- Target: expense-api via webapp proxy (API)
- Steps: finance POSTs /api/expense-claims/export
- Assert: 200, `content-type` text/csv
- Expected outcome: passes — the endpoint itself works regardless of how many rows it exports

## AC-008-b — The export produces a downloadable file containing the exported claims' data

- Target: expense-api via webapp proxy (API)
- Steps: get a claim approved (required setup), export, inspect CSV body
- Assert: CSV contains the claim's id
- Expected outcome: fails at setup (see defect note)

## AC-009-a — A claim included in an export is marked as exported

- Target: expense-api via webapp proxy (API)
- Steps: approve + export a claim (required setup), then GET it
- Assert: `exportedAt` is non-null
- Expected outcome: fails at setup (see defect note)

## AC-009-b — An already-exported claim cannot be exported again

- Target: expense-api via webapp proxy (API)
- Steps: approve + export a claim (required setup), export a second time
- Assert: claim id is absent from the second export's CSV body
- Expected outcome: fails at setup (see defect note)
