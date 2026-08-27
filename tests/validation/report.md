# Validation report

- **Issue:** #7
- **Commit:** 7ea5727c7146b97be2cd43cc7b738c1930d3f527
- **Generated:** 2026-08-27T15:37:55.247Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 23 | 11 | 12 | 0 |
| manual (human checklist) | 1 | — | — | — |
| scenario (not validated) | 0 | — | — | — |

## E2E results

| Criterion | Must | Status | Spec | Notes |
|---|---|---|---|---|
| AC-001-a | An employee can create a claim by entering an amount, category, date, and description | ✅ pass | `tests/e2e/specs/AC-001-a.spec.ts` | — |
| AC-001-b | A newly submitted claim has status pending | ✅ pass | `tests/e2e/specs/AC-001-b.spec.ts` | — |
| AC-001-c | The category must be one of the fixed list (Travel, Meals, Lodging, Supplies, Other) | ✅ pass | `tests/e2e/specs/AC-001-c.spec.ts` | — |
| AC-002-a | An employee can attach a receipt image when submitting a claim | ✅ pass | `tests/e2e/specs/AC-002-a.spec.ts` | — |
| AC-002-b | A claim can be submitted without a receipt attachment | ✅ pass | `tests/e2e/specs/AC-002-b.spec.ts` | — |
| AC-002-c | An attached receipt can be viewed later from the claim | ✅ pass | `tests/e2e/specs/AC-002-c.spec.ts` | — |
| AC-003-a | An employee sees a list of all claims they submitted | ✅ pass | `tests/e2e/specs/AC-003-a.spec.ts` | — |
| AC-003-b | Each listed claim shows its current status (pending, approved, or rejected) | ✅ pass | `tests/e2e/specs/AC-003-b.spec.ts` | — |
| AC-003-c | An employee cannot see another employee's claims | ✅ pass | `tests/e2e/specs/AC-003-c.spec.ts` | — |
| AC-004-a | A rejected claim can be edited by the employee who submitted it | ❌ fail | `tests/e2e/specs/AC-004-a.spec.ts` | — |
| AC-004-b | Resubmitting an edited claim sets its status back to pending | ❌ fail | `tests/e2e/specs/AC-004-b.spec.ts` | — |
| AC-005-a | A manager sees a list of pending claims submitted by their direct reports | ❌ fail | `tests/e2e/specs/AC-005-a.spec.ts` | — |
| AC-005-b | A manager does not see pending claims from employees who are not their direct reports | ✅ pass | `tests/e2e/specs/AC-005-b.spec.ts` | — |
| AC-006-a | A manager can approve a pending claim | ❌ fail | `tests/e2e/specs/AC-006-a.spec.ts` | — |
| AC-006-b | A manager can reject a pending claim | ❌ fail | `tests/e2e/specs/AC-006-b.spec.ts` | — |
| AC-006-c | A manager can add a comment when approving or rejecting | ❌ fail | `tests/e2e/specs/AC-006-c.spec.ts` | — |
| AC-006-d | The employee can see the manager's decision and comment on their claim | ❌ fail | `tests/e2e/specs/AC-006-d.spec.ts` | — |
| AC-007-a | A finance user sees a list of approved claims that have not yet been exported | ❌ fail | `tests/e2e/specs/AC-007-a.spec.ts` | — |
| AC-007-b | A previously exported claim no longer appears in the awaiting-export list | ❌ fail | `tests/e2e/specs/AC-007-b.spec.ts` | — |
| AC-008-a | A finance user can trigger an export of approved claims | ✅ pass | `tests/e2e/specs/AC-008-a.spec.ts` | — |
| AC-008-b | The export produces a downloadable file containing the exported claims' data | ❌ fail | `tests/e2e/specs/AC-008-b.spec.ts` | — |
| AC-009-a | A claim included in an export is marked as exported | ❌ fail | `tests/e2e/specs/AC-009-a.spec.ts` | — |
| AC-009-b | An already-exported claim cannot be exported again | ❌ fail | `tests/e2e/specs/AC-009-b.spec.ts` | — |

## Failures

### AC-004-a — A rejected claim can be edited by the employee who submitted it

Spec: `tests/e2e/specs/AC-004-a.spec.ts`
Location: `AC-004-a.spec.ts:11`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 403
```

### AC-004-b — Resubmitting an edited claim sets its status back to pending

Spec: `tests/e2e/specs/AC-004-b.spec.ts`
Location: `AC-004-b.spec.ts:9`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 403
```

### AC-005-a — A manager sees a list of pending claims submitted by their direct reports

Spec: `tests/e2e/specs/AC-005-a.spec.ts`
Location: `AC-005-a.spec.ts:9`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

### AC-006-a — A manager can approve a pending claim

Spec: `tests/e2e/specs/AC-006-a.spec.ts`
Location: `AC-006-a.spec.ts:9`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 403
```

### AC-006-b — A manager can reject a pending claim

Spec: `tests/e2e/specs/AC-006-b.spec.ts`
Location: `AC-006-b.spec.ts:8`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 403
```

### AC-006-c — A manager can add a comment when approving or rejecting

Spec: `tests/e2e/specs/AC-006-c.spec.ts`
Location: `AC-006-c.spec.ts:8`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 403
```

### AC-006-d — The employee can see the manager's decision and comment on their claim

Spec: `tests/e2e/specs/AC-006-d.spec.ts`
Location: `AC-006-d.spec.ts:9`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 403
```

### AC-007-a — A finance user sees a list of approved claims that have not yet been exported

Spec: `tests/e2e/specs/AC-007-a.spec.ts`
Location: `AC-007-a.spec.ts:9`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 403
```

### AC-007-b — A previously exported claim no longer appears in the awaiting-export list

Spec: `tests/e2e/specs/AC-007-b.spec.ts`
Location: `AC-007-b.spec.ts:9`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 403
```

### AC-008-b — The export produces a downloadable file containing the exported claims' data

Spec: `tests/e2e/specs/AC-008-b.spec.ts`
Location: `AC-008-b.spec.ts:9`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 403
```

### AC-009-a — A claim included in an export is marked as exported

Spec: `tests/e2e/specs/AC-009-a.spec.ts`
Location: `AC-009-a.spec.ts:9`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 403
```

### AC-009-b — An already-exported claim cannot be exported again

Spec: `tests/e2e/specs/AC-009-b.spec.ts`
Location: `AC-009-b.spec.ts:9`

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 403
```

## Manual checklist

- [ ] **AC-004-c** — A claim that is not rejected cannot be resubmitted

