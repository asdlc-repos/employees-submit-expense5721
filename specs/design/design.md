# Expense Claims — Design

## Overview

Employees submit expense claims through the Expense Claims Portal; each claim
routes to the employee's direct manager for approval or rejection; a rejected
claim is edited and resubmitted by the same employee; and finance exports
approved, unexported claims to a CSV file for payroll. The portal and its API
sign users in through Thunder, resolve the caller's role from their group
membership, and scope every view to that role. Receipts are optional
image/file attachments stored inline on the claim record itself, in the API's
own database, which also holds the lightweight employee/manager directory
this project needs (no existing organization directory service is registered
to consume instead).

## Context (C1)

```mermaid
graph TD
  Employee[Employee]
  Manager[Manager]
  Finance[Finance]
  Portal[Expense Claims Portal]
  API[Expense Claims API]
  Thunder[Thunder Auth]

  Employee --> Portal
  Manager --> Portal
  Finance --> Portal
  Portal --> API
  Portal --> Thunder
  API --> Thunder
```

## Domain model (ER)

```mermaid
erDiagram
  EMPLOYEE ||--o{ EMPLOYEE : "manages"
  EMPLOYEE ||--o{ EXPENSE_CLAIM : "submits"

  EMPLOYEE {
    string id PK
    string username
    string name
    string email
    string managerId FK
  }

  EXPENSE_CLAIM {
    string id PK
    string employeeId FK
    number amount
    string currency
    string category
    string expenseDate
    string description
    string status
    string receiptContentType
    string receiptData
    string managerComment
    string createdAt
    string updatedAt
    string exportedAt
  }
```

`status` is one of `pending`, `approved`, `rejected`. `receiptData` is the
optional receipt file, stored inline as base64 content alongside
`receiptContentType`; both are nullable. `exportedAt` is null until finance
exports the claim, and export only ever includes `approved` claims with
`exportedAt` still null.

## Key flows

### Submit a claim

```mermaid
sequenceDiagram
  participant E as Employee
  participant W as Portal
  participant A as API

  E->>W: Fill claim form (amount, category, date, description)
  opt Attach receipt
    W->>W: Encode receipt file as base64
  end
  W->>A: POST /expense-claims (with receipt content, if any)
  A-->>W: Claim created (status: pending)
```

### Manager approves or rejects

```mermaid
sequenceDiagram
  participant M as Manager
  participant W as Portal
  participant A as API

  M->>W: Open pending claims for direct reports
  W->>A: GET /expense-claims?status=pending
  A-->>W: List of pending claims
  M->>W: Approve or reject (optional comment)
  W->>A: POST /expense-claims/{id}/approve or /reject
  A-->>W: Claim updated (status: approved | rejected)
```

### Employee edits and resubmits a rejected claim

```mermaid
sequenceDiagram
  participant E as Employee
  participant W as Portal
  participant A as API

  E->>W: Open rejected claim, edit fields
  W->>A: PUT /expense-claims/{id}
  A-->>W: Claim updated (status: pending)
```

### Finance exports approved claims

```mermaid
sequenceDiagram
  participant F as Finance
  participant W as Portal
  participant A as API

  F->>W: Open approved claims awaiting export
  W->>A: GET /expense-claims?status=approved&exported=false
  A-->>W: List of exportable claims
  F->>W: Export to payroll
  W->>A: POST /expense-claims/export
  A-->>W: CSV file + claims marked exported
```

