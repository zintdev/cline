# Cline Max Custom Repository Map

This document records the approved Phase 0 discovery map for the Cline Max Custom fork. It is intentionally documentation-only and does not change runtime behavior.

## Project Context Summary

Cline Max Custom is a fork of Cline intended to become a stronger AI coding agent system with:

- a planner / coder / reviewer split,
- Claude Opus for planning, architecture, and review,
- GPT/Codex-style models for implementation, terminal execution, debugging, and test-fix loops,
- safe command policy enforcement,
- phase-aware model routing,
- task trace logging,
- benchmark and validation checklists,
- a custom VSIX build for daily use.

The approved v1 direction is backend-only. Do not add webview-visible toggles, protobuf changes, gRPC changes, or generated code changes in v1.

## Monorepo Layout

The repository is a monorepo. The VS Code extension source is under `apps/vscode/`.

Important top-level folders:

| Path | Purpose |
| --- | --- |
| `apps/vscode/` | Main VS Code extension package. Most custom work belongs here. |
| `apps/vscode/src/` | Extension backend TypeScript source. |
| `apps/vscode/webview-ui/` | React webview frontend. Do not touch in v1 unless explicitly approved. |
| `apps/vscode/proto/` | Protobuf service definitions for host/webview communication. Do not touch in v1. |
| `apps/vscode/src/generated/` | Generated protobuf/gRPC output. Do not edit manually. |
| `docs/` | Project documentation. Phase 0 writes this repository map here. |
| `evals/` | Existing evaluation and benchmark area. Future Cline Max Custom benchmarks should live here. |
| `sdk/` | Cline SDK packages. Not in scope for v1 extension customization. |
| `.clinerules/` | Local agent rules. `AI_AGENT_CONTEXT.md` must be read before planning or editing code. |

## Extension Entry Points

| Area | File(s) | Notes |
| --- | --- | --- |
| VS Code activation | `apps/vscode/src/extension.ts` | Registers VS Code host services, sidebar provider, commands, URI handlers, terminal integration, code actions, and storage migration. VS Code-specific setup lives here. |
| Cross-host common init | `apps/vscode/src/common.ts` | Initializes shared services and should be preferred for functionality that must also work outside VS Code. |
| Registry metadata | `apps/vscode/src/registry.ts` | Derives command IDs and view IDs from package metadata. The `name` field has special behavior: `name === "claude-dev"` maps command prefix to `cline`. |
| VS Code package metadata | `apps/vscode/package.json` | Defines extension identity, commands, views, activation events, scripts, dependencies, and package metadata. |

### Identity Safety Note

Do not change `name: "claude-dev"` in `apps/vscode/package.json` for v1. The current registry logic depends on this name to keep `cline.*` command IDs stable:

```ts
const prefix = name === "claude-dev" ? "cline" : name
```

Changing `name`, command IDs, view IDs, `viewsContainers` IDs, or activation events would create a large blast radius and is explicitly out of scope unless separately approved.

Approved future Phase 1 identity decisions:

- `publisher`: `ringadalberto`
- `version`: `3.85.0-custom.0`
- keep `name`: `claude-dev`
- v1 remains backend-only.

## High-Level Architecture Map

```text
VS Code Extension Host
  apps/vscode/src/extension.ts
    -> setupHostProvider(...)
    -> initialize(storageContext) in common.ts
    -> VscodeWebviewProvider / WebviewProvider
    -> Controller
    -> Task
    -> ToolExecutor / Tool handlers
    -> API provider handlers
    -> Host terminal, diff, browser, MCP, storage services

Webview UI
  apps/vscode/webview-ui/
    -> React components
    -> generated gRPC clients
    -> talks to Controller through protobuf/gRPC-like message bridge

Persistent Storage
  ~/.cline/data/
    -> globalState.json
    -> secrets.json
    -> workspaces/<hash>/workspaceState.json
    -> tasks and task history files
```

## Model Provider Logic

| Area | File(s) | Notes |
| --- | --- | --- |
| Provider factory | `apps/vscode/src/core/api/index.ts` | `buildApiHandler(configuration, mode)` chooses the provider based on Plan/Act mode. |
| Provider implementations | `apps/vscode/src/core/api/providers/` | One handler per provider, including Anthropic, OpenRouter, OpenAI, OpenAI Codex, OpenAI Native, Bedrock, Gemini, Ollama, LM Studio, etc. |
| Shared API types | `apps/vscode/src/shared/api.ts` | Provider/model types and model metadata. |
| Provider list for settings | `apps/vscode/src/shared/providers/providers.json` | Provider dropdown/list metadata. |
| Provider settings UI | `apps/vscode/webview-ui/src/components/settings/` | Webview settings. Do not touch for backend-only v1. |

Current behavior already supports separate Plan and Act model settings through fields such as `planModeApiProvider`, `actModeApiProvider`, and provider-specific plan/act model IDs. Phase 4 should add a thin role router on top of this existing behavior instead of rewriting the provider system.

## Task Execution Loop

| Area | File(s) | Notes |
| --- | --- | --- |
| Task core | `apps/vscode/src/core/task/index.ts` | Main task lifecycle and API/tool loop. |
| Task state | `apps/vscode/src/core/task/TaskState.ts` | Task-scoped state. Candidate for future phase-state tracking. |
| Tool executor | `apps/vscode/src/core/task/ToolExecutor.ts` | Coordinates parsed tool blocks with concrete handlers. |
| Tool coordinator | `apps/vscode/src/core/task/tools/ToolExecutorCoordinator.ts` | Tool execution orchestration. |
| Tool handlers | `apps/vscode/src/core/task/tools/handlers/` | Concrete handlers for bash, file reads/writes, browser, MCP, plan/act responses, etc. |
| Assistant parsing | `apps/vscode/src/core/assistant-message/` | Parses model output into text/tool blocks. |
| System prompts | `apps/vscode/src/core/prompts/system-prompt/` | Modular prompt components and model-family variants. |

