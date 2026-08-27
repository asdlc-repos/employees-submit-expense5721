import ballerina/http;
import ballerina/log;
import ballerina/sql;

listener http:Listener expenseListener = new (9090);

service / on expenseListener {

    resource function get employees/me(
            @http:Header string? x\-user\-id,
            @http:Header string? x\-user\-name,
            @http:Header string? x\-user\-groups) returns Employee|IdentityError {
        var resolved = resolveCallerEmployee(x\-user\-id, x\-user\-name, x\-user\-groups);
        if resolved is IdentityError {
            return resolved;
        }
        return resolved[0];
    }

    resource function get expense\-claims(
            @http:Header string? x\-user\-id,
            @http:Header string? x\-user\-name,
            @http:Header string? x\-user\-groups,
            ClaimStatus? status = (),
            boolean? exported = (),
            int 'limit = 20,
            int offset = 0) returns ClaimListResponse|IdentityError {
        var resolved = resolveCallerEmployee(x\-user\-id, x\-user\-name, x\-user\-groups);
        if resolved is IdentityError {
            return resolved;
        }
        Employee caller = resolved[0];
        string[] groups = resolved[1];
        string role = resolveRole(groups);

        int effectiveLimit = 'limit;
        if effectiveLimit > 100 {
            effectiveLimit = 100;
        }
        if effectiveLimit < 1 {
            effectiveLimit = 20;
        }
        int effectiveOffset = offset < 0 ? 0 : offset;

        string? statusFilter = status is ClaimStatus ? status.toString() : ();
        sql:ParameterizedQuery whereClause = buildListFilter(role, caller, statusFilter, exported);

        int|error total = countClaims(whereClause);
        if total is error {
            log:printError("failed to count claims", total);
            return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
        }
        ClaimRow[]|error rows = listClaimRows(whereClause, effectiveLimit, effectiveOffset);
        if rows is error {
            log:printError("failed to list claims", rows);
            return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
        }
        ExpenseClaimSummary[] summaries = [];
        foreach ClaimRow row in rows {
            ExpenseClaimSummary|error summary = toClaimSummary(row);
            if summary is error {
                log:printError("failed to map claim row", summary);
                return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
            }
            summaries.push(summary);
        }

        string? next = effectiveOffset + effectiveLimit < total
            ? buildPageUri(effectiveLimit, effectiveOffset + effectiveLimit, statusFilter, exported)
            : ();
        int previousOffset = effectiveOffset - effectiveLimit;
        string? previous = effectiveOffset > 0
            ? buildPageUri(effectiveLimit, previousOffset < 0 ? 0 : previousOffset, statusFilter, exported)
            : ();

        return {count: total, next, previous, data: summaries};
    }

    resource function post expense\-claims(
            @http:Header string? x\-user\-id,
            @http:Header string? x\-user\-name,
            @http:Header string? x\-user\-groups,
            ExpenseClaimInput payload) returns http:Created|http:BadRequest|IdentityError {
        var resolved = resolveCallerEmployee(x\-user\-id, x\-user\-name, x\-user\-groups);
        if resolved is IdentityError {
            return resolved;
        }
        Employee caller = resolved[0];

        string? validationError = validateClaimInput(payload);
        if validationError is string {
            return <http:BadRequest>{body: {code: 400, message: "invalid claim data", description: validationError}};
        }

        ExpenseClaim|error created = submitClaim(caller, payload);
        if created is error {
            log:printError("failed to submit claim", created);
            return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
        }
        return <http:Created>{body: created};
    }

    resource function get expense\-claims/[string claimId](
            @http:Header string? x\-user\-id,
            @http:Header string? x\-user\-name,
            @http:Header string? x\-user\-groups) returns ExpenseClaim|http:Forbidden|http:NotFound|IdentityError {
        var resolved = resolveCallerEmployee(x\-user\-id, x\-user\-name, x\-user\-groups);
        if resolved is IdentityError {
            return resolved;
        }
        Employee caller = resolved[0];
        string[] groups = resolved[1];
        string role = resolveRole(groups);

        ClaimRow?|error rowResult = getClaimRowById(claimId);
        if rowResult is error {
            log:printError("failed to load claim", rowResult);
            return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
        }
        if rowResult is () {
            return <http:NotFound>{body: {code: 404, message: "not found", description: "claim not found"}};
        }
        ClaimRow row = rowResult;

        boolean|error visible = isClaimVisible(row, role, caller);
        if visible is error {
            log:printError("failed to check claim visibility", visible);
            return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
        }
        if !visible {
            return <http:Forbidden>{body: {code: 403, message: "forbidden", description: "caller may not view this claim"}};
        }

        ExpenseClaim|error claim = toExpenseClaim(row);
        if claim is error {
            log:printError("failed to map claim", claim);
            return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
        }
        return claim;
    }

    resource function put expense\-claims/[string claimId](
            @http:Header string? x\-user\-id,
            @http:Header string? x\-user\-name,
            @http:Header string? x\-user\-groups,
            ExpenseClaimInput payload) returns ExpenseClaim|http:BadRequest|http:Forbidden|http:NotFound|IdentityError {
        var resolved = resolveCallerEmployee(x\-user\-id, x\-user\-name, x\-user\-groups);
        if resolved is IdentityError {
            return resolved;
        }
        Employee caller = resolved[0];

        ClaimRow?|error rowResult = getClaimRowById(claimId);
        if rowResult is error {
            log:printError("failed to load claim", rowResult);
            return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
        }
        if rowResult is () {
            return <http:NotFound>{body: {code: 404, message: "not found", description: "claim not found"}};
        }
        ClaimRow row = rowResult;

        if row.employeeId != caller.id {
            return <http:Forbidden>{body: {code: 403, message: "forbidden", description: "caller does not own this claim"}};
        }
        if row.status != "rejected" {
            return <http:BadRequest>{body: {code: 400, message: "invalid status", description: "only a rejected claim may be edited"}};
        }

        string? validationError = validateClaimInput(payload);
        if validationError is string {
            return <http:BadRequest>{body: {code: 400, message: "invalid claim data", description: validationError}};
        }

        error? updateResult = updateClaim(claimId, payload);
        if updateResult is error {
            log:printError("failed to update claim", updateResult);
            return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
        }
        ClaimRow?|error updatedRow = getClaimRowById(claimId);
        if updatedRow is error || updatedRow is () {
            return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
        }
        ExpenseClaim|error updatedClaim = toExpenseClaim(updatedRow);
        if updatedClaim is error {
            log:printError("failed to map claim", updatedClaim);
            return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
        }
        return updatedClaim;
    }

    resource function post expense\-claims/[string claimId]/approve(
            @http:Header string? x\-user\-id,
            @http:Header string? x\-user\-name,
            @http:Header string? x\-user\-groups,
            DecisionInput? payload) returns ExpenseClaim|http:BadRequest|http:Forbidden|http:NotFound|IdentityError {
        return decideOnClaim(x\-user\-id, x\-user\-name, x\-user\-groups, claimId, "approved", payload);
    }

    resource function post expense\-claims/[string claimId]/reject(
            @http:Header string? x\-user\-id,
            @http:Header string? x\-user\-name,
            @http:Header string? x\-user\-groups,
            DecisionInput? payload) returns ExpenseClaim|http:BadRequest|http:Forbidden|http:NotFound|IdentityError {
        return decideOnClaim(x\-user\-id, x\-user\-name, x\-user\-groups, claimId, "rejected", payload);
    }

    resource function post expense\-claims/export(
            @http:Header string? x\-user\-id,
            @http:Header string? x\-user\-name,
            @http:Header string? x\-user\-groups) returns http:Response|http:Forbidden|IdentityError {
        var resolved = resolveCallerEmployee(x\-user\-id, x\-user\-name, x\-user\-groups);
        if resolved is IdentityError {
            return resolved;
        }
        string[] groups = resolved[1];
        string role = resolveRole(groups);
        if role != "Finance" {
            return <http:Forbidden>{body: {code: 403, message: "forbidden", description: "caller is not finance"}};
        }

        ClaimRow[]|error rows = exportApprovedClaims();
        if rows is error {
            log:printError("failed to export claims", rows);
            return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
        }

        string csv = buildCsv(rows);
        http:Response response = new;
        response.setTextPayload(csv, "text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"expense-claims-export.csv\"");
        return response;
    }
}

