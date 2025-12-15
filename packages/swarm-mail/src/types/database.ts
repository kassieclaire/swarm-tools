/**
 * DatabaseAdapter - Database-agnostic interface for swarm-mail
 *
 * Abstracts PGLite-specific operations to support multiple database backends.
 * Based on coursebuilder's adapter-drizzle pattern.
 *
 * ## Design Goals
 * - Zero PGLite types in this interface
 * - Support for PGLite, better-sqlite3, libsql, PostgreSQL
 * - Transaction support optional (some adapters may not support it)
 *
 * ## Implementation Strategy
 * - Accept database instance via dependency injection
 * - Adapters implement this interface for their specific database
 * - Query results use plain objects (no driver-specific types)
 */

/**
 * Query result with rows array
 *
 * All database adapters return results in this shape.
 */
export interface QueryResult<T = unknown> {
	/** Array of result rows */
	rows: T[];
}

/**
 * DatabaseAdapter interface
 *
 * Minimal interface for executing SQL queries and managing transactions.
 * Adapters implement this for PGLite, SQLite, PostgreSQL, etc.
 */
export interface DatabaseAdapter {
	/**
	 * Execute a query and return results
	 *
	 * @param sql - SQL query string (parameterized)
	 * @param params - Query parameters ($1, $2, etc.)
	 * @returns Query result with rows array
	 *
	 * @example
	 * ```typescript
	 * const result = await db.query<{ id: number }>(
	 *   "SELECT id FROM agents WHERE name = $1",
	 *   ["BlueLake"]
	 * );
	 * const id = result.rows[0]?.id;
	 * ```
	 */
	query<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;

	/**
	 * Execute a SQL statement without returning results
	 *
	 * Used for DDL (CREATE TABLE, etc.), DML (INSERT/UPDATE/DELETE), and transactions.
	 *
	 * @param sql - SQL statement(s) to execute
	 *
	 * @example
	 * ```typescript
	 * await db.exec("BEGIN");
	 * await db.exec("COMMIT");
	 * await db.exec("CREATE TABLE users (id SERIAL PRIMARY KEY)");
	 * ```
	 */
	exec(sql: string): Promise<void>;

	/**
	 * Execute a function within a transaction (optional)
	 *
	 * If the adapter doesn't support transactions, it can omit this method
	 * or throw an error. The swarm-mail layer will handle transaction
	 * fallback (using manual BEGIN/COMMIT/ROLLBACK).
	 *
	 * @param fn - Function to execute within transaction context
	 * @returns Result of the function
	 *
	 * @example
	 * ```typescript
	 * const result = await db.transaction?.(async (tx) => {
	 *   await tx.query("INSERT INTO events ...", [...]);
	 *   await tx.query("UPDATE agents ...", [...]);
	 *   return { success: true };
	 * });
	 * ```
	 */
	transaction?<T>(fn: (tx: DatabaseAdapter) => Promise<T>): Promise<T>;

	/**
	 * Close the database connection (optional)
	 *
	 * Some adapters (like PGLite) need explicit cleanup.
	 * If not provided, swarm-mail assumes connection is managed externally.
	 */
	close?(): Promise<void>;
}

/**
 * Database configuration options
 *
 * Passed to adapter factory functions to create DatabaseAdapter instances.
 */
export interface DatabaseConfig {
	/** Path to database file or connection string */
	path: string;
	/** Optional timeout in milliseconds for queries */
	timeout?: number;
	/** Optional flags for database initialization */
	flags?: {
		/** Create database if it doesn't exist */
		create?: boolean;
		/** Enable foreign key constraints */
		foreignKeys?: boolean;
		/** Enable WAL mode (SQLite) */
		wal?: boolean;
	};
}

/**
 * Type guard to check if adapter supports transactions
 */
export function supportsTransactions(
	adapter: DatabaseAdapter,
): adapter is Required<Pick<DatabaseAdapter, "transaction">> & DatabaseAdapter {
	return typeof adapter.transaction === "function";
}
