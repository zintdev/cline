# Command Execution Safety

- Do not run long shell commands.
- Do not use `cat <<EOF`, `cat > file`, `printf`, or `tee` to create source files.
- Do not chain many commands with `&&`, `;`, or `|`.
- Do not create multiple files in one shell command.
- Use direct file edits one file at a time.
- After file edits, stop and show the diff before validation.
- Ask before running any command longer than 120 characters.
- Ask before running any command expected to take more than 60 seconds.
- Run validation commands one by one.
- Stop immediately if a command fails or appears to hang.

When working inside the WSL workspace, do not run Windows shell commands such as:

- `cmd /c ...`
- `powershell.exe ...`
- Windows path commands using backslashes like `apps\vscode\...`

Use Linux/WSL commands instead.

Bad:

```cmd
cmd /c dir /s /b apps\vscode\src\*.test.ts 2>nul

Good:

find apps/vscode/src -name "*.test.ts" 2>/dev/null