function decideOnClaim(string? userId, string? username, string? userGroups, string claimId, string newStatus, DecisionInput? payload)
        returns ExpenseClaim|http:BadRequest|http:Forbidden|http:NotFound|IdentityError {
    var resolved = resolveCallerEmployee(userId, username, userGroups);
    if resolved is IdentityError {
        return resolved;
    }
    Employee caller = resolved[0];

    ClaimRow?|error rowResult = getClaimRowById(claimId);
    if rowResult is error {
        log:printError("failed to load claim", rowResult);
        return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
    }
    if rowResult is () {
        return <http:NotFound>{body: {code: 404, message: "not found", description: "claim not found"}};
    }
    ClaimRow row = rowResult;

    Employee?|error ownerResult = getEmployeeById(row.employeeId);
    if ownerResult is error {
        log:printError("failed to load claim owner", ownerResult);
        return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
    }
    Employee? owner = ownerResult;
    if owner is () || owner.managerId != caller.id {
        return <http:Forbidden>{body: {code: 403, message: "forbidden", description: "caller is not this claim's manager"}};
    }
    if row.status != "pending" {
        return <http:BadRequest>{body: {code: 400, message: "invalid status", description: "claim is not pending"}};
    }

    error? decisionResult = decideClaim(claimId, newStatus, payload?.comment);
    if decisionResult is error {
        log:printError("failed to update claim", decisionResult);
        return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
    }
    ClaimRow?|error updatedRow = getClaimRowById(claimId);
    if updatedRow is error || updatedRow is () {
        return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
    }
    ExpenseClaim|error claim = toExpenseClaim(updatedRow);
    if claim is error {
        log:printError("failed to map claim", claim);
        return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
    }
    return claim;
}

function isClaimVisible(ClaimRow row, string role, Employee caller) returns boolean|error {
    if role == "Finance" {
        return row.status == "approved";
    }
    if role == "Manager" {
        Employee? owner = check getEmployeeById(row.employeeId);
        if owner is () {
            return false;
        }
        return owner.managerId == caller.id;
    }
    return row.employeeId == caller.id;
}
