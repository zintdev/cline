export interface SafeCommandsConfig {
	autoAllow?: string[]
	requireApproval?: string[]
	deny?: string[]
	allowRedirects?: boolean
}

export interface ModelRoleConfig {
	provider: string
	model: string
}

export interface ModelRoutingConfig {
	routing?: {
		planning?: ModelRoleConfig
		architectureReview?: ModelRoleConfig
		implementation?: ModelRoleConfig
		terminalDebug?: ModelRoleConfig
		diffReview?: ModelRoleConfig
		summarization?: ModelRoleConfig
	}
}

export const CUSTOM_CONFIG_DIR = "custom"
export const SAFE_COMMANDS_CONFIG_FILE = "safe-commands.json"
export const MODEL_ROUTING_CONFIG_FILE = "model-routing.json"