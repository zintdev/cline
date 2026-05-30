import { describe, it } from "mocha"
import "should"
import {
	approvePlanForImplementation,
	enterPlanning,
	enterWaitingForPlanApproval,
	isWorkflowState,
	normalizeWorkflowState,
	resetWorkflowState,
	WORKFLOW_STATES,
} from "../workflowState"

describe("workflowState", () => {
	it("defines the minimal Phase 5.1a workflow state set", () => {
		WORKFLOW_STATES.should.deepEqual(["idle", "planning", "waitingForPlanApproval", "implementationAllowed"])
	})

	it("identifies valid workflow states", () => {
		isWorkflowState("idle").should.be.true()
		isWorkflowState("planning").should.be.true()
		isWorkflowState("waitingForPlanApproval").should.be.true()
		isWorkflowState("implementationAllowed").should.be.true()
	})

	it("rejects invalid or missing workflow states without throwing", () => {
		isWorkflowState(undefined).should.be.false()
		isWorkflowState(null).should.be.false()
		isWorkflowState("unknown").should.be.false()
		isWorkflowState({ state: "planning" }).should.be.false()
	})

	it("normalizes invalid or missing states to idle", () => {
		normalizeWorkflowState(undefined).should.equal("idle")
		normalizeWorkflowState(null).should.equal("idle")
		normalizeWorkflowState("unknown").should.equal("idle")
		normalizeWorkflowState("planning").should.equal("planning")
	})

	it("enters planning from any current state", () => {
		enterPlanning().should.equal("planning")
		enterPlanning("idle").should.equal("planning")
		enterPlanning("implementationAllowed").should.equal("planning")
		enterPlanning("invalid").should.equal("planning")
	})

	it("enters waiting for plan approval from any current state", () => {
		enterWaitingForPlanApproval().should.equal("waitingForPlanApproval")
		enterWaitingForPlanApproval("planning").should.equal("waitingForPlanApproval")
		enterWaitingForPlanApproval("implementationAllowed").should.equal("waitingForPlanApproval")
		enterWaitingForPlanApproval("invalid").should.equal("waitingForPlanApproval")
	})

	it("resets workflow state to idle from any current state", () => {
		resetWorkflowState().should.equal("idle")
		resetWorkflowState("planning").should.equal("idle")
		resetWorkflowState("waitingForPlanApproval").should.equal("idle")
		resetWorkflowState("implementationAllowed").should.equal("idle")
		resetWorkflowState("invalid").should.equal("idle")
	})

	it("approves planning states for implementation", () => {
		approvePlanForImplementation("planning").should.equal("implementationAllowed")
		approvePlanForImplementation("waitingForPlanApproval").should.equal("implementationAllowed")
	})

	it("handles approval fallback safely for invalid or non-approval states", () => {
		approvePlanForImplementation().should.equal("idle")
		approvePlanForImplementation("invalid").should.equal("idle")
		approvePlanForImplementation("idle").should.equal("idle")
		approvePlanForImplementation("implementationAllowed").should.equal("implementationAllowed")
	})
})