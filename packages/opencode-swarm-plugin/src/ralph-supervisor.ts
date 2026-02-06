/**
 * Ralph Supervisor Module
 *
 * Implements the ralph loop pattern where Claude acts as supervisor
 * and Codex executes implementation work. Fresh context per iteration,
 * validation gates, git-backed persistence, and progress carryover.
 *
 * Key concepts:
 * - Stories: Discrete tasks that fit in a single context window
 * - PRD: Product Requirements Document tracking all stories
 * - Iteration: One Codex session implementing one story
 * - Loop: Multiple iterations until all stories pass or limits hit
 * - Validation: Tests/checks that must pass before story is marked complete
 *
 * Integration points:
 * - Hive: Stories can be tracked as hive cells
 * - Hivemind: Learnings stored for future context
 * - Swarmmail: File reservations for coordination
 */
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import {
  StorySchema,
  PRDSchema,
  CodexEventSchema,
  CodexIterationResultSchema,
  IterationResultSchema,
  LoopResultSchema,
  LoopJobSchema,
  RalphInitArgsSchema,
  RalphStoryArgsSchema,
  RalphIterateArgsSchema,
  RalphLoopArgsSchema,
  RalphStatusArgsSchema,
  RalphReviewArgsSchema,
  RalphConfigSchema,
  type Story,
  type PRD,
  type CodexEvent,
  type CodexIterationResult,
  type IterationResult,
  type LoopResult,
  type LoopJob,
  type RalphConfig,
  type SandboxMode,
} from "./schemas/ralph";
import { safeEmitEvent } from "./utils/event-utils";

// ============================================================================
// Module State
// ============================================================================

let ralphWorkingDirectory: string | null = null;
const activeJobs = new Map<string, LoopJob & { abortController?: AbortController }>();

/**
 * Set working directory for ralph operations
 */
export function setRalphWorkingDirectory(directory: string): void {
  ralphWorkingDirectory = directory;
}

/**
 * Get working directory for ralph operations
 */
export function getRalphWorkingDirectory(): string {
  return ralphWorkingDirectory || process.cwd();
}

// ============================================================================
// File Helpers
// ============================================================================

const PRD_FILE = "prd.json";
const PROGRESS_FILE = "progress.txt";
const AGENTS_FILE = "AGENTS.md";

/**
 * Resolve a path, expanding ~ and making absolute
 */
function resolvePath(inputPath: string): string {
  if (inputPath.startsWith("~")) {
    return join(process.env.HOME || "", inputPath.slice(1));
  }
  return resolve(inputPath);
}

/**
 * Get project directory from args or default
 */
function getProjectDir(workdir?: string): string {
  if (workdir) {
    return resolvePath(workdir);
  }
  return getRalphWorkingDirectory();
}

/**
 * Read PRD from project directory
 */
