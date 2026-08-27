import ballerina/http;
import ballerina/log;
import ballerina/sql;
import ballerina/uuid;

// Any protected resource returns this union when the caller's identity or
// role can't be resolved. X-User-Id missing => 401 (gateway didn't front the
// request). X-User-Name missing/unresolvable => 403 (identity present, but
// no directory record can be looked up or lazily created for it).
public type IdentityError http:Unauthorized|http:Forbidden|http:InternalServerError;

type CallerContext record {|
    string userId;
    string username;
    string[] groups;
|};

// Resolves the three gateway-injected headers into a CallerContext, or a 401
// when X-User-Id itself is absent. Every resource declares these headers
// optional and calls this single helper so the 401 stays reachable — a
// framework-level "required header" rejection would pre-empt it with a 400.
function extractCaller(string? userId, string? username, string? userGroups) returns CallerContext|http:Unauthorized {
    if userId is () || userId.trim() == "" {
        return <http:Unauthorized>{
            body: {code: 401, message: "unauthorized", description: "X-User-Id header missing"}
        };
    }
    string[] groupList = [];
    if userGroups is string && userGroups.trim() != "" {
        string[] parts = re `,`.split(userGroups);
        foreach string part in parts {
            string trimmed = part.trim();
            if trimmed != "" {
                groupList.push(trimmed);
            }
        }
    }
    return {
        userId,
        username: username ?: "",
        groups: groupList
    };
}

// Case-insensitive substring match against X-User-Groups. Finance and
// Manager are privileged groups granted via the platform Administrators
// group (specs/design/roles.json); anyone else is the Employee cold-start
// role, never an error case on its own.
function resolveRole(string[] groups) returns string {
    foreach string g in groups {
        if g.toLowerAscii().includes("finance") {
            return "Finance";
        }
    }
    foreach string g in groups {
        if g.toLowerAscii().includes("manager") {
            return "Manager";
        }
    }
    return "Employee";
}

function toEmployee(EmployeeRow row) returns Employee => {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email,
    managerId: row.managerId
};

// Never look employees up by X-User-Id — it is an opaque IdP subject, not a
// directory key. The directory is keyed by the exact X-User-Name.
function getEmployeeByUsername(string username) returns Employee?|error {
    EmployeeRow|sql:Error result = dbClient->queryRow(
        `SELECT id, username, name, email, manager_id AS "managerId", role FROM employees WHERE username = ${username}`
    );
    if result is sql:NoRowsError {
        return ();
    }
    if result is sql:Error {
        return result;
    }
    return toEmployee(result);
}

function getEmployeeById(string id) returns Employee?|error {
    EmployeeRow|sql:Error result = dbClient->queryRow(
        `SELECT id, username, name, email, manager_id AS "managerId", role FROM employees WHERE id = ${id}`
    );
    if result is sql:NoRowsError {
        return ();
    }
    if result is sql:Error {
        return result;
    }
    return toEmployee(result);
}

// Lazily creates the employee record on first sign-in, at the cold-start
// role (Employee) — no rejection for a caller who has no privileged group.
// `role` is the caller's CURRENT live-resolved role (from X-User-Groups) and
// is written unconditionally on every call, keeping it fresh in case group
// membership changed since the row was created — it drives
// reconcileManagerAssignments below.
function getOrCreateEmployee(string username, string role) returns Employee|error {
    Employee? existing = check getEmployeeByUsername(username);
    if existing is Employee {
        _ = check dbClient->execute(`UPDATE employees SET role = ${role} WHERE id = ${existing.id}`);
    } else {
        string newId = uuid:createRandomUuid();
        _ = check dbClient->execute(
            `INSERT INTO employees (id, username, name, email, manager_id, role)
             VALUES (${newId}, ${username}, ${username}, '', NULL, ${role})
             ON CONFLICT (username) DO NOTHING`
        );
    }
    Employee? current = check getEmployeeByUsername(username);
    if current is Employee {
        return current;
    }
    return error("failed to create employee record for " + username);
}

// No org directory is registered for this project (specs/design/security.md),
// so nothing ever tells expense-api who manages whom — the only signal it has
// is which employees are, right now, in the platform-granted Manager group.
// With exactly one Manager on record, every Employee with no manager yet is
// unambiguously that Manager's report: link them. Two or more Managers makes
// the assignment ambiguous, so it is left alone (managerId stays null, per
// security.md's "if any"). Runs on every request — cheap at this scale — so
// it self-heals regardless of which role signs in first.
function reconcileManagerAssignments() returns error? {
    stream<record {| string id; |}, sql:Error?> managerStream =
        dbClient->query(`SELECT id FROM employees WHERE role = 'Manager'`);
    string[] managerIds = [];
    check from record {| string id; |} row in managerStream
        do {
            managerIds.push(row.id);
        };
    if managerIds.length() == 1 {
        _ = check dbClient->execute(
            `UPDATE employees SET manager_id = ${managerIds[0]} WHERE role = 'Employee' AND manager_id IS NULL`
        );
    }
}

// Single shared entry point every protected resource calls: resolves the
// caller's employee record (creating it on first sign-in), reconciles the
// directory's manager assignments, and returns the caller's groups.
function resolveCallerEmployee(string? userId, string? username, string? userGroups)
        returns [Employee, string[]]|IdentityError {
    CallerContext|http:Unauthorized caller = extractCaller(userId, username, userGroups);
    if caller is http:Unauthorized {
        return caller;
    }
    if caller.username.trim() == "" {
        return <http:Forbidden>{
            body: {code: 403, message: "forbidden", description: "caller has no resolvable username"}
        };
    }
    string role = resolveRole(caller.groups);
    Employee|error employee = getOrCreateEmployee(caller.username, role);
    if employee is error {
        log:printError("failed to resolve employee", employee);
        return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
    }
    error? reconciled = reconcileManagerAssignments();
    if reconciled is error {
        log:printError("failed to reconcile manager assignments", reconciled);
        return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
    }
    // Re-fetch: reconciliation above may just have linked this very caller.
    Employee?|error refreshed = getEmployeeByUsername(caller.username);
    if refreshed is Employee {
        return [refreshed, caller.groups];
    }
    return [employee, caller.groups];
}
