import ballerina/os;

// expense-db (platform-resource, postgres-cnpg) — envBindings from design.json.
// Every value defaults safely when unset so the service starts with no
// required environment variables; resolvedDb* in db.bal fills the actual
// connection defaults used for local/offline builds.
configurable string dbHost = os:getEnv("EXPENSE_DB_HOST");
configurable string dbPort = os:getEnv("EXPENSE_DB_PORT");
configurable string dbName = os:getEnv("EXPENSE_DB_DBNAME");
configurable string dbUser = os:getEnv("EXPENSE_DB_USER");
configurable string dbPassword = os:getEnv("EXPENSE_DB_PASSWORD");