The main implementation phases should avoid changing prompt variants unless absolutely necessary. Prefer backend routing, policy, and logging hooks.

## Terminal and Tool Approval Flow

| Area | File(s) | Notes |
| --- | --- | --- |
| Bash tool handler | `apps/vscode/src/core/task/tools/handlers/ExecuteCommandToolHandler.ts` | Primary place to enforce command policy before a terminal command is executed. |
| Auto-approval logic | `apps/vscode/src/core/task/tools/autoApprove.ts` | Determines whether tools, including bash, may be auto-approved based on user settings. |
| Existing command permission engine | `apps/vscode/src/core/permissions/CommandPermissionController.ts` | Parses and validates shell commands using `allow`, `deny`, and redirect/operator checks from `CLINE_COMMAND_PERMISSIONS`. Reuse this for Phase 3. |
| Permission types | `apps/vscode/src/core/permissions/types.ts` | Existing `CommandPermissionConfig` and validation result types. |
| Terminal execution | `apps/vscode/src/integrations/terminal/CommandExecutor.ts` and `CommandOrchestrator.ts` | Lower-level terminal execution. A final deny check can be added here in Phase 3 as defense in depth. |

Discovery found that `CommandPermissionController` exists but is not obviously wired into the bash tool handler. Phase 3 should verify this again and then wire it in minimally.

## Settings and Config Structure

| Area | File(s) | Notes |
| --- | --- | --- |
| File-backed storage context | `apps/vscode/src/shared/storage/storage-context.ts` | Creates global, secret, and workspace stores under `~/.cline/data/`. |
| Storage manager | `apps/vscode/src/core/storage/StateManager.ts` | Runtime cache and read/write API for state. Prefer this over VS Code `context.globalState` for new persistent settings. |
| State key types | `apps/vscode/src/shared/storage/state-keys.ts` | Add future custom settings here if needed. |
| VS Code migration | `apps/vscode/src/hosts/vscode/vscode-to-file-migration.ts` | Migrates VS Code native storage into shared file-backed storage. |

Approved custom config file location for v1:

```text
~/.cline/data/custom/
  safe-commands.json
  model-routing.json
```

Phase 2 should add a fail-soft config loader that returns `null` if config files are absent or invalid. Absence must preserve upstream behavior.

## Webview and UI Configuration Areas

| Area | File(s) | Notes |
| --- | --- | --- |
| React app | `apps/vscode/webview-ui/src/` | UI code. Do not touch in v1. |
| Extension state context | `apps/vscode/webview-ui/src/context/ExtensionStateContext.tsx` | Webview state provider. Do not touch in v1. |
| Settings components | `apps/vscode/webview-ui/src/components/settings/` | Provider/settings UI. Do not touch in v1. |
| Protobuf definitions | `apps/vscode/proto/` | Required for new RPCs or webview state fields. Do not touch in v1. |
| Generated clients/handlers | `apps/vscode/src/generated/`, `apps/vscode/src/shared/proto/` | Generated from proto. Do not edit manually. |

Backend-only v1 means strict workflow, model routing, safe command policy, and tracing should be configured through files and backend defaults first. Webview toggles can be a later phase after the backend behavior is stable.

## Approved Phase Order

1. Phase 0 — Repository discovery and architecture map
2. Phase 2 — Add custom config files
3. Phase 1 — Rename/custom extension identity safely
4. Phase 3 — Add safe command policy
5. Phase 4 — Add model role routing structure
6. Phase 6 — Add logging and task trace
7. Phase 5 — Add planner/coder/reviewer workflow
8. Phase 7 — Add benchmark/test checklist
9. Phase 8 — Build VSIX and final validation

Phase 6 intentionally precedes Phase 5 so workflow behavior can be validated through trace events.

## Do Not Touch in v1 Without Explicit Approval

- `name: "claude-dev"` in `apps/vscode/package.json`
- command IDs such as `cline.*`
- view IDs and `viewsContainers` IDs
- activation events
- `apps/vscode/webview-ui/`
- `apps/vscode/proto/`
- generated protobuf/gRPC files
- unrelated provider implementations
- secret storage or API key handling
- dangerous terminal behavior without explicit safeguards

## Validation Commands

Run from `apps/vscode/` unless stated otherwise:

```powershell
npm run install:all
npm run check-types
npm run package
```

Phase 0 baseline note: the first install attempt was still running when typecheck was attempted, so typecheck failed on missing packages. Treat this as a baseline validation issue to resolve before Phase 2, not as an intentional code change.

## Review Checklist for Future Phases

```text
[ ] Diff is limited to the approved phase scope
[ ] No runtime source changes in documentation-only phases
[ ] No webview/proto/gRPC/generated changes in v1
[ ] No change to name, command IDs, view IDs, viewsContainers IDs, or activation events
[ ] New config is fail-soft and absent config preserves upstream behavior
[ ] New storage uses StateManager/shared file-backed storage patterns, not VS Code globalState
[ ] New network calls, if any, use @/shared/net wrappers
[ ] No hard-coded API keys, tokens, or secrets
[ ] Safe command decisions deny dangerous commands before terminal execution
[ ] Model routing falls back to existing Plan/Act behavior when no role config exists
[ ] Logging redacts secrets and avoids raw ApiConfiguration dumps
[ ] npm run check-types passes before moving to the next phase
[ ] npm run package passes before VSIX work
[ ] No commits or pushes are made automatically
```