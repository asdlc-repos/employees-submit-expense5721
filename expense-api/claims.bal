import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

function selectClaimQuery() returns sql:ParameterizedQuery {
    return `SELECT id, employee_id AS "employeeId", amount, currency, category,
                   expense_date AS "expenseDate", description, status,
                   receipt_content_type AS "receiptContentType", receipt_data AS "receiptData",
                   manager_comment AS "managerComment",
                   created_at AS "createdAt", updated_at AS "updatedAt", exported_at AS "exportedAt"
            FROM expense_claims`;
}

function toClaimSummary(ClaimRow row) returns ExpenseClaimSummary|error {
    ClaimCategory category = check row.category.cloneWithType(ClaimCategory);
    ClaimStatus status = check row.status.cloneWithType(ClaimStatus);
    return {
        id: row.id,
        employeeId: row.employeeId,
        amount: row.amount,
        currency: row.currency,
        category,
        expenseDate: row.expenseDate,
        description: row.description,
        status,
        hasReceipt: row.receiptData is string,
        managerComment: row.managerComment,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        exportedAt: row.exportedAt
    };
}

function toExpenseClaim(ClaimRow row) returns ExpenseClaim|error {
    ExpenseClaimSummary summary = check toClaimSummary(row);
    return {
        ...summary,
        receiptContentType: row.receiptContentType,
        receiptData: row.receiptData
    };
}

function getClaimRowById(string claimId) returns ClaimRow?|error {
    sql:ParameterizedQuery q = sql:queryConcat(selectClaimQuery(), ` WHERE id = ${claimId}`);
    ClaimRow|sql:Error result = dbClient->queryRow(q);
    if result is sql:NoRowsError {
        return ();
    }
    if result is sql:Error {
        return result;
    }
    return result;
}

// Applies role scoping FIRST, then the caller's own status/exported filters —
// Employee: own claims only; Manager: direct reports' claims only; Finance:
// approved claims only, regardless of any status filter it passes.
function buildListFilter(string role, Employee caller, string? status, boolean? exported) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery filter = ``;
    if role == "Manager" {
        filter = sql:queryConcat(filter, ` WHERE employee_id IN (SELECT id FROM employees WHERE manager_id = ${caller.id})`);
    } else if role == "Finance" {
        filter = sql:queryConcat(filter, ` WHERE status = 'approved'`);
    } else {
        filter = sql:queryConcat(filter, ` WHERE employee_id = ${caller.id}`);
    }
    if status is string && role != "Finance" {
        filter = sql:queryConcat(filter, ` AND status = ${status}`);
    }
    if exported is boolean {
        if exported {
            filter = sql:queryConcat(filter, ` AND exported_at IS NOT NULL`);
        } else {
            filter = sql:queryConcat(filter, ` AND exported_at IS NULL`);
        }
    }
    return filter;
}

function listClaimRows(sql:ParameterizedQuery whereClause, int 'limit, int offset) returns ClaimRow[]|error {
    sql:ParameterizedQuery q = sql:queryConcat(
        selectClaimQuery(), whereClause,
        ` ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}`
    );
    stream<ClaimRow, sql:Error?> resultStream = dbClient->query(q);
    ClaimRow[] rows = [];
    check from ClaimRow row in resultStream
        do {
            rows.push(row);
        };
    return rows;
}

function countClaims(sql:ParameterizedQuery whereClause) returns int|error {
    sql:ParameterizedQuery q = sql:queryConcat(`SELECT COUNT(*) AS "total" FROM expense_claims`, whereClause);
    record {| int total; |} result = check dbClient->queryRow(q);
    return result.total;
}

function buildPageUri(int 'limit, int offset, string? status, boolean? exported) returns string {
    string uri = string `/expense-claims?limit=${'limit}&offset=${offset}`;
    if status is string {
        uri += string `&status=${status}`;
    }
    if exported is boolean {
        uri += string `&exported=${exported}`;
    }
    return uri;
}

function isValidDate(string value) returns boolean {
    string:RegExp pattern = re `^\d{4}-\d{2}-\d{2}$`;
    return pattern.isFullMatch(value);
}

