import assert from "node:assert/strict"
import { describe, it } from "mocha"
import { shouldAutoApproveCommand } from "../ExecuteCommandToolHandler"

function decide(options: Partial<Parameters<typeof shouldAutoApproveCommand>[0]> = {}) {
	return shouldAutoApproveCommand({
		isSubagentExecution: false,
		requiresApprovalPerLLM: false,
		requiresApprovalByPolicy: false,
		autoApproveSafe: false,
		autoApproveAll: false,
		...options,
	})
}

describe("ExecuteCommandToolHandler safe command policy approval", () => {
	it("allows subagent auto-approval only when policy does not require approval", () => {
		assert.equal(decide({ isSubagentExecution: true, requiresApprovalByPolicy: false }), true)
		assert.equal(decide({ isSubagentExecution: true, requiresApprovalByPolicy: true }), false)
	})

	it("allows normal safe auto-approval only when no approval is required", () => {
		assert.equal(decide({ autoApproveSafe: true }), true)
		assert.equal(decide({ autoApproveSafe: false }), false)
		assert.equal(decide({ autoApproveSafe: undefined }), false)
		assert.equal(decide({ requiresApprovalPerLLM: true, autoApproveSafe: true }), false)
		assert.equal(decide({ requiresApprovalByPolicy: true, autoApproveSafe: true }), false)
	})

	it("allows LLM-required approval only with safe and all-command auto-approval", () => {
		assert.equal(decide({ requiresApprovalPerLLM: true, autoApproveSafe: true, autoApproveAll: true }), true)
		assert.equal(decide({ requiresApprovalPerLLM: true, autoApproveSafe: true, autoApproveAll: false }), false)
		assert.equal(decide({ requiresApprovalPerLLM: true, autoApproveSafe: false, autoApproveAll: true }), false)
		assert.equal(decide({ requiresApprovalPerLLM: true, autoApproveSafe: undefined, autoApproveAll: true }), false)
		assert.equal(decide({ requiresApprovalPerLLM: true, autoApproveSafe: true, autoApproveAll: undefined }), false)
	})

	it("blocks policy-required approval even when safe auto-approval is enabled", () => {
		assert.equal(decide({ requiresApprovalByPolicy: true, autoApproveSafe: true }), false)
	})

	it("blocks policy-required approval even when all-command auto-approval is enabled", () => {
		assert.equal(decide({ requiresApprovalByPolicy: true, autoApproveSafe: true, autoApproveAll: true }), false)
	})

	it("blocks policy-required approval for subagent execution", () => {
		assert.equal(decide({ isSubagentExecution: true, requiresApprovalByPolicy: true }), false)
	})
})