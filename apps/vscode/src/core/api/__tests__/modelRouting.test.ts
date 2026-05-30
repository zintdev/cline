import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { describe, it } from "mocha"
import type { ApiConfiguration } from "@shared/api"
import type { ModelRoutingConfig } from "@/core/custom/types"

const require = createRequire(import.meta.url)
const { resolveApiConfigurationForMainTask, resolveApiConfigurationForRole } = require("../modelRouting")

function createBaseConfiguration(): ApiConfiguration {
	return {
		planModeApiProvider: "anthropic",
		actModeApiProvider: "openai-codex",
		planModeApiModelId: "plan-default",
		actModeApiModelId: "act-default",
		planModeOpenAiModelId: "plan-openai-default",
		actModeOpenAiModelId: "act-openai-default",
		planModeOpenRouterModelId: "plan-openrouter-default",
		actModeOpenRouterModelId: "act-openrouter-default",
	}
}

describe("resolveApiConfigurationForRole", () => {
	it("returns unchanged config when routing config is missing", () => {
		const configuration = createBaseConfiguration()
		const resolved = resolveApiConfigurationForRole(configuration, "plan", "planning")

		assert.deepEqual(resolved, configuration)
		assert.notEqual(resolved, configuration)
	})

	it("returns unchanged config when role is missing", () => {
		const configuration = createBaseConfiguration()
		const routingConfig: ModelRoutingConfig = {
			routing: {
				implementation: {
					provider: "openai-codex",
					model: "gpt-5.5-codex",
				},
			},
		}

		const resolved = resolveApiConfigurationForRole(configuration, "plan", "planning", routingConfig)

		assert.deepEqual(resolved, configuration)
		assert.notEqual(resolved, configuration)
	})

	it("overrides plan provider and model only for a valid planning role", () => {
		const configuration = createBaseConfiguration()
		const routingConfig: ModelRoutingConfig = {
			routing: {
				planning: {
					provider: "openai-codex",
					model: "gpt-5.5-codex-plan",
				},
			},
		}

		const resolved = resolveApiConfigurationForRole(configuration, "plan", "planning", routingConfig)

		assert.equal(resolved.planModeApiProvider, "openai-codex")
		assert.equal(resolved.planModeApiModelId, "gpt-5.5-codex-plan")
		assert.equal(resolved.actModeApiProvider, configuration.actModeApiProvider)
		assert.equal(resolved.actModeApiModelId, configuration.actModeApiModelId)
	})

	it("overrides act provider and model only for a valid implementation role", () => {
		const configuration = createBaseConfiguration()
		const routingConfig: ModelRoutingConfig = {
			routing: {
				implementation: {
					provider: "anthropic",
					model: "claude-opus-implementation",
				},
			},
		}

		const resolved = resolveApiConfigurationForRole(configuration, "act", "implementation", routingConfig)

		assert.equal(resolved.actModeApiProvider, "anthropic")
		assert.equal(resolved.actModeApiModelId, "claude-opus-implementation")
		assert.equal(resolved.planModeApiProvider, configuration.planModeApiProvider)
		assert.equal(resolved.planModeApiModelId, configuration.planModeApiModelId)
	})

	it("uses provider-specific model key for openai", () => {
		const configuration = createBaseConfiguration()
		const routingConfig: ModelRoutingConfig = {
			routing: {
				implementation: {
					provider: "openai",
					model: "gpt-openai-role",
				},
			},
		}

		const resolved = resolveApiConfigurationForRole(configuration, "act", "implementation", routingConfig)

		assert.equal(resolved.actModeApiProvider, "openai")
		assert.equal(resolved.actModeOpenAiModelId, "gpt-openai-role")
		assert.equal(resolved.actModeApiModelId, configuration.actModeApiModelId)
		assert.equal(resolved.planModeOpenAiModelId, configuration.planModeOpenAiModelId)
	})

	it("uses provider-specific model key for openrouter", () => {
		const configuration = createBaseConfiguration()
		const routingConfig: ModelRoutingConfig = {
			routing: {
				planning: {
					provider: "openrouter",
					model: "anthropic/claude-opus-route",
				},
			},
		}

		const resolved = resolveApiConfigurationForRole(configuration, "plan", "planning", routingConfig)

		assert.equal(resolved.planModeApiProvider, "openrouter")
		assert.equal(resolved.planModeOpenRouterModelId, "anthropic/claude-opus-route")
		assert.equal(resolved.planModeApiModelId, configuration.planModeApiModelId)
		assert.equal(resolved.actModeOpenRouterModelId, configuration.actModeOpenRouterModelId)
	})

	it("returns unchanged config when provider is invalid", () => {
		const configuration = createBaseConfiguration()
		const routingConfig: ModelRoutingConfig = {
			routing: {
				implementation: {
					provider: "openai-compatible",
					model: "gpt-5.5-codex",
				},
			},
		}

		const resolved = resolveApiConfigurationForRole(configuration, "act", "implementation", routingConfig)

		assert.deepEqual(resolved, configuration)
		assert.notEqual(resolved, configuration)
	})

	it("does not mutate input config", () => {
		const configuration = createBaseConfiguration()
		const originalConfiguration = { ...configuration }
		const routingConfig: ModelRoutingConfig = {
			routing: {
				planning: {
					provider: "openrouter",
					model: "anthropic/claude-opus-route",
				},
			},
		}

		resolveApiConfigurationForRole(configuration, "plan", "planning", routingConfig)

		assert.deepEqual(configuration, originalConfiguration)
	})
})

