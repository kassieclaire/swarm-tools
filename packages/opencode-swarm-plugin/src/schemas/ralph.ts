/**
 * Ralph Supervisor Schemas
 *
 * Type definitions for the ralph loop supervisor pattern where Claude
 * supervises and Codex executes implementation work.
 */
import { z } from "zod";

// ============================================================================
// Story Schemas
// ============================================================================

/**
 * Story status enum
 */
export const StoryStatusSchema = z.enum([
  "pending",           // Not yet started
  "in_progress",       // Coordinator spawned worker, work in progress
  "ready_for_review",  // Worker completed, awaiting coordinator review
  "passed",            // Coordinator reviewed, validation passed
  "failed",            // Coordinator reviewed, validation failed
  "blocked",           // Blocked by dependency or issue
]);
export type StoryStatus = z.infer<typeof StoryStatusSchema>;

/**
 * Story definition
 */
export const StorySchema = z.object({
  id: z.string().describe("Unique story identifier"),
  title: z.string().min(1).describe("What to implement"),
  description: z.string().describe("Detailed requirements"),
  priority: z.number().min(1).max(10).default(5).describe("Priority (1=highest, 10=lowest)"),
  status: StoryStatusSchema.default("pending"),
  validation_command: z.string().optional().describe("Command to validate completion (e.g., npm test)"),
  acceptance_criteria: z.array(z.string()).optional().describe("List of success criteria"),
  files_touched: z.array(z.string()).optional().describe("Files modified by this story"),
  attempts: z.number().default(0).describe("Number of implementation attempts"),
  last_error: z.string().optional().describe("Last validation error if failed"),
  cell_id: z.string().optional().describe("Linked hive cell ID if tracking via hive"),
  created_at: z.string().datetime().describe("ISO timestamp of creation"),
  updated_at: z.string().datetime().describe("ISO timestamp of last update"),
});
export type Story = z.infer<typeof StorySchema>;

// ============================================================================
// PRD (Product Requirements Document) Schemas
// ============================================================================

/**
 * PRD metadata
 */
export const PRDMetadataSchema = z.object({
  created_at: z.string().datetime(),
  last_iteration: z.string().datetime().optional(),
  total_iterations: z.number().default(0),
  total_stories_completed: z.number().default(0),
});

/**
 * PRD structure
 */
export const PRDSchema = z.object({
  version: z.string().default("1.0"),
  project_name: z.string().min(1),
  description: z.string().optional(),
  stories: z.array(StorySchema).default([]),
  metadata: PRDMetadataSchema,
});
export type PRD = z.infer<typeof PRDSchema>;

// ============================================================================
// Codex Integration Schemas
// ============================================================================

/**
 * Codex sandbox modes
 */
export const SandboxModeSchema = z.enum([
  "read-only",           // Can only read files
  "workspace-write",     // Can write to workspace
  "danger-full-access",  // Full system access
]);
export type SandboxMode = z.infer<typeof SandboxModeSchema>;

/**
 * Codex JSONL event types we care about
 */
export const CodexEventTypeSchema = z.enum([
  "session_start",
  "session_meta",
  "tool_call",
  "function_call",
  "response_item",
  "error",
]);

/**
 * Codex event from JSONL stream
 */
export const CodexEventSchema = z.object({
  type: CodexEventTypeSchema,
  session_id: z.string().optional(),
  tool: z.string().optional(),
  name: z.string().optional(),  // For function_call
  arguments: z.record(z.string(), z.unknown()).optional(),
  content: z.unknown().optional(),
  error: z.string().optional(),
});
export type CodexEvent = z.infer<typeof CodexEventSchema>;

/**
 * Result of a single Codex iteration
 */
export const CodexIterationResultSchema = z.object({
  success: z.boolean(),
  exit_code: z.number(),
  session_id: z.string().optional(),
  tool_calls: z.number().default(0),
  files_modified: z.array(z.string()).default([]),
  final_message: z.string().optional(),
  duration_ms: z.number(),
  error: z.string().optional(),
});
export type CodexIterationResult = z.infer<typeof CodexIterationResultSchema>;

// ============================================================================
// Iteration Schemas
// ============================================================================

/**
 * Result of a single ralph iteration
 */
export const IterationResultSchema = z.object({
  success: z.boolean(),
  story_id: z.string(),
  story_title: z.string(),
  codex_result: CodexIterationResultSchema,
  validation_passed: z.boolean(),
  validation_output: z.string().optional(),
  commit_hash: z.string().optional(),
  learnings: z.string().optional(),
  timestamp: z.string().datetime(),
});
export type IterationResult = z.infer<typeof IterationResultSchema>;

/**
 * Result of a full ralph loop
 */
export const LoopResultSchema = z.object({
  completed: z.boolean(),
  iterations: z.array(IterationResultSchema),
  stories_completed: z.number(),
  stories_remaining: z.number(),
  total_duration_ms: z.number(),
  stopped_reason: z.enum([
    "all_complete",      // All stories passed
    "max_iterations",    // Hit iteration limit
    "validation_failed", // stopOnFailure and validation failed
    "cancelled",         // User cancelled
    "error",             // Unexpected error
  ]),
  error: z.string().optional(),
});
export type LoopResult = z.infer<typeof LoopResultSchema>;

