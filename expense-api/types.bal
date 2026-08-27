// Domain types mirroring specs/design/components/expense-api/openapi.yaml.

public type ClaimStatus "pending"|"approved"|"rejected";

public type ClaimCategory "Travel"|"Meals"|"Lodging"|"Supplies"|"Other";

public type Employee record {|
    string id;
    string username;
    string name;
    string email;
    string? managerId;
|};

public type ExpenseClaimInput record {|
    decimal amount;
    ClaimCategory category;
    string expenseDate;
    string description;
    string? receiptContentType = ();
    string? receiptData = ();
|};

public type DecisionInput record {|
    string comment?;
|};

public type ExpenseClaimSummary record {|
    string id;
    string employeeId;
    decimal amount;
    string currency;
    ClaimCategory category;
    string expenseDate;
    string description;
    ClaimStatus status;
    boolean hasReceipt;
    string? managerComment;
    string createdAt;
    string updatedAt;
    string? exportedAt;
|};

public type ExpenseClaim record {|
    *ExpenseClaimSummary;
    string? receiptContentType;
    string? receiptData;
|};

public type ClaimListResponse record {|
    int count;
    string? next;
    string? previous;
    ExpenseClaimSummary[] data;
|};

public type ApiError record {|
    int code;
    string message;
    string description?;
    string moreInfo?;
|};

// Raw row shape returned from expense_claims queries — SQL columns aliased to
// these exact field names (see claims.bal:selectClaimQuery).
type ClaimRow record {|
    string id;
    string employeeId;
    decimal amount;
    string currency;
    string category;
    string expenseDate;
    string description;
    string status;
    string? receiptContentType;
    string? receiptData;
    string? managerComment;
    string createdAt;
    string updatedAt;
    string? exportedAt;
|};

// Raw row shape returned from employees queries — SQL columns aliased to
// these exact field names (see auth.bal).
type EmployeeRow record {|
    string id;
    string username;
    string name;
    string email;
    string? managerId;
|};
