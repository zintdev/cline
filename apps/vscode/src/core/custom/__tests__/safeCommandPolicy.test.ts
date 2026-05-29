import { describe, it } from "mocha"
import should from "should"
import { safeCommandsConfigToCommandPermissionConfig } from "../safeCommandPolicy"

describe("safe command policy mapper", () => {
	it("returns null when config is null", () => {
		const result = safeCommandsConfigToCommandPermissionConfig(null)

		should(result).equal(null)
	})

	it("maps custom safe command config to command permission config", () => {
		const result = safeCommandsConfigToCommandPermissionConfig({
			autoAllow: ["git status"],
			requireApproval: ["npm install"],
			deny: ["rm -rf *"],
			allowRedirects: true,
		})

		should.exist(result)
		result!.should.deepEqual({
			allow: ["git status"],
			requireApproval: ["npm install"],
			deny: ["rm -rf *"],
			allowRedirects: true,
			unmatchedCommandPolicy: "require_approval",
		})
	})
})