function readPRD(projectDir: string): PRD | null {
  const prdPath = join(projectDir, PRD_FILE);
  if (!existsSync(prdPath)) {
    return null;
  }
  try {
    const content = readFileSync(prdPath, "utf-8");
    return PRDSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}

/**
 * Write PRD to project directory
 */
function writePRD(projectDir: string, prd: PRD): void {
  const prdPath = join(projectDir, PRD_FILE);
  writeFileSync(prdPath, JSON.stringify(prd, null, 2));
}

/**
 * Read progress file
 */
function readProgress(projectDir: string): string {
  const progressPath = join(projectDir, PROGRESS_FILE);
  if (!existsSync(progressPath)) {
    return "";
  }
  return readFileSync(progressPath, "utf-8");
}

/**
 * Append to progress file
 */
function appendProgress(projectDir: string, entry: string): void {
  const progressPath = join(projectDir, PROGRESS_FILE);
  const timestamp = new Date().toISOString();
  const formatted = `---\n[${timestamp}]\n${entry}\n`;

  let existing = "";
  if (existsSync(progressPath)) {
    existing = readFileSync(progressPath, "utf-8");
  }
  writeFileSync(progressPath, existing + formatted);
}

/**
 * Read AGENTS.md if it exists
 */
function readAgentsMd(projectDir: string): string {
  const agentsPath = join(projectDir, AGENTS_FILE);
  if (!existsSync(agentsPath)) {
    return "";
  }
  return readFileSync(agentsPath, "utf-8");
}

/**
 * Get next pending story by priority
 */
function getNextStory(prd: PRD): Story | null {
  const pending = prd.stories.filter(s => s.status === "pending" || s.status === "failed");
  if (pending.length === 0) return null;
  pending.sort((a, b) => a.priority - b.priority);
  return pending[0];
}

/**
 * Emit event helper for ralph tools
 */
async function emitRalphEvent(
  eventType: string,
  data: Record<string, unknown>,
  projectPath?: string,
): Promise<void> {
  await safeEmitEvent(eventType, data, "ralph", projectPath || getRalphWorkingDirectory());
}

// ============================================================================
// Codex Integration
// ============================================================================

/**
 * Build the iteration prompt for Codex
 */
function buildIterationPrompt(
  prd: PRD,
  story: Story,
  progress: string,
  agentsMd: string,
  config: RalphConfig,
): string {
  const parts: string[] = [];

  parts.push(`# Project: ${prd.project_name}`);
  if (prd.description) {
    parts.push(prd.description);
  }
  parts.push("");

  parts.push(`## Current Task: ${story.title}`);
  parts.push(`Priority: ${story.priority}`);
  parts.push("");
  parts.push(story.description);
  parts.push("");

  if (story.acceptance_criteria && story.acceptance_criteria.length > 0) {
    parts.push("## Acceptance Criteria");
    for (const criterion of story.acceptance_criteria) {
      parts.push(`- ${criterion}`);
    }
    parts.push("");
  }

  const validation = story.validation_command || config.default_validation;
  parts.push(`## Validation Command`);
  parts.push("```bash");
  parts.push(validation);
  parts.push("```");
  parts.push("");

  if (agentsMd) {
    parts.push("## Project Guidelines (AGENTS.md)");
    parts.push(agentsMd);
    parts.push("");
  }

  if (progress) {
    // Trim progress to last N characters
    const trimmedProgress = progress.length > config.progress_context_limit
      ? "..." + progress.slice(-config.progress_context_limit)
      : progress;
    parts.push("## Recent Progress & Learnings");
    parts.push(trimmedProgress);
    parts.push("");
  }

  parts.push("## Instructions");
  parts.push("Implement ONLY this story. Do not work on other stories.");
  parts.push("Run the validation command when done to verify your work.");
  parts.push("If validation fails, fix the issues before completing.");
  parts.push("");

  return parts.join("\n");
}

/**
 * Parse JSONL events from Codex output
 */
function parseCodexEvents(output: string): CodexEvent[] {
  const events: CodexEvent[] = [];
  for (const line of output.split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      const result = CodexEventSchema.safeParse(parsed);
      if (result.success) {
        events.push(result.data);
      }
    } catch {
      // Skip non-JSON lines
    }
  }
  return events;
}

/**
 * Run Codex CLI for one iteration
 */