describe("resolveApiConfigurationForMainTask", () => {
	it("uses planning role for plan mode", () => {
		const configuration = createBaseConfiguration()
		const routingConfig: ModelRoutingConfig = {
			routing: {
				planning: {
					provider: "openrouter",
					model: "anthropic/claude-opus-route",
				},
				implementation: {
					provider: "openai-codex",
					model: "gpt-5.5-codex",
				},
			},
		}

		const resolved = resolveApiConfigurationForMainTask(configuration, "plan", routingConfig)

		assert.equal(resolved.planModeApiProvider, "openrouter")
		assert.equal(resolved.planModeOpenRouterModelId, "anthropic/claude-opus-route")
		assert.equal(resolved.actModeApiProvider, configuration.actModeApiProvider)
		assert.equal(resolved.actModeApiModelId, configuration.actModeApiModelId)
	})

	it("uses implementation role for act mode", () => {
		const configuration = createBaseConfiguration()
		const routingConfig: ModelRoutingConfig = {
			routing: {
				planning: {
					provider: "openrouter",
					model: "anthropic/claude-opus-route",
				},
				implementation: {
					provider: "openai",
					model: "gpt-openai-role",
				},
			},
		}

		const resolved = resolveApiConfigurationForMainTask(configuration, "act", routingConfig)

		assert.equal(resolved.actModeApiProvider, "openai")
		assert.equal(resolved.actModeOpenAiModelId, "gpt-openai-role")
		assert.equal(resolved.planModeApiProvider, configuration.planModeApiProvider)
		assert.equal(resolved.planModeApiModelId, configuration.planModeApiModelId)
	})

	it("returns unchanged cloned config when routing config is missing", () => {
		const configuration = createBaseConfiguration()

		const resolved = resolveApiConfigurationForMainTask(configuration, "plan")

		assert.deepEqual(resolved, configuration)
		assert.notEqual(resolved, configuration)
	})

	it("returns unchanged cloned config when provider is invalid", () => {
		const configuration = createBaseConfiguration()
		const routingConfig: ModelRoutingConfig = {
			routing: {
				implementation: {
					provider: "openai-compatible",
					model: "gpt-5.5-codex",
				},
			},
		}

		const resolved = resolveApiConfigurationForMainTask(configuration, "act", routingConfig)

		assert.deepEqual(resolved, configuration)
		assert.notEqual(resolved, configuration)
	})
})