import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { Logger } from "@/shared/services/Logger"
import {
	CUSTOM_CONFIG_DIR,
	MODEL_ROUTING_CONFIG_FILE,
	SAFE_COMMANDS_CONFIG_FILE,
	type ModelRoleConfig,
	type ModelRoutingConfig,
	type SafeCommandsConfig,
} from "./types"

interface CustomConfigLoaderOptions {
	clineDir?: string
}

type JsonObject = Record<string, unknown>

export function getCustomConfigDir(options: CustomConfigLoaderOptions = {}): string {
	const clineDir = options.clineDir || process.env.CLINE_DIR || path.join(os.homedir(), ".cline")
	return path.join(clineDir, "data", CUSTOM_CONFIG_DIR)
}

export function loadCustomConfig<T>(
	fileName: string,
	normalize: (value: JsonObject) => T | null,
	options: CustomConfigLoaderOptions = {},
): T | null {
	const filePath = path.join(getCustomConfigDir(options), fileName)

	let contents: string
	try {
		contents = fs.readFileSync(filePath, "utf8")
	} catch (error) {
		if (isNodeError(error) && error.code === "ENOENT") {
			return null
		}
		warn(fileName, "Failed to read", error)
		return null
	}

	let parsed: unknown
	try {
		parsed = JSON.parse(contents)
	} catch (error) {
		warn(fileName, "Failed to parse", error)
		return null
	}

	if (!isPlainObject(parsed)) {
		warn(fileName, "Expected a JSON object")
		return null
	}

	return normalize(parsed)
}

export function loadSafeCommandsConfig(options: CustomConfigLoaderOptions = {}): SafeCommandsConfig | null {
	return loadCustomConfig(SAFE_COMMANDS_CONFIG_FILE, normalizeSafeCommandsConfig, options)
}

export function loadModelRoutingConfig(options: CustomConfigLoaderOptions = {}): ModelRoutingConfig | null {
	return loadCustomConfig(MODEL_ROUTING_CONFIG_FILE, normalizeModelRoutingConfig, options)
}

function normalizeSafeCommandsConfig(value: JsonObject): SafeCommandsConfig {
	const config: SafeCommandsConfig = {}

	assignStringArray(config, "autoAllow", value.autoAllow ?? value.auto_allow)
	assignStringArray(config, "requireApproval", value.requireApproval ?? value.require_approval)
	assignStringArray(config, "deny", value.deny)

	if (typeof value.allowRedirects === "boolean") {
		config.allowRedirects = value.allowRedirects
	}

	return config
}

function normalizeModelRoutingConfig(value: JsonObject): ModelRoutingConfig {
	const rawRouting = value.routing
	if (!isPlainObject(rawRouting)) {
		return {}
	}

	const routing: NonNullable<ModelRoutingConfig["routing"]> = {}
	assignModelRole(routing, "planning", rawRouting.planning)
	assignModelRole(routing, "architectureReview", rawRouting.architectureReview ?? rawRouting.architecture_review)
	assignModelRole(routing, "implementation", rawRouting.implementation)
	assignModelRole(routing, "terminalDebug", rawRouting.terminalDebug ?? rawRouting.terminal_debug)
	assignModelRole(routing, "diffReview", rawRouting.diffReview ?? rawRouting.diff_review)
	assignModelRole(routing, "summarization", rawRouting.summarization)

	return { routing }
}

function assignStringArray(config: SafeCommandsConfig, key: "autoAllow" | "requireApproval" | "deny", value: unknown): void {
	if (!Array.isArray(value)) {
		return
	}

	const strings = value.filter((item): item is string => typeof item === "string")
	if (strings.length > 0) {
		config[key] = strings
	}
}

function assignModelRole(
	routing: NonNullable<ModelRoutingConfig["routing"]>,
	key: keyof NonNullable<ModelRoutingConfig["routing"]>,
	value: unknown,
): void {
	const role = normalizeModelRole(value)
	if (role) {
		routing[key] = role
	}
}

function normalizeModelRole(value: unknown): ModelRoleConfig | null {
	if (!isPlainObject(value)) {
		return null
	}

	if (typeof value.provider !== "string" || value.provider.trim() === "") {
		return null
	}

	if (typeof value.model !== "string" || value.model.trim() === "") {
		return null
	}

	return {
		provider: value.provider,
		model: value.model,
	}
}

function isPlainObject(value: unknown): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error
}

function warn(fileName: string, message: string, error?: unknown): void {
	const detail = error instanceof Error ? `: ${error.message}` : ""
	Logger.warn(`[cline-custom] ${message} ${fileName}${detail}`)
}