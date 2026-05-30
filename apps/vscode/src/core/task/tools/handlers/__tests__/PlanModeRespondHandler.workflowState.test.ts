import { createRequire } from "node:module"
import { describe, it } from "mocha"
import "should"

const require = createRequire(import.meta.url)
const { TaskState } = require("../../../TaskState")
const { PlanModeRespondHandler } = require("../PlanModeRespondHandler")

function createConfig(overrides: any = {}) {
	const taskState = overrides.taskState ?? new TaskState()
	const messages = overrides.messages ?? []

	return {
		taskState,
		mode: "plan",
		yoloModeToggled: false,
		ulid: "test-ulid",
		messageState: {
			getClineMessages: () => messages,
			saveClineMessagesAndUpdateHistory: async () => {},
		},
		api: {
			getModel: () => ({ id: "test-model", info: {} }),
		},
		services: {
			stateManager: {
				getGlobalSettingsKey: () => "plan",
				getApiConfiguration: () => ({ planModeApiProvider: "test-provider", actModeApiProvider: "test-provider" }),
			},
		},
		...overrides,
		callbacks: {
			sayAndCreateMissingParamError: async () => "missing-param",
			ask: async () => ({ text: "approved", images: [], files: [] }),
			say: async () => undefined,
			switchToActMode: async () => false,
			...overrides.callbacks,
		},
	}
}

describe("PlanModeRespondHandler workflow state", () => {
	it("defaults TaskState workflowState to idle", () => {
		const taskState = new TaskState()

		taskState.workflowState.should.equal("idle")
	})

	it("keeps workflow state as planning when more exploration is needed", async () => {
		const handler = new PlanModeRespondHandler()
		const config = createConfig()

		await handler.execute(config as any, {
			name: "plan_mode_respond",
			params: { response: "Need to inspect more files", needs_more_exploration: "true" },
		} as any)

		config.taskState.workflowState.should.equal("planning")
	})

	it("marks workflow state as waitingForPlanApproval before normal approval ask", async () => {
		const handler = new PlanModeRespondHandler()
		const config = createConfig({
			callbacks: {
				ask: async () => {
					config.taskState.workflowState.should.equal("waitingForPlanApproval")
					return { text: "approved", images: [], files: [] }
				},
			},
		})

		await handler.execute(config as any, {
			name: "plan_mode_respond",
			params: { response: "Here is the plan" },
		} as any)

		config.taskState.workflowState.should.equal("waitingForPlanApproval")
	})

	it("marks workflow state as implementationAllowed when user switches Plan to Act", async () => {
		const handler = new PlanModeRespondHandler()
		const taskState = new TaskState()
		taskState.didRespondToPlanAskBySwitchingMode = true
		const config = createConfig({
			taskState,
			callbacks: {
				ask: async () => ({ text: "PLAN_MODE_TOGGLE_RESPONSE", images: [], files: [] }),
			},
		})

		await handler.execute(config as any, {
			name: "plan_mode_respond",
			params: { response: "Here is the plan" },
		} as any)

		config.taskState.workflowState.should.equal("implementationAllowed")
		config.taskState.didRespondToPlanAskBySwitchingMode.should.be.false()
	})

	it("marks workflow state as implementationAllowed after YOLO Plan to Act auto-switch succeeds", async () => {
		const handler = new PlanModeRespondHandler()
		const messages = [{ ask: "plan_mode_respond", text: "", partial: true }]
		const config = createConfig({
			yoloModeToggled: true,
			messages,
			callbacks: {
				switchToActMode: async () => true,
			},
		})

		await handler.execute(config as any, {
			name: "plan_mode_respond",
			params: { response: "Here is the plan" },
		} as any)

		config.taskState.workflowState.should.equal("implementationAllowed")
	})
})