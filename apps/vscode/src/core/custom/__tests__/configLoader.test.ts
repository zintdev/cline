import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, before, beforeEach, describe, it } from "mocha"
import should from "should"
import { Logger } from "@/shared/services/Logger"
import {
	loadModelRoutingConfig,
	loadSafeCommandsConfig,
} from "../configLoader"

describe("custom config loader", () => {
	let tempDir: string
	const warnings: string[] = []

	before(() => {
		Logger.subscribe((msg: string) => {
			warnings.push(msg)
		})
	})

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cline-custom-config-"))
		warnings.length = 0
	})

	afterEach(() => {
		fs.rmSync(tempDir, { recursive: true, force: true })
	})

	function customDir(): string {
		return path.join(tempDir, "data", "custom")
	}

	function writeConfig(fileName: string, contents: string): void {
		fs.mkdirSync(customDir(), { recursive: true })
		fs.writeFileSync(path.join(customDir(), fileName), contents)
	}

	describe("safe commands config", () => {
		it("returns null when custom config directory does not exist", () => {
			const result = loadSafeCommandsConfig({ clineDir: tempDir })

			should(result).equal(null)
			warnings.should.have.length(0)
		})

		it("returns null when config file is missing", () => {
			fs.mkdirSync(customDir(), { recursive: true })

			const result = loadSafeCommandsConfig({ clineDir: tempDir })

			should(result).equal(null)
			warnings.should.have.length(0)
		})

		it("returns null and warns when JSON is invalid", () => {
			writeConfig("safe-commands.json", "{")

			const result = loadSafeCommandsConfig({ clineDir: tempDir })

			should(result).equal(null)
			warnings.should.have.length(1)
		})

		it("returns null and warns when JSON is not an object", () => {
			writeConfig("safe-commands.json", "[]")

			const result = loadSafeCommandsConfig({ clineDir: tempDir })

			should(result).equal(null)
			warnings.should.have.length(1)
		})

		it("normalizes snake_case keys and drops invalid values", () => {
			writeConfig(
				"safe-commands.json",
				JSON.stringify({
					auto_allow: ["git status", 1, "npm test"],
					require_approval: ["git push", false],
					deny: ["rm -rf", null],
					allowRedirects: "no",
				}),
			)

			const result = loadSafeCommandsConfig({ clineDir: tempDir })

			should.exist(result)
			result!.should.deepEqual({
				autoAllow: ["git status", "npm test"],
				requireApproval: ["git push"],
				deny: ["rm -rf"],
			})
			warnings.should.have.length(0)
		})

		it("loads camelCase keys", () => {
			writeConfig(
				"safe-commands.json",
				JSON.stringify({
					autoAllow: ["git status"],
					requireApproval: ["npm install"],
					deny: ["git reset --hard"],
					allowRedirects: true,
				}),
			)

			const result = loadSafeCommandsConfig({ clineDir: tempDir })

			should.exist(result)
			result!.should.deepEqual({
				autoAllow: ["git status"],
				requireApproval: ["npm install"],
				deny: ["git reset --hard"],
				allowRedirects: true,
			})
		})
	})

	describe("model routing config", () => {
		it("returns null when config file is missing", () => {
			const result = loadModelRoutingConfig({ clineDir: tempDir })

			should(result).equal(null)
			warnings.should.have.length(0)
		})

		it("returns null and warns when JSON is invalid", () => {
			writeConfig("model-routing.json", "{")

			const result = loadModelRoutingConfig({ clineDir: tempDir })

			should(result).equal(null)
			warnings.should.have.length(1)
		})

		it("loads snake_case role keys", () => {
			writeConfig(
				"model-routing.json",
				JSON.stringify({
					routing: {
						planning: { provider: "anthropic", model: "claude-opus" },
						architecture_review: { provider: "anthropic", model: "claude-sonnet" },
						terminal_debug: { provider: "openai", model: "gpt-5" },
						diff_review: { provider: "anthropic", model: "claude-haiku" },
					},
				}),
			)

			const result = loadModelRoutingConfig({ clineDir: tempDir })

			should.exist(result)
			result!.should.deepEqual({
				routing: {
					planning: { provider: "anthropic", model: "claude-opus" },
					architectureReview: { provider: "anthropic", model: "claude-sonnet" },
					terminalDebug: { provider: "openai", model: "gpt-5" },
					diffReview: { provider: "anthropic", model: "claude-haiku" },
				},
			})
		})

		it("loads camelCase role keys and drops incomplete roles", () => {
			writeConfig(
				"model-routing.json",
				JSON.stringify({
					routing: {
						implementation: { provider: "openai", model: "codex" },
						architectureReview: { provider: "anthropic", model: "claude-opus" },
						summarization: { provider: "", model: "cheap" },
						terminalDebug: { provider: "openai" },
					},
				}),
			)

			const result = loadModelRoutingConfig({ clineDir: tempDir })

			should.exist(result)
			result!.should.deepEqual({
				routing: {
					implementation: { provider: "openai", model: "codex" },
					architectureReview: { provider: "anthropic", model: "claude-opus" },
				},
			})
		})
	})
})