async function runCodexIteration(
  projectDir: string,
  prompt: string,
  model: string,
  sandbox: SandboxMode,
  timeoutMs: number,
): Promise<CodexIterationResult> {
  const startTime = Date.now();
  const outputFile = join(tmpdir(), `ralph-codex-${randomUUID()}.txt`);

  const args = [
    "exec",
    "--full-auto",
    "--sandbox", sandbox,
    "--json",
    "-o", outputFile,
    "-C", projectDir,
    "-m", model,
    prompt,
  ];

  try {
    const proc = Bun.spawn(["codex", ...args], {
      cwd: projectDir,
      stdout: "pipe",
      stderr: "pipe",
    });

    // Set up timeout
    const timeoutId = setTimeout(() => {
      proc.kill("SIGTERM");
    }, timeoutMs);

    // Collect stdout for JSONL events
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    clearTimeout(timeoutId);

    // Parse events from stdout
    const events = parseCodexEvents(stdout);

    // Extract session ID
    const sessionEvent = events.find(e => e.type === "session_start" || e.type === "session_meta");
    const sessionId = sessionEvent?.session_id;

    // Count tool calls and extract modified files
    let toolCalls = 0;
    const filesModified: string[] = [];

    for (const event of events) {
      if (event.type === "tool_call" || event.type === "function_call") {
        toolCalls++;
        const toolName = event.tool || event.name;
        if (toolName === "write_file" || toolName === "edit_file") {
          const filePath = event.arguments?.path as string | undefined;
          if (filePath && !filesModified.includes(filePath)) {
            filesModified.push(filePath);
          }
        }
      }
    }

    // Read final message from output file
    let finalMessage: string | undefined;
    if (existsSync(outputFile)) {
      finalMessage = readFileSync(outputFile, "utf-8");
    }

    const duration = Date.now() - startTime;

    return {
      success: exitCode === 0,
      exit_code: exitCode,
      session_id: sessionId,
      tool_calls: toolCalls,
      files_modified: filesModified,
      final_message: finalMessage,
      duration_ms: duration,
      error: exitCode !== 0 ? stderr || "Codex exited with non-zero status" : undefined,
    };
  } catch (error) {
    return {
      success: false,
      exit_code: -1,
      tool_calls: 0,
      files_modified: [],
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Run validation command
 */
async function runValidation(
  projectDir: string,
  command: string,
  timeoutMs = 300000, // 5 min default
): Promise<{ success: boolean; output: string }> {
  try {
    const proc = Bun.spawn(["bash", "-c", command], {
      cwd: projectDir,
      stdout: "pipe",
      stderr: "pipe",
    });

    const timeoutId = setTimeout(() => {
      proc.kill("SIGTERM");
    }, timeoutMs);

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    clearTimeout(timeoutId);

    return {
      success: exitCode === 0,
      output: stdout + stderr,
    };
  } catch (error) {
    return {
      success: false,
      output: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Git commit changes
 */
async function gitCommit(
  projectDir: string,
  message: string,
): Promise<string | null> {
  try {
    // Stage all changes
    const add = Bun.spawn(["git", "add", "-A"], { cwd: projectDir });
    await add.exited;

    // Commit
    const commit = Bun.spawn(["git", "commit", "-m", message], {
      cwd: projectDir,
      stdout: "pipe",
    });
    const stdout = await new Response(commit.stdout).text();
    const exitCode = await commit.exited;

    if (exitCode !== 0) return null;

    // Get short hash
    const revParse = Bun.spawn(["git", "rev-parse", "--short", "HEAD"], {
      cwd: projectDir,
      stdout: "pipe",
    });
    const hash = (await new Response(revParse.stdout).text()).trim();
    return hash;
  } catch {
    return null;
  }
}

// ============================================================================
// Core Iteration Logic
// ============================================================================

/**
 * Execute a single ralph iteration
 */
async function executeIteration(
  projectDir: string,
  model: string,
  sandbox: SandboxMode,
  timeoutMs: number,
  autoCommit: boolean,
  config: RalphConfig,
): Promise<IterationResult | null> {
  const prd = readPRD(projectDir);
  if (!prd) {
    throw new Error("No prd.json found. Run ralph_init first.");
  }

  const story = getNextStory(prd);
  if (!story) {
    return null; // All stories complete
  }

  const progress = readProgress(projectDir);
  const agentsMd = readAgentsMd(projectDir);

  // Build prompt
  const prompt = buildIterationPrompt(prd, story, progress, agentsMd, config);

  // Run Codex
  const codexResult = await runCodexIteration(
    projectDir,
    prompt,
    model,
    sandbox,
    timeoutMs,
  );

  // Run validation
  const validationCommand = story.validation_command || config.default_validation;
  const validation = await runValidation(projectDir, validationCommand);

  const success = codexResult.success && validation.success;
  const timestamp = new Date().toISOString();

  // Update story in PRD
  const storyIndex = prd.stories.findIndex(s => s.id === story.id);
  if (storyIndex >= 0) {
    prd.stories[storyIndex].attempts++;
    prd.stories[storyIndex].updated_at = timestamp;
    prd.stories[storyIndex].files_touched = codexResult.files_modified;

    if (success) {
      prd.stories[storyIndex].status = "passed";
      prd.metadata.total_stories_completed++;
    } else {
      prd.stories[storyIndex].status = "failed";
      prd.stories[storyIndex].last_error = validation.output || codexResult.error;
    }
  }

  prd.metadata.last_iteration = timestamp;
  prd.metadata.total_iterations++;
  writePRD(projectDir, prd);

  // Log to progress
  if (success) {
    appendProgress(projectDir, [
      `✅ Story completed: ${story.title}`,
      `Files: ${codexResult.files_modified.join(", ") || "none"}`,
      `Tool calls: ${codexResult.tool_calls}`,
      `Validation: ${validationCommand}`,
      codexResult.final_message ? `Summary: ${codexResult.final_message.slice(0, 500)}` : "",
    ].filter(Boolean).join("\n"));
  } else {
    appendProgress(projectDir, [
      `❌ Story failed: ${story.title}`,
      `Codex success: ${codexResult.success}`,
      `Validation success: ${validation.success}`,
      `Files touched: ${codexResult.files_modified.join(", ") || "none"}`,
      `Validation output: ${validation.output?.slice(0, 500) || "none"}`,
      codexResult.error ? `Codex error: ${codexResult.error.slice(0, 500)}` : "",
    ].filter(Boolean).join("\n"));
  }

  // Git commit if successful and autoCommit enabled
  let commitHash: string | undefined;
  if (success && autoCommit) {
    const hash = await gitCommit(projectDir, `ralph: ${story.title}`);
    if (hash) {
      commitHash = hash;
    }
  }

  // Emit event
  await emitRalphEvent("ralph:iteration:complete", {
    story_id: story.id,
    story_title: story.title,
    success,
    commit_hash: commitHash,
  }, projectDir);

  return {
    success,
    story_id: story.id,
    story_title: story.title,
    codex_result: codexResult,
    validation_passed: validation.success,
    validation_output: validation.output,
    commit_hash: commitHash,
    timestamp,
  };
}

// ============================================================================
// Tool Context Type
// ============================================================================

interface ToolContext {
  sessionID: string;
}

// ============================================================================
// Tools
// ============================================================================

/**
 * Initialize a ralph project
 */
export const ralph_init = tool({
  description: "Initialize a ralph supervisor project. Creates prd.json and progress.txt for tracking stories.",
  args: {
    workdir: tool.schema.string().optional().describe("Working directory (defaults to project root)"),
    project_name: tool.schema.string().describe("Project name"),
    description: tool.schema.string().optional().describe("Project description"),
    use_hive: tool.schema.boolean().optional().describe("Track stories as hive cells (default: true)"),
  },
  async execute(args, ctx: ToolContext) {
    const validated = RalphInitArgsSchema.parse(args);
    const projectDir = getProjectDir(validated.workdir);

    // Check if already initialized
    const existingPrd = readPRD(projectDir);
    if (existingPrd) {
      return JSON.stringify({
        success: false,
        error: "Project already initialized. Found existing prd.json",
        project_name: existingPrd.project_name,
        stories: existingPrd.stories.length,
      }, null, 2);
    }

    // Create PRD
    const now = new Date().toISOString();
    const prd: PRD = {
      version: "1.0",
      project_name: validated.project_name,
      description: validated.description,
      stories: [],
      metadata: {
        created_at: now,
        total_iterations: 0,
        total_stories_completed: 0,
      },
    };

    writePRD(projectDir, prd);

    // Create empty progress file
    appendProgress(projectDir, `Project "${validated.project_name}" initialized.`);

    await emitRalphEvent("ralph:init", {
      project_name: validated.project_name,
      use_hive: validated.use_hive ?? true,
    }, projectDir);

    return JSON.stringify({
      success: true,
      project_name: validated.project_name,
      prd_path: join(projectDir, PRD_FILE),
      progress_path: join(projectDir, PROGRESS_FILE),
      use_hive: validated.use_hive ?? true,
    }, null, 2);
  },
});

/**
 * Add a story to the PRD
 */
export const ralph_story = tool({
  description: "Add a story (task) to the ralph project. Stories are discrete units of work that Codex will implement.",
  args: {
    workdir: tool.schema.string().optional().describe("Working directory"),
    title: tool.schema.string().describe("Story title"),
    description: tool.schema.string().describe("Detailed description of what to implement"),
    priority: tool.schema.number().optional().describe("Priority 1-10 (1=highest, default 5)"),
    validation_command: tool.schema.string().optional().describe("Command to validate (defaults to npm test)"),
    acceptance_criteria: tool.schema.string().optional().describe("JSON array of acceptance criteria strings"),
  },
  async execute(args, ctx: ToolContext) {
    const acceptanceCriteria = args.acceptance_criteria
      ? JSON.parse(args.acceptance_criteria as string)
      : undefined;

    const validated = RalphStoryArgsSchema.parse({
      ...args,
      acceptance_criteria: acceptanceCriteria,
    });
    const projectDir = getProjectDir(validated.workdir);

    const prd = readPRD(projectDir);
    if (!prd) {
      return JSON.stringify({
        success: false,
        error: "No prd.json found. Run ralph_init first.",
      }, null, 2);
    }

    const now = new Date().toISOString();
    const story: Story = {
      id: `story-${Date.now()}`,
      title: validated.title,
      description: validated.description,
      priority: validated.priority ?? 5,
      status: "pending",
      validation_command: validated.validation_command,
      acceptance_criteria: validated.acceptance_criteria,
      attempts: 0,
      created_at: now,
      updated_at: now,
    };

    prd.stories.push(story);
    writePRD(projectDir, prd);

    await emitRalphEvent("ralph:story:added", {
      story_id: story.id,
      story_title: story.title,
      priority: story.priority,
    }, projectDir);

    return JSON.stringify({
      success: true,
      story,
      total_stories: prd.stories.length,
      pending_stories: prd.stories.filter(s => s.status === "pending").length,
    }, null, 2);
  },
});

/**
 * Run a single iteration
 */
export const ralph_iterate = tool({
  description: "Run a single ralph iteration. Picks the next pending story, spawns Codex to implement it, runs validation, and commits on success.",
  args: {
    workdir: tool.schema.string().optional().describe("Working directory"),
    model: tool.schema.string().optional().describe("Codex model to use (default: gpt-5.3-codex)"),
    sandbox: tool.schema.string().optional().describe("Sandbox mode: read-only, workspace-write, danger-full-access"),
    dry_run: tool.schema.boolean().optional().describe("Don't actually run Codex, just show what would happen"),
    timeout_ms: tool.schema.number().optional().describe("Timeout per iteration in ms (default: 600000)"),
  },
  async execute(args, ctx: ToolContext) {
    const validated = RalphIterateArgsSchema.parse(args);
    const projectDir = getProjectDir(validated.workdir);

    const config = RalphConfigSchema.parse({
      model: validated.model,
      sandbox: validated.sandbox,
    });

    if (validated.dry_run) {
      const prd = readPRD(projectDir);
      if (!prd) {
        return JSON.stringify({ success: false, error: "No prd.json found" }, null, 2);
      }
      const story = getNextStory(prd);
      if (!story) {
        return JSON.stringify({ success: true, message: "All stories complete" }, null, 2);
      }
      const progress = readProgress(projectDir);
      const agentsMd = readAgentsMd(projectDir);
      const prompt = buildIterationPrompt(prd, story, progress, agentsMd, config);

      return JSON.stringify({
        dry_run: true,
        next_story: story,
        prompt_length: prompt.length,
        prompt_preview: prompt.slice(0, 1000) + "...",
      }, null, 2);
    }

    await emitRalphEvent("ralph:iteration:start", {
      model: validated.model,
      sandbox: validated.sandbox,
    }, projectDir);

    const result = await executeIteration(
      projectDir,
      validated.model,
      validated.sandbox as SandboxMode,
      validated.timeout_ms,
      true, // autoCommit
      config,
    );

    if (!result) {
      return JSON.stringify({
        success: true,
        message: "All stories complete. No pending work.",
      }, null, 2);
    }

    return JSON.stringify(result, null, 2);
  },
});

/**
 * Run the full ralph loop
 */
export const ralph_loop = tool({
  description: "Run the ralph loop until all stories pass or limits are reached. Spawns Codex for each story, validates, commits on success, and continues.",
  args: {
    workdir: tool.schema.string().optional().describe("Working directory"),
    max_iterations: tool.schema.number().optional().describe("Maximum iterations (default: 20)"),
    model: tool.schema.string().optional().describe("Codex model (default: gpt-5.3-codex)"),
    sandbox: tool.schema.string().optional().describe("Sandbox mode"),
    stop_on_failure: tool.schema.boolean().optional().describe("Stop on first validation failure"),
    auto_commit: tool.schema.boolean().optional().describe("Auto-commit on success (default: true)"),
    sync: tool.schema.boolean().optional().describe("Run synchronously (default: false)"),
  },
  async execute(args, ctx: ToolContext) {
    const validated = RalphLoopArgsSchema.parse(args);
    const projectDir = getProjectDir(validated.workdir);

    const config = RalphConfigSchema.parse({
      model: validated.model,
      sandbox: validated.sandbox,
      auto_commit: validated.auto_commit,
    });

    const prd = readPRD(projectDir);
    if (!prd) {
      return JSON.stringify({ success: false, error: "No prd.json found" }, null, 2);
    }

    const jobId = `ralph-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const abortController = new AbortController();

    const job: LoopJob & { abortController: AbortController } = {
      id: jobId,
      workdir: projectDir,
      status: "running",
      started_at: Date.now(),
      current_iteration: 0,
      max_iterations: validated.max_iterations,
      stories_completed: 0,
      total_stories: prd.stories.length,
      results: [],
      abortController,
    };

    activeJobs.set(jobId, job);

    await emitRalphEvent("ralph:loop:start", {
      job_id: jobId,
      max_iterations: validated.max_iterations,
      total_stories: prd.stories.length,
    }, projectDir);

    // Async execution
    const runLoop = async () => {
      const startTime = Date.now();
      let stoppedReason: LoopResult["stopped_reason"] = "all_complete";

      try {
        for (let i = 0; i < validated.max_iterations; i++) {
          if (abortController.signal.aborted) {
            stoppedReason = "cancelled";
            break;
          }

          job.current_iteration = i + 1;

          const result = await executeIteration(
            projectDir,
            validated.model,
            validated.sandbox as SandboxMode,
            600000, // 10 min timeout
            validated.auto_commit,
            config,
          );

          if (!result) {
            stoppedReason = "all_complete";
            break;
          }

          job.results.push(result);
          job.current_story = { id: result.story_id, title: result.story_title };

          if (result.success) {
            job.stories_completed++;
          } else if (validated.stop_on_failure) {
            stoppedReason = "validation_failed";
            break;
          }

          await emitRalphEvent("ralph:loop:iteration", {
            job_id: jobId,
            iteration: i + 1,
            story_id: result.story_id,
            success: result.success,
          }, projectDir);
        }

        if (job.current_iteration >= validated.max_iterations && stoppedReason === "all_complete") {
          const currentPrd = readPRD(projectDir);
          if (currentPrd && getNextStory(currentPrd)) {
            stoppedReason = "max_iterations";
          }
        }

        job.status = stoppedReason === "cancelled" ? "cancelled" : "completed";
        job.completed_at = Date.now();

        const currentPrd = readPRD(projectDir);
        const remaining = currentPrd ? currentPrd.stories.filter(s => s.status === "pending" || s.status === "failed").length : 0;

        const loopResult: LoopResult = {
          completed: stoppedReason === "all_complete",
          iterations: job.results,
          stories_completed: job.stories_completed,
          stories_remaining: remaining,
          total_duration_ms: Date.now() - startTime,
          stopped_reason: stoppedReason,
        };

        await emitRalphEvent("ralph:loop:complete", {
          job_id: jobId,
          ...loopResult,
        }, projectDir);

        return loopResult;
      } catch (error) {
        job.status = "failed";
        job.error = error instanceof Error ? error.message : String(error);
        job.completed_at = Date.now();

        const loopResult: LoopResult = {
          completed: false,
          iterations: job.results,
          stories_completed: job.stories_completed,
          stories_remaining: prd.stories.length - job.stories_completed,
          total_duration_ms: Date.now() - startTime,
          stopped_reason: "error",
          error: job.error,
        };

        await emitRalphEvent("ralph:loop:error", {
          job_id: jobId,
          error: job.error,
        }, projectDir);

        return loopResult;
      }
    };

    if (validated.sync) {
      // Synchronous execution
      const result = await runLoop();
      activeJobs.delete(jobId);
      return JSON.stringify(result, null, 2);
    } else {
      // Async execution - return immediately
      runLoop().finally(() => {
        // Keep job for status queries for a while
        setTimeout(() => activeJobs.delete(jobId), 3600000); // 1 hour
      });

      return JSON.stringify({
        job_id: jobId,
        status: "running",
        message: "Loop started. Use ralph_status to check progress.",
        max_iterations: validated.max_iterations,
        total_stories: prd.stories.length,
      }, null, 2);
    }
  },
});

/**
 * Get ralph status
 */
export const ralph_status = tool({
  description: "Get the status of a ralph project or running loop job.",
  args: {
    workdir: tool.schema.string().optional().describe("Working directory"),
    job_id: tool.schema.string().optional().describe("Specific job ID to check"),
  },
  async execute(args, ctx: ToolContext) {
    const validated = RalphStatusArgsSchema.parse(args);
    const projectDir = getProjectDir(validated.workdir);

    // Check specific job
    if (validated.job_id) {
      const job = activeJobs.get(validated.job_id);
      if (!job) {
        return JSON.stringify({
          success: false,
          error: `Job ${validated.job_id} not found`,
        }, null, 2);
      }

      return JSON.stringify({
        job_id: job.id,
        status: job.status,
        current_iteration: job.current_iteration,
        max_iterations: job.max_iterations,
        current_story: job.current_story,
        stories_completed: job.stories_completed,
        total_stories: job.total_stories,
        duration_ms: Date.now() - job.started_at,
        results_count: job.results.length,
        error: job.error,
      }, null, 2);
    }

    // Get project status
    const prd = readPRD(projectDir);
    if (!prd) {
      return JSON.stringify({
        success: false,
        error: "No prd.json found. Run ralph_init first.",
      }, null, 2);
    }

    const pending = prd.stories.filter(s => s.status === "pending").length;
    const passed = prd.stories.filter(s => s.status === "passed").length;
    const failed = prd.stories.filter(s => s.status === "failed").length;
    const inProgress = prd.stories.filter(s => s.status === "in_progress").length;

    // Find any running jobs for this project
    const runningJobs = Array.from(activeJobs.values())
      .filter(j => j.workdir === projectDir && j.status === "running")
      .map(j => ({
        job_id: j.id,
        current_iteration: j.current_iteration,
        current_story: j.current_story,
      }));

    return JSON.stringify({
      project_name: prd.project_name,
      total_stories: prd.stories.length,
      pending,
      passed,
      failed,
      in_progress: inProgress,
      total_iterations: prd.metadata.total_iterations,
      total_completed: prd.metadata.total_stories_completed,
      last_iteration: prd.metadata.last_iteration,
      running_jobs: runningJobs,
      stories: prd.stories.map(s => ({
        id: s.id,
        title: s.title,
        status: s.status,
        priority: s.priority,
        attempts: s.attempts,
      })),
    }, null, 2);
  },
});

/**
 * Cancel a running loop
 */
export const ralph_cancel = tool({
  description: "Cancel a running ralph loop.",
  args: {
    job_id: tool.schema.string().describe("Job ID to cancel"),
  },
  async execute(args, ctx: ToolContext) {
    const { job_id } = z.object({ job_id: z.string() }).parse(args);

    const job = activeJobs.get(job_id);
    if (!job) {
      return JSON.stringify({
        success: false,
        error: `Job ${job_id} not found`,
      }, null, 2);
    }

    if (job.status !== "running") {
      return JSON.stringify({
        success: false,
        error: `Job ${job_id} is not running (status: ${job.status})`,
      }, null, 2);
    }

    job.abortController?.abort();
    job.status = "cancelled";

    return JSON.stringify({
      success: true,
      job_id,
      message: "Loop cancellation requested",
    }, null, 2);
  },
});

/**
 * Review completed work
 */
export const ralph_review = tool({
  description: "Review a completed story. Approve to keep it passed, or reject with feedback to retry.",
  args: {
    workdir: tool.schema.string().optional().describe("Working directory"),
    story_id: tool.schema.string().describe("Story ID to review"),
    approve: tool.schema.boolean().describe("Whether to approve the work"),
    feedback: tool.schema.string().optional().describe("Feedback if rejecting"),
  },
  async execute(args, ctx: ToolContext) {
    const validated = RalphReviewArgsSchema.parse(args);
    const projectDir = getProjectDir(validated.workdir);

    const prd = readPRD(projectDir);
    if (!prd) {
      return JSON.stringify({ success: false, error: "No prd.json found" }, null, 2);
    }

    const storyIndex = prd.stories.findIndex(s => s.id === validated.story_id);
    if (storyIndex < 0) {
      return JSON.stringify({
        success: false,
        error: `Story ${validated.story_id} not found`,
      }, null, 2);
    }

    const story = prd.stories[storyIndex];

    if (validated.approve) {
      // Keep as passed
      appendProgress(projectDir, `✅ Story approved by supervisor: ${story.title}`);

      await emitRalphEvent("ralph:review:approved", {
        story_id: story.id,
        story_title: story.title,
      }, projectDir);

      return JSON.stringify({
        success: true,
        story_id: story.id,
        status: "approved",
        message: `Story "${story.title}" approved.`,
      }, null, 2);
    } else {
      // Reject - set back to failed for retry
      prd.stories[storyIndex].status = "failed";
      prd.stories[storyIndex].last_error = validated.feedback || "Rejected by supervisor";
      prd.stories[storyIndex].updated_at = new Date().toISOString();
      writePRD(projectDir, prd);

      appendProgress(projectDir, [
        `🔄 Story rejected by supervisor: ${story.title}`,
        `Feedback: ${validated.feedback || "No feedback provided"}`,
      ].join("\n"));

      await emitRalphEvent("ralph:review:rejected", {
        story_id: story.id,
        story_title: story.title,
        feedback: validated.feedback,
      }, projectDir);

      return JSON.stringify({
        success: true,
        story_id: story.id,
        status: "rejected",
        message: `Story "${story.title}" rejected. Will retry on next iteration.`,
        feedback: validated.feedback,
      }, null, 2);
    }
  },
});

// ============================================================================
// Export
// ============================================================================

export const ralphSupervisorTools = {
  ralph_init,
  ralph_story,
  ralph_iterate,
  ralph_loop,
  ralph_status,
  ralph_cancel,
  ralph_review,
};

export default ralphSupervisorTools;
