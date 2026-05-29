import type { CommandPermissionConfig } from "@/core/permissions"
import type { SafeCommandsConfig } from "./types"

export function safeCommandsConfigToCommandPermissionConfig(
	config: SafeCommandsConfig | null,
): CommandPermissionConfig | null {
	if (!config) {
		return null
	}

	return {
		allow: config.autoAllow,
		requireApproval: config.requireApproval,
		deny: config.deny,
		allowRedirects: config.allowRedirects,
		unmatchedCommandPolicy: "require_approval",
	}
}