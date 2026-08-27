// Expense Claims Portal — three roles, six screens

screen MyClaims "Employee sees the status of every claim they've submitted"
  navbar "Expense Claims"
  sidebar "My Claims -> MyClaims | Settings"
  row
    heading "My Claims"
    right
    button "New claim" primary -> NewClaim
  row
    card "Pending | 2 | awaiting manager review"
    card "Approved | 5 | ready for payroll"
    card "Rejected | 1 | needs your edits"
  tabs "All | Pending | Approved | Rejected"
  table "Date | Category | Amount | Status | Updated" -> ClaimDetail
    row "Aug 12 | Travel | $184.20 | Pending | 2h ago"
    row "Aug 10 | Meals | $42.00 | Approved | 1d ago"
    row "Aug 03 | Lodging | $310.00 | Rejected | 3d ago"

screen NewClaim "An employee submits a new expense claim"
  navbar "Expense Claims"
  sidebar "My Claims -> MyClaims | Settings"
  breadcrumb "My Claims / New claim"
  heading "New Claim"
  row
    select "Category: Travel"
    input "Date — e.g. 2026-08-27"
  input "Amount — e.g. 184.20"
  textarea "What was this expense for?"
  input "Attach receipt (optional)"
  row
    right
    button "Cancel"
    button "Submit claim" primary -> MyClaims

screen ClaimDetail "An employee reviews one of their claims, and edits it if it was rejected"
  navbar "Expense Claims"
  sidebar "My Claims -> MyClaims | Settings"
  breadcrumb "My Claims / Lodging — Aug 03"
  row
    heading "Lodging — $310.00"
    badge "Rejected" danger
  text "Submitted Aug 03 — Updated 3d ago"
  split 60/40
    left
      heading "Details"
      text "Date: Aug 03, 2026"
      text "Description: Hotel for client site visit"
      image "Receipt"
      row
        right
        button "Edit and resubmit" primary -> NewClaim
    right
      card "Manager decision"
        text "M. Alvarez · 3d: missing itemized folio, please attach it."

screen ReviewQueue "Manager reviews pending claims from their direct reports"
  navbar "Expense Claims"
  sidebar "Review Queue -> ReviewQueue | Settings"
  row
    heading "Review Queue"
    right
    select "Report: All direct reports"
  row
    card "Pending review | 4 | across 3 direct reports"
    card "Approved this month | 12 | $2,140 total"
  tabs "Pending | Approved | Rejected"
  table "Employee | Date | Category | Amount | Status" -> ClaimReviewDetail
    row "J. Park | Aug 12 | Travel | $184.20 | Pending"
    row "R. Osei | Aug 11 | Supplies | $58.00 | Pending"
    row "J. Park | Aug 03 | Lodging | $310.00 | Rejected"

screen ClaimReviewDetail "Manager approves or rejects one claim, with an optional comment"
  navbar "Expense Claims"
  sidebar "Review Queue -> ReviewQueue | Settings"
  breadcrumb "Review Queue / Travel — Aug 12"
  row
    heading "Travel — $184.20"
    badge "Pending" info
  text "Submitted by J. Park — 2h ago"
  split 60/40
    left
      heading "Details"
      text "Date: Aug 12, 2026"
      text "Description: Client site travel, mileage and tolls"
      image "Receipt"
      textarea "Add a comment (optional)"
      row
        right
        button "Reject" danger
        button "Approve" primary -> ReviewQueue
    right
      heading "This employee's history"
      text "Aug 03 — Rejected: Lodging $310.00"
      text "Jul 20 — Approved: Meals $61.40"

screen ExportQueue "Finance reviews approved claims and exports them to payroll"
  navbar "Expense Claims"
  sidebar "Export Queue -> ExportQueue | Settings"
  row
    heading "Export Queue"
    right
    button "Export to payroll" primary
  row
    card "Awaiting export | 9 | approved claims"
    card "Total amount | $1,860.40 | this batch"
  table "Employee | Date | Category | Amount | Approved by"
    row "J. Park | Aug 05 | Meals | $61.40 | M. Alvarez"
    row "R. Osei | Aug 04 | Supplies | $58.00 | M. Alvarez"
    row "T. Nguyen | Aug 01 | Travel | $220.00 | S. Reyes"
  divider
  text "Last export: Aug 10, 2026 — 14 claims, $2,940.10"

flow "Submit and track a claim"
  role "Employee"
  description "An employee submits a claim, checks its status, and fixes a rejected one"
  MyClaims
  NewClaim
  ClaimDetail

flow "Review direct reports' claims"
  role "Manager"
  description "A manager triages pending claims and decides on each one"
  ReviewQueue
  ClaimReviewDetail

flow "Export approved claims"
  role "Finance"
  description "Finance reviews claims awaiting export and sends them to payroll"
  ExportQueue
