export const WORKFLOW_STATES = ["idle", "planning", "waitingForPlanApproval", "implementationAllowed"] as const

export type WorkflowState = (typeof WORKFLOW_STATES)[number]

export function isWorkflowState(value: unknown): value is WorkflowState {
	return typeof value === "string" && WORKFLOW_STATES.includes(value as WorkflowState)
}

export function normalizeWorkflowState(value: unknown): WorkflowState {
	return isWorkflowState(value) ? value : "idle"
}

export function enterPlanning(_currentState?: unknown): WorkflowState {
	return "planning"
}

export function enterWaitingForPlanApproval(_currentState?: unknown): WorkflowState {
	return "waitingForPlanApproval"
}

export function resetWorkflowState(_currentState?: unknown): WorkflowState {
	return "idle"
}

export function approvePlanForImplementation(currentState?: unknown): WorkflowState {
	const state = normalizeWorkflowState(currentState)

	if (state === "waitingForPlanApproval" || state === "planning") {
		return "implementationAllowed"
	}

	return state
}