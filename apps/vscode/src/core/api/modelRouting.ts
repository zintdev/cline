import type { ApiConfiguration, ApiProvider } from "@shared/api"
import type { Mode } from "@shared/storage/types"
import type { ModelRoutingConfig } from "@/core/custom/types"
import { Logger } from "@/shared/services/Logger"

export type ModelRoutingRole = keyof NonNullable<ModelRoutingConfig["routing"]>

const supportedApiProviders = new Set<ApiProvider>([
	"anthropic",
	"claude-code",
	"openrouter",
	"bedrock",
	"vertex",
	"openai",
	"ollama",
	"lmstudio",
	"gemini",
	"openai-native",
	"openai-codex",
	"requesty",
	"together",
	"deepseek",
	"qwen",
	"qwen-code",
	"doubao",
	"mistral",
	"vscode-lm",
	"cline",
	"litellm",
	"moonshot",
	"nebius",
	"fireworks",
	"asksage",
	"xai",
	"sambanova",
	"cerebras",
	"sapaicore",
	"groq",
	"huggingface",
	"huawei-cloud-maas",
	"dify",
	"baseten",
	"vercel-ai-gateway",
	"zai",
	"oca",
	"aihubmix",
	"minimax",
	"hicap",
	"nousResearch",
	"wandb",
])

function isSupportedApiProvider(provider: string): provider is ApiProvider {
	return supportedApiProviders.has(provider as ApiProvider)
}

function getProviderModelIdKey(provider: ApiProvider, mode: Mode): keyof ApiConfiguration {
	const prefix = mode === "plan" ? "planMode" : "actMode"

	switch (provider) {
		case "openai":
			return `${prefix}OpenAiModelId` as keyof ApiConfiguration
		case "openrouter":
			return `${prefix}OpenRouterModelId` as keyof ApiConfiguration
		case "ollama":
			return `${prefix}OllamaModelId` as keyof ApiConfiguration
		case "lmstudio":
			return `${prefix}LmStudioModelId` as keyof ApiConfiguration
		case "requesty":
			return `${prefix}RequestyModelId` as keyof ApiConfiguration
		case "fireworks":
			return `${prefix}FireworksModelId` as keyof ApiConfiguration
		case "together":
			return `${prefix}TogetherModelId` as keyof ApiConfiguration
		case "vscode-lm":
			return `${prefix}VsCodeLmModelSelector` as keyof ApiConfiguration
		case "cline":
			return `${prefix}ClineModelId` as keyof ApiConfiguration
		case "litellm":
			return `${prefix}LiteLlmModelId` as keyof ApiConfiguration
		case "huggingface":
			return `${prefix}HuggingFaceModelId` as keyof ApiConfiguration
		case "huawei-cloud-maas":
			return `${prefix}HuaweiCloudMaasModelId` as keyof ApiConfiguration
		case "vercel-ai-gateway":
			return `${prefix}VercelAiGatewayModelId` as keyof ApiConfiguration
		case "oca":
			return `${prefix}OcaModelId` as keyof ApiConfiguration
		case "aihubmix":
			return `${prefix}AihubmixModelId` as keyof ApiConfiguration
		case "hicap":
			return `${prefix}HicapModelId` as keyof ApiConfiguration
		case "nousResearch":
			return `${prefix}NousResearchModelId` as keyof ApiConfiguration
		default:
			return `${prefix}ApiModelId` as keyof ApiConfiguration
	}
}

type ModelIdConfigKey = ReturnType<typeof getProviderModelIdKey>

function setModelIdForProvider(
	configuration: ApiConfiguration,
	provider: ApiProvider,
	mode: Mode,
	model: string,
): void {
	const key = getProviderModelIdKey(provider, mode)
	;(configuration as Partial<Record<ModelIdConfigKey, string>>)[key] = model
}

export function resolveApiConfigurationForRole(
	configuration: ApiConfiguration,
	mode: Mode,
	role: ModelRoutingRole,
	routingConfig?: ModelRoutingConfig | null,
): ApiConfiguration {
	const route = routingConfig?.routing?.[role]
	if (!route?.provider || !route.model) {
		return { ...configuration }
	}

	if (!isSupportedApiProvider(route.provider)) {
		Logger.warn(`[cline-custom] Ignoring model routing for role ${role}: unsupported provider ${route.provider}`)
		return { ...configuration }
	}

	const resolvedConfiguration: ApiConfiguration = { ...configuration }
	const providerKey = mode === "plan" ? "planModeApiProvider" : "actModeApiProvider"
	resolvedConfiguration[providerKey] = route.provider
	setModelIdForProvider(resolvedConfiguration, route.provider, mode, route.model)

	return resolvedConfiguration
}