import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

function resolvedDbHost() returns string => dbHost == "" ? "localhost" : dbHost;

function resolvedDbPort() returns int|error => dbPort == "" ? 5432 : int:fromString(dbPort);

function resolvedDbName() returns string => dbName == "" ? "expense_db" : dbName;

function resolvedDbUser() returns string => dbUser == "" ? "postgres" : dbUser;

function resolvedDbPassword() returns string => dbPassword == "" ? "postgres" : dbPassword;

final postgresql:Client dbClient = check new (
    host = resolvedDbHost(),
    port = check resolvedDbPort(),
    username = resolvedDbUser(),
    password = resolvedDbPassword(),
    database = resolvedDbName()
);

final () dbReady = check initDb();

function initDb() returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS employees (
            id VARCHAR(64) PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL DEFAULT '',
            manager_id VARCHAR(64)
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS expense_claims (
            id VARCHAR(64) PRIMARY KEY,
            employee_id VARCHAR(64) NOT NULL,
            amount NUMERIC(12,2) NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'USD',
            category VARCHAR(20) NOT NULL,
            expense_date VARCHAR(10) NOT NULL,
            description TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            receipt_content_type VARCHAR(100),
            receipt_data TEXT,
            manager_comment TEXT,
            created_at VARCHAR(40) NOT NULL,
            updated_at VARCHAR(40) NOT NULL,
            exported_at VARCHAR(40)
        )
    `);
}
