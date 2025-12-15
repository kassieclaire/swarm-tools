/**
 * Swarm Mail Types - Database-agnostic interfaces
 *
 * Re-exports all adapter interfaces for easy importing:
 *
 * ```typescript
 * import type { DatabaseAdapter, SwarmMailAdapter } from '@opencode/swarm-mail/types';
 * ```
 */

export type {
	AgentAdapter,
	Conflict,
	EventStoreAdapter,
	InboxOptions,
	Message,
	MessagingAdapter,
	ReadEventsOptions,
	Reservation,
	ReservationAdapter,
	SchemaAdapter,
	SwarmMailAdapter,
	SwarmMailAdapterFactory,
} from "./adapter";
export type { DatabaseAdapter, DatabaseConfig, QueryResult } from "./database";
export { supportsTransactions } from "./database";