// ============================================================================
// Job Tracking Schemas (for async loops)
// ============================================================================

/**
 * Job status enum
 */
export const JobStatusSchema = z.enum([
  "running",
  "completed",
  "failed",
  "cancelled",
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

/**
 * Async loop job state
 */
export const LoopJobSchema = z.object({
  id: z.string(),
  workdir: z.string(),
  status: JobStatusSchema,
  started_at: z.number(),
  completed_at: z.number().optional(),
  current_iteration: z.number(),
  max_iterations: z.number(),
  current_story: z.object({
    id: z.string(),
    title: z.string(),
  }).optional(),
  stories_completed: z.number(),
  total_stories: z.number(),
  results: z.array(IterationResultSchema),
  error: z.string().optional(),
});
export type LoopJob = z.infer<typeof LoopJobSchema>;

// ============================================================================
// Tool Argument Schemas
// ============================================================================

/**
 * ralph_init arguments
 */
export const RalphInitArgsSchema = z.object({
  workdir: z.string().optional().describe("Working directory (defaults to project root)"),
  project_name: z.string().min(1).describe("Project name"),
  description: z.string().optional().describe("Project description"),
  use_hive: z.boolean().default(true).describe("Track stories as hive cells"),
});
export type RalphInitArgs = z.infer<typeof RalphInitArgsSchema>;

/**
 * ralph_story arguments
 */
export const RalphStoryArgsSchema = z.object({
  workdir: z.string().optional(),
  title: z.string().min(1).describe("Story title"),
  description: z.string().describe("Detailed description of what to implement"),
  priority: z.number().min(1).max(10).default(5),
  validation_command: z.string().optional().describe("Command to validate (defaults to npm test)"),
  acceptance_criteria: z.array(z.string()).optional(),
});
export type RalphStoryArgs = z.infer<typeof RalphStoryArgsSchema>;

/**
 * ralph_iterate arguments
 */
export const RalphIterateArgsSchema = z.object({
  workdir: z.string().optional(),
  model: z.string().default("gpt-5.3-codex").describe("Codex model to use"),
  sandbox: SandboxModeSchema.default("workspace-write"),
  dry_run: z.boolean().default(false).describe("Don't actually run Codex"),
  timeout_ms: z.number().default(600000).describe("Timeout per iteration (default 10min)"),
});
export type RalphIterateArgs = z.infer<typeof RalphIterateArgsSchema>;

/**
 * ralph_loop arguments
 */
export const RalphLoopArgsSchema = z.object({
  workdir: z.string().optional(),
  max_iterations: z.number().default(20).describe("Maximum iterations before stopping"),
  model: z.string().default("gpt-5.3-codex"),
  sandbox: SandboxModeSchema.default("workspace-write"),
  stop_on_failure: z.boolean().default(false).describe("Stop loop on first validation failure"),
  auto_commit: z.boolean().default(true).describe("Auto-commit on success"),
  sync: z.boolean().default(false).describe("Run synchronously (blocks until complete)"),
});
export type RalphLoopArgs = z.infer<typeof RalphLoopArgsSchema>;

/**
 * ralph_status arguments
 */
export const RalphStatusArgsSchema = z.object({
  workdir: z.string().optional(),
  job_id: z.string().optional().describe("Specific job ID to check"),
});
export type RalphStatusArgs = z.infer<typeof RalphStatusArgsSchema>;

/**
 * ralph_review arguments
 */
export const RalphReviewArgsSchema = z.object({
  workdir: z.string().optional(),
  story_id: z.string().describe("Story ID to review"),
  approve: z.boolean().describe("Whether to approve the completed work"),
  feedback: z.string().optional().describe("Feedback if rejecting"),
});
export type RalphReviewArgs = z.infer<typeof RalphReviewArgsSchema>;

// ============================================================================
// Configuration Schema
// ============================================================================

/**
 * Ralph supervisor configuration
 */
export const RalphConfigSchema = z.object({
  model: z.string().default("gpt-5.3-codex"),
  max_iterations: z.number().default(20),
  sandbox: SandboxModeSchema.default("workspace-write"),
  auto_commit: z.boolean().default(true),
  default_validation: z.string().default("npm run typecheck 2>/dev/null || tsc --noEmit; npm test 2>/dev/null || true"),
  progress_context_limit: z.number().default(2000).describe("Max chars of progress to include in prompt"),
});
export type RalphConfig = z.infer<typeof RalphConfigSchema>;

// ============================================================================
// Export all schemas
// ============================================================================

export const ralphSchemas = {
  StoryStatusSchema,
  StorySchema,
  PRDMetadataSchema,
  PRDSchema,
  SandboxModeSchema,
  CodexEventTypeSchema,
  CodexEventSchema,
  CodexIterationResultSchema,
  IterationResultSchema,
  LoopResultSchema,
  JobStatusSchema,
  LoopJobSchema,
  RalphInitArgsSchema,
  RalphStoryArgsSchema,
  RalphIterateArgsSchema,
  RalphLoopArgsSchema,
  RalphStatusArgsSchema,
  RalphReviewArgsSchema,
  RalphConfigSchema,
};