function validateClaimInput(ExpenseClaimInput input) returns string? {
    if input.amount <= 0d {
        return "amount must be greater than zero";
    }
    if input.description.trim() == "" {
        return "description is required";
    }
    if !isValidDate(input.expenseDate) {
        return "expenseDate must be a valid date (YYYY-MM-DD)";
    }
    string? contentType = input.receiptContentType;
    string? data = input.receiptData;
    if (contentType is string && data is ()) || (contentType is () && data is string) {
        return "receiptContentType and receiptData must be provided together";
    }
    return ();
}

function submitClaim(Employee caller, ExpenseClaimInput input) returns ExpenseClaim|error {
    string newId = uuid:createRandomUuid();
    string now = time:utcToString(time:utcNow());
    _ = check dbClient->execute(`
        INSERT INTO expense_claims
            (id, employee_id, amount, currency, category, expense_date, description,
             status, receipt_content_type, receipt_data, manager_comment, created_at, updated_at, exported_at)
        VALUES
            (${newId}, ${caller.id}, ${input.amount}, 'USD', ${input.category}, ${input.expenseDate}, ${input.description},
             'pending', ${input.receiptContentType}, ${input.receiptData}, NULL, ${now}, ${now}, NULL)
    `);
    ClaimRow? row = check getClaimRowById(newId);
    if row is () {
        return error("failed to load created claim");
    }
    return toExpenseClaim(row);
}

function updateClaim(string claimId, ExpenseClaimInput input) returns error? {
    string now = time:utcToString(time:utcNow());
    _ = check dbClient->execute(`
        UPDATE expense_claims SET
            amount = ${input.amount},
            category = ${input.category},
            expense_date = ${input.expenseDate},
            description = ${input.description},
            receipt_content_type = ${input.receiptContentType},
            receipt_data = ${input.receiptData},
            manager_comment = NULL,
            status = 'pending',
            updated_at = ${now}
        WHERE id = ${claimId}
    `);
}

function decideClaim(string claimId, string newStatus, string? comment) returns error? {
    string now = time:utcToString(time:utcNow());
    _ = check dbClient->execute(`
        UPDATE expense_claims SET
            status = ${newStatus},
            manager_comment = ${comment},
            updated_at = ${now}
        WHERE id = ${claimId}
    `);
}

// Only approved, never-exported claims are eligible; each is stamped so it
// can never be exported a second time.
function exportApprovedClaims() returns ClaimRow[]|error {
    sql:ParameterizedQuery q = sql:queryConcat(
        selectClaimQuery(), ` WHERE status = 'approved' AND exported_at IS NULL ORDER BY created_at`
    );
    stream<ClaimRow, sql:Error?> resultStream = dbClient->query(q);
    ClaimRow[] rows = [];
    check from ClaimRow row in resultStream
        do {
            rows.push(row);
        };
    if rows.length() == 0 {
        return rows;
    }
    string now = time:utcToString(time:utcNow());
    sql:ParameterizedQuery[] updates = from ClaimRow row in rows
        select `UPDATE expense_claims SET exported_at = ${now} WHERE id = ${row.id}`;
    _ = check dbClient->batchExecute(updates);
    return rows;
}

function csvEscape(string value) returns string {
    if value.includes(",") || value.includes("\"") || value.includes("\n") {
        string:RegExp quotePattern = re `"`;
        string escaped = quotePattern.replaceAll(value, "\"\"");
        return string `"${escaped}"`;
    }
    return value;
}

function buildCsv(ClaimRow[] rows) returns string {
    string csv = "claimId,employeeId,amount,currency,category,expenseDate,description,managerComment,approvedAt\n";
    foreach ClaimRow row in rows {
        string comment = row.managerComment ?: "";
        csv += string `${row.id},${row.employeeId},${row.amount},${row.currency},${row.category},${row.expenseDate},${csvEscape(row.description)},${csvEscape(comment)},${row.updatedAt}`;
        csv += "\n";
    }
    return csv;
}
