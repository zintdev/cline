# Cline Max Custom: Opus lập kế hoạch, Codex thực thi

**Phiên bản:** 2.0  
**Ngày:** 28/05/2026  
**Trạng thái:** Đã fork repo, chuẩn bị triển khai custom source  
**Mục tiêu tài liệu:** Dùng làm tài liệu đưa cho **Claude Opus** lập kế hoạch chi tiết và dùng **GPT/Codex** thực thi code trong repo Cline fork.

---

## 1. Mục tiêu dự án

Dự án này xây dựng một phiên bản **Cline Max Custom** từ repo Cline đã fork, với mục tiêu biến Cline thành một hệ thống agent có thể:

1. Lập kế hoạch trước khi sửa code.
2. Chọn đúng model cho từng phase.
3. Dùng **Claude Opus** cho planning, architecture, business logic và review.
4. Dùng **GPT/Codex** cho implementation, terminal execution, debugging và test-fix loop.
5. Có workflow rõ ràng: `Plan → Approve → Code → Test → Review → Release`.
6. Có safe command policy để tránh lệnh nguy hiểm.
7. Có benchmark nội bộ để đo hiệu suất trước/sau khi custom.
8. Có thể build thành VS Code extension `.vsix` riêng để dùng hằng ngày.

---

## 2. Nguyên tắc chính

### 2.1. Không để một model làm tất cả

Không dùng một model duy nhất cho toàn bộ workflow. Mỗi model có vai trò riêng:

| Phase | Model chính | Lý do |
|---|---|---|
| Requirement analysis | Claude Opus | Hiểu ngữ cảnh, phát hiện yêu cầu mơ hồ |
| Architecture planning | Claude Opus | Mạnh về reasoning dài và thiết kế hệ thống |
| Implementation | GPT/Codex | Mạnh về sửa code, terminal, test/debug |
| Test-fix loop | GPT/Codex | Tốt cho vòng lặp chạy lỗi → sửa → chạy lại |
| Diff review | Claude Opus | Review logic, side effects, kiến trúc |
| Summary/log compression | Model nhanh/rẻ | Tiết kiệm chi phí |
| File classification/context ranking | Model nhanh/rẻ hoặc embedding | Không cần model đắt |

### 2.2. Người dùng là người quyết định cuối

AI không được tự quyết định:

- Merge code.
- Push code.
- Deploy.
- Xóa dữ liệu.
- Thay đổi schema production.
- Chạy lệnh nguy hiểm.
- Ghi hoặc đọc secret không cần thiết.

### 2.3. Cline là orchestrator

Cline không phải chỉ là “chat trong VS Code”. Trong dự án này, Cline đóng vai trò:

```text
User
  ↓
Cline Custom Extension
  ↓
Agent Orchestrator
  ↓
Model Router
  ├── Claude Opus: Planner / Architect / Reviewer
  ├── GPT/Codex: Coder / Executor / Debugger
  └── Cheap/Fast Model: Summarizer / Classifier
  ↓
Tool Layer
  ├── Filesystem
  ├── Terminal
  ├── Git
  ├── MCP
  ├── Database
  └── Browser/Docs
```

---

## 3. Trạng thái hiện tại

Bạn đã thực hiện bước quan trọng nhất:

```text
Đã fork repo Cline về GitHub cá nhân.
```

Vì vậy từ giai đoạn này trở đi **không dùng Download ZIP**. Toàn bộ triển khai nên đi theo Git workflow.

---

## 4. Git workflow khuyến nghị

### 4.1. Clone fork về máy

```bash
# Clone fork của bạn, thay <your-username> bằng GitHub username thật
git clone https://github.com/<your-username>/cline.git
cd cline
```

### 4.2. Thêm upstream repo gốc

```bash
git remote add upstream https://github.com/cline/cline.git
git remote -v
```

### 4.3. Tạo branch custom chính

```bash
git checkout -b custom/dev
```

### 4.4. Chiến lược branch

```text
main
  └── chỉ dùng để sync upstream

custom/dev
  └── branch phát triển chính

custom/model-routing
  └── model routing layer

custom/safe-commands
  └── safe command policy

custom/workflow-orchestrator
  └── Plan → Code → Test → Review workflow

custom/context-ranking
  └── chọn context/file liên quan tốt hơn

release/v1
  └── branch ổn định để build VSIX
```

### 4.5. Sync upstream định kỳ

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main

git checkout custom/dev
git merge main
```

---

## 5. Vai trò của Claude Opus

Claude Opus là **Planner / Architect / Reviewer**.

### 5.1. Nhiệm vụ của Opus

Opus không nên trực tiếp sửa code trước khi có plan rõ ràng. Opus nên làm:

1. Đọc repo Cline fork.
2. Xác định cấu trúc extension.
3. Tìm nơi cần can thiệp source.
4. Lập kế hoạch thay đổi theo từng phase.
5. Thiết kế interface/config cho model routing.
6. Thiết kế safe command policy.
7. Thiết kế workflow state machine.
8. Viết task breakdown cho Codex.
9. Review diff do Codex tạo.
10. Đánh giá rủi ro và side effects.

### 5.2. Prompt đưa cho Opus để lập kế hoạch

Dùng prompt sau trong Cline hoặc chat riêng với Opus:

```md
You are the Planner, Architect, and Reviewer for a custom fork of the Cline VS Code extension.

Project goal:
Build “Cline Max Custom”, where Claude Opus plans/reviews and GPT/Codex implements/debugs.

Current status:
- The Cline repository has already been forked.
- We want to modify the forked extension source, not just use .clinerules.
- We want a clear handoff plan for Codex to implement.

Your job:
1. Inspect the repository structure.
2. Identify where Cline handles:
   - model provider selection,
   - task lifecycle,
   - tool execution,
   - terminal command approval,
   - custom instructions/rules,
   - MCP configuration,
   - diff display and file edits.
3. Propose a minimal safe implementation plan.
4. Do not edit files yet.
5. Output a task breakdown for Codex.

Required output:
- Repository map.
- Candidate files to inspect.
- Proposed architecture.
- Implementation phases.
- Risks.
- Tests/checks to run.
- Codex-ready tasks with acceptance criteria.
```

### 5.3. Output Opus bắt buộc phải tạo

Opus phải tạo các phần sau:

```text
1. Repository Map
2. Where to Modify
3. Proposed Architecture
4. Implementation Plan
5. Codex Task List
6. Acceptance Criteria
7. Risk Checklist
8. Test Plan
```

---

## 6. Vai trò của GPT/Codex

GPT/Codex là **Coder / Executor / Debugger**.

### 6.1. Nhiệm vụ của Codex

Codex không nên tự đổi kiến trúc lớn nếu Opus chưa plan. Codex làm:

1. Thực thi task do Opus chia nhỏ.
2. Sửa file theo acceptance criteria.
3. Chạy lint/test/build.
4. Đọc lỗi terminal.
5. Sửa lỗi theo vòng lặp giới hạn.
6. Tạo summary diff.
7. Không chạy lệnh nguy hiểm nếu chưa có approval.

### 6.2. Prompt đưa cho Codex để thực thi

```md
You are the Implementation and Debugging Agent for a custom Cline fork.

You must follow the plan produced by Claude Opus.

Rules:
1. Do not redesign the architecture unless the plan is impossible.
2. Make small, reviewable changes.
3. Preserve existing behavior unless explicitly changed.
4. Add professional comments only where they explain important custom logic.
5. Run the relevant tests/build/lint checks when available.
6. If a command is risky, ask for approval first.
7. After implementation, summarize changed files and remaining risks.

Your task:
Implement the specific task below.

Task:
{{PASTE_ONE_CODEX_TASK_FROM_OPUS_HERE}}

Acceptance criteria:
{{PASTE_ACCEPTANCE_CRITERIA_HERE}}

Output required:
- Files changed.
- What was implemented.
- Commands run.
- Test/build result.
- Remaining risks.
```

---

## 7. Workflow chính: Opus plan, Codex code

### 7.1. Workflow tổng quát

```text
1. User mở repo Cline fork trong VS Code.
2. User yêu cầu Opus đọc repo và lập kế hoạch.
3. Opus tạo repository map và task breakdown.
4. User duyệt plan.
5. User giao từng task nhỏ cho Codex.
6. Codex implement.
7. Codex chạy check/test/build.
8. Opus review diff.
9. Codex sửa lại nếu Opus phát hiện lỗi.
10. User duyệt cuối và commit.
```

### 7.2. Workflow một task cụ thể

```text
User → Opus:
  “Hãy lập kế hoạch thêm safe command policy vào Cline fork. Chưa sửa code.”

Opus → User:
  “Cần sửa A, B, C. Đây là task cho Codex.”

User → Codex:
  “Thực hiện Task 1: thêm config safe-commands.json loader.”

Codex → Repo:
  Sửa code, chạy test/build.

User → Opus:
  “Review diff này.”

Opus → User:
  Đánh giá rủi ro, bug, đề xuất sửa.

User → Codex:
  “Sửa theo review.”
```

---

## 8. Các phase triển khai source custom

## Phase 0: Baseline

### Mục tiêu

Chạy được repo Cline fork ở chế độ dev extension trước khi sửa lớn.

### Việc cần làm

1. Clone fork.
2. Cài dependencies theo README repo.
3. Mở bằng VS Code.
4. Chạy Extension Development Host.
5. Kiểm tra extension custom chạy được.

### Acceptance criteria

- Extension dev host mở được.
- Cline panel hoạt động.
- Có thể gửi prompt test.
- Không có lỗi build nghiêm trọng.

---

## Phase 1: Đổi identity extension custom

### Mục tiêu

Tách extension custom khỏi Cline chính thức để tránh conflict.

### Việc cần làm

1. Đổi `name`.
2. Đổi `displayName`.
3. Đổi `publisher`.
4. Đổi namespace config nếu cần.
5. Đổi icon nếu muốn.

### Ví dụ

```json
{
  "name": "cline-max-custom",
  "displayName": "Cline Max Custom",
  "publisher": "your-name"
}
```

### Acceptance criteria

- Extension custom không đè extension Cline gốc.
- Có thể cài song song hoặc ít nhất không gây nhầm identity.
- Build VSIX không lỗi do metadata.

---

## Phase 2: Logging và trace

### Mục tiêu

Trước khi thêm routing/phức tạp hóa workflow, cần log rõ agent đang làm gì.

### Cần log

```text
- Task ID
- Selected model
- Phase hiện tại
- Files read
- Files modified
- Tools called
- Terminal commands requested
- Commands approved/denied
- Token/cost estimate nếu có
- Error/test result
```

### Acceptance criteria

- Có log dễ đọc cho mỗi task.
- Không log secret/API key.
- Có thể bật/tắt log bằng config.

---

## Phase 3: Safe command policy

### Mục tiêu

Kiểm soát lệnh terminal.

### Config đề xuất

```json
{
  "auto_allow": [
    "git status",
    "git diff",
    "rg",
    "grep",
    "npm test",
    "npm run lint",
    "pytest",
    "ruff check",
    "mypy",
    "pnpm test",
    "yarn test"
  ],
  "require_approval": [
    "npm install",
    "pnpm install",
    "pip install",
    "alembic upgrade",
    "dbt run",
    "docker compose up",
    "docker compose down"
  ],
  "deny": [
    "rm -rf",
    "git reset --hard",
    "git push --force",
    "curl * | sh",
    "wget * | sh",
    "chmod 777",
    "sudo rm",
    "drop database",
    "truncate table"
  ]
}
```

### Acceptance criteria

- Lệnh trong `deny` bị chặn.
- Lệnh trong `require_approval` phải hỏi người dùng.
- Lệnh trong `auto_allow` có thể chạy nếu user bật chế độ này.
- Có log cho quyết định allow/deny/approval.

---

## Phase 4: Model routing

### Mục tiêu

Thêm cơ chế chọn model theo phase.

### Config đề xuất

```json
{
  "routing": {
    "planning": {
      "provider": "anthropic",
      "model": "claude-opus-4.7"
    },
    "architecture_review": {
      "provider": "anthropic",
      "model": "claude-opus-4.7"
    },
    "implementation": {
      "provider": "openai-compatible",
      "model": "gpt-5.5-codex"
    },
    "terminal_debug": {
      "provider": "openai-compatible",
      "model": "gpt-5.5-codex"
    },
    "diff_review": {
      "provider": "anthropic",
      "model": "claude-opus-4.7"
    },
    "summarization": {
      "provider": "openai-compatible",
      "model": "cheap-fast-model"
    }
  }
}
```

### Acceptance criteria

- Có config routing đọc từ file hoặc settings.
- Phase planning dùng Opus.
- Phase implementation/debug dùng Codex.
- Có fallback model nếu model chính lỗi.
- Có log model được chọn.

---

## Phase 5: Workflow state machine

### Mục tiêu

Không để agent nhảy thẳng vào sửa code cho task lớn.

### State đề xuất

```text
IDLE
  ↓
ANALYZE_REQUIREMENT
  ↓
PLAN_WITH_OPUS
  ↓
WAIT_FOR_USER_APPROVAL
  ↓
IMPLEMENT_WITH_CODEX
  ↓
RUN_TESTS
  ↓
REVIEW_WITH_OPUS
  ↓
WAIT_FOR_FINAL_APPROVAL
  ↓
DONE
```

### Acceptance criteria

- Task lớn bắt buộc đi qua phase plan.
- User có thể approve/reject plan.
- Codex chỉ code sau khi plan được duyệt.
- Review phase có thể tạo follow-up task cho Codex.

---

## Phase 6: Context ranking

### Mục tiêu

Giảm context thừa, tăng khả năng chọn đúng file.

### Logic đề xuất

1. Dùng keyword search (`rg`) để lấy candidate files.
2. Dùng repo map để hiểu folder chính.
3. Dùng model rẻ/embedding để rank file.
4. Chỉ đưa top relevant files vào prompt planner/coder.
5. Luôn cho agent yêu cầu thêm file nếu thiếu.

### Acceptance criteria

- Agent không đọc quá nhiều file không liên quan.
- Task log hiển thị file nào được chọn và vì sao.
- User có thể override hoặc pin file quan trọng.

---

## Phase 7: Auto-test / auto-fix loop

### Mục tiêu

Cho Codex tự chạy test/lint và sửa lỗi trong giới hạn an toàn.

### Rule đề xuất

```json
{
  "max_retry_loops": 3,
  "allowed_test_commands": [
    "npm test",
    "npm run lint",
    "pnpm test",
    "pytest",
    "ruff check"
  ],
  "stop_if": [
    "same_error_repeated_2_times",
    "requires_external_service",
    "requires_secret",
    "dangerous_command_needed"
  ]
}
```

### Acceptance criteria

- Codex được phép thử sửa lỗi tối đa 3 vòng.
- Nếu lỗi lặp lại, dừng và báo người dùng.
- Không tự cài dependency lớn nếu chưa duyệt.
- Summary phải ghi rõ command và kết quả.

---

## Phase 8: Build VSIX

### Mục tiêu

Build extension custom thành file `.vsix`.

### Lệnh thường dùng

```bash
npm install -g @vscode/vsce
vsce package
```

### Cài VSIX

```bash
code --install-extension path/to/cline-max-custom.vsix
```

Hoặc trong VS Code:

```text
Extensions → ... → Install from VSIX
```

### Acceptance criteria

- Build tạo file `.vsix` thành công.
- Cài được vào VS Code.
- Extension mở được.
- Có thể cấu hình model provider.
- Không conflict với bản Cline gốc.

---

## 9. Thứ tự task đưa cho Opus và Codex

## Task Group A: Repo discovery

### A1 - Opus task

```md
Inspect the Cline fork repository and produce a repository map.
Do not edit files.
Focus on locating extension activation, provider routing, task lifecycle, tool execution, terminal approval, custom rules, and MCP integration.
```

### A2 - Codex task

```md
Add a developer note file `docs/custom-repo-map.md` based on the approved repository map.
Do not change runtime behavior.
```

---

## Task Group B: Extension identity

### B1 - Opus task

```md
Find all package metadata and extension identity fields that must be changed to create a separate custom VS Code extension identity.
List exact files and fields.
Do not edit files.
```

### B2 - Codex task

```md
Implement the approved extension identity changes.
Rename the custom extension to `Cline Max Custom`.
Ensure package/build metadata remains valid.
Run the relevant package/build check.
```

---

## Task Group C: Safe commands

### C1 - Opus task

```md
Design a safe command policy for Cline Max Custom.
Locate the terminal command execution/approval path in the source.
Propose the minimal modification points.
Do not edit files.
```

### C2 - Codex task

```md
Implement safe command policy loading and enforcement based on the approved plan.
Add config support for auto_allow, require_approval, and deny.
Add tests or a manual verification script if automated tests are not available.
```

---

## Task Group D: Model routing

### D1 - Opus task

```md
Design model routing for phases: planning, implementation, terminal_debug, diff_review, summarization.
Locate current model/provider selection logic.
Propose a minimal config-driven router.
Do not edit files.
```

### D2 - Codex task

```md
Implement the model routing layer according to the approved design.
Add config examples.
Ensure existing single-model behavior still works as fallback.
Run build/typecheck.
```

---

## Task Group E: Workflow state machine

### E1 - Opus task

```md
Design a Plan → Approve → Code → Test → Review workflow state machine.
Identify where to integrate it without breaking existing Cline Plan/Act behavior.
Do not edit files.
```

### E2 - Codex task

```md
Implement the approved workflow state machine minimally.
Ensure task state is visible in logs or UI.
Do not block existing simple task flow unless strict mode is enabled.
```

---

## Task Group F: Benchmark

### F1 - Opus task

```md
Design a benchmark suite for Cline Max Custom.
Include scoring criteria for code correctness, test success, safety, diff quality, and user intervention count.
Do not edit source files.
```

### F2 - Codex task

```md
Create the benchmark folder structure and starter benchmark files.
Do not implement a complex runner yet unless requested.
```

---

## 10. Benchmark nội bộ

### 10.1. Cấu trúc thư mục

```text
benchmark/
  tasks/
    001-extension-identity.md
    002-safe-command-policy.md
    003-model-routing.md
    004-workflow-state-machine.md
    005-build-vsix.md
  expected/
  results/
  scoring.md
  run-log.md
```

### 10.2. Scoring

| Tiêu chí | Điểm |
|---|---:|
| Hiểu đúng yêu cầu | 15 |
| Xác định đúng file | 15 |
| Sửa đúng phạm vi | 20 |
| Không phá behavior cũ | 15 |
| Build/test pass | 15 |
| Log/summary rõ | 10 |
| Không vi phạm safety | 10 |
| **Tổng** | **100** |

### 10.3. Mức đánh giá

| Điểm | Đánh giá |
|---:|---|
| 90–100 | Excellent |
| 80–89 | Good |
| 70–79 | Usable but needs review |
| 60–69 | Risky |
| < 60 | Failed |

---

## 11. Rules cho `.clinerules`

Tạo thư mục:

```text
.clinerules/
  01-project-overview.md
  02-agent-roles.md
  03-opus-planning-rules.md
  04-codex-implementation-rules.md
  05-safe-command-policy.md
  06-review-checklist.md
  07-do-not-touch.md
```

### 11.1. `02-agent-roles.md`

```md
# Agent Roles

Claude Opus is the Planner, Architect, and Reviewer.
GPT/Codex is the Coder, Executor, and Debugger.

For large or risky tasks:
1. Use Opus to analyze and plan first.
2. Wait for user approval.
3. Use Codex to implement the approved task.
4. Run tests/build checks.
5. Use Opus to review the diff.
6. Wait for final user approval.

Do not let a single model redesign, implement, and approve its own work for risky tasks.
```

### 11.2. `03-opus-planning-rules.md`

```md
# Opus Planning Rules

When acting as planner:
1. Read relevant files first.
2. Do not edit files.
3. Produce a repository map.
4. Identify minimal safe change points.
5. Break work into Codex-ready tasks.
6. Add acceptance criteria for each task.
7. Identify risks and tests.
8. Ask for approval before implementation.
```

### 11.3. `04-codex-implementation-rules.md`

```md
# Codex Implementation Rules

When acting as implementer:
1. Follow the approved Opus plan.
2. Do not redesign architecture unless the plan is impossible.
3. Make small, reviewable patches.
4. Preserve existing behavior unless explicitly changed.
5. Run relevant build/test/lint checks.
6. Stop after 3 failed fix attempts.
7. Summarize files changed, commands run, and risks.
```

---

## 12. Checklist trước khi cho Codex sửa code

Trước khi giao task cho Codex, phải có:

```text
[ ] Opus đã đọc repo/file liên quan.
[ ] Opus đã tạo plan.
[ ] Plan có danh sách file cần sửa.
[ ] Plan có acceptance criteria.
[ ] Plan có test/build command đề xuất.
[ ] User đã duyệt plan.
[ ] Task cho Codex đủ nhỏ.
[ ] Không yêu cầu Codex tự quyết định kiến trúc lớn.
```

---

## 13. Checklist sau khi Codex sửa code

Sau khi Codex implement:

```text
[ ] Có danh sách file đã sửa.
[ ] Có summary thay đổi.
[ ] Có command đã chạy.
[ ] Có kết quả test/build/lint.
[ ] Không có lệnh nguy hiểm không được duyệt.
[ ] Diff nhỏ và dễ review.
[ ] Opus đã review diff nếu task quan trọng.
[ ] User đã duyệt trước khi commit.
```

---

## 14. Commit workflow

Không để AI tự push trực tiếp lúc đầu.

### 14.1. Sau mỗi task

```bash
git status
git diff
```

### 14.2. Nếu ổn

```bash
git add .
git commit -m "feat: add safe command policy foundation"
```

### 14.3. Nếu muốn AI viết commit message

Prompt:

```md
Review the staged diff and draft a concise conventional commit message.
Do not commit automatically.
```

---

## 15. Rủi ro chính

| Rủi ro | Mức độ | Cách kiểm soát |
|---|---:|---|
| Codex sửa rộng hơn plan | Cao | Chia task nhỏ, review diff |
| Opus plan quá phức tạp | Trung bình | Yêu cầu minimal safe implementation |
| Build Cline lỗi do upstream thay đổi | Cao | Sync upstream cẩn thận, branch riêng |
| Extension identity conflict | Trung bình | Đổi package metadata/namespace |
| Safe command policy chặn nhầm | Trung bình | Có override thủ công |
| Model routing phá fallback cũ | Cao | Fallback về single-model behavior |
| Log lộ secret | Rất cao | Mask secret, không log env/token |
| VSIX lỗi | Trung bình | Test bằng Extension Development Host trước |

---

## 16. Quy tắc bảo mật

Bắt buộc:

1. Không hard-code API key.
2. Không đưa API key vào `.clinerules`.
3. Không log `.env`.
4. Không log request chứa token.
5. Không auto-run `rm -rf`, `git reset --hard`, `git push --force`.
6. Không chạy migration/database destructive command nếu chưa duyệt.
7. Không dùng production repo để test extension mới.
8. Không cài VSIX từ nguồn không kiểm soát.

---

## 17. Cách sử dụng sau khi build xong

### 17.1. Cài extension custom

```bash
code --install-extension path/to/cline-max-custom.vsix
```

### 17.2. Mở repo cần làm việc

```bash
code path/to/your-project
```

### 17.3. Dùng workflow chuẩn

```text
1. Tạo branch Git mới.
2. Mở Cline Max Custom.
3. Gửi task.
4. Yêu cầu Opus lập plan.
5. Duyệt plan.
6. Cho Codex implement.
7. Chạy test/lint.
8. Cho Opus review.
9. Sửa follow-up nếu cần.
10. Commit thủ công.
```

---

## 18. Prompt sử dụng hằng ngày

### 18.1. Prompt cho task lớn

```md
Use the Opus-planner / Codex-implementer workflow.

First, act as Opus planner:
- Read relevant files.
- Do not edit yet.
- Summarize current behavior.
- Propose a minimal safe plan.
- List files to modify.
- Add acceptance criteria.
- Wait for my approval.
```

### 18.2. Prompt cho implementation

```md
Now act as Codex implementer.
Follow the approved plan exactly.
Make small changes only.
Run the relevant checks.
Stop and ask if you need a risky command.
Summarize files changed and results.
```

### 18.3. Prompt cho review

```md
Now act as Opus reviewer.
Review the diff for:
- correctness,
- architecture impact,
- unintended side effects,
- missing tests,
- unsafe behavior,
- business logic risks.
Do not edit files.
Return required fixes and optional improvements separately.
```

---

## 19. Định nghĩa thành công của bản v1

Bản v1 thành công khi:

```text
[ ] Repo fork chạy được ở dev extension host.
[ ] Extension custom có identity riêng.
[ ] Có docs/custom-repo-map.md.
[ ] Có .clinerules cho Opus/Codex workflow.
[ ] Có safe command policy bản đầu.
[ ] Có model routing config bản đầu hoặc thiết kế rõ ràng.
[ ] Có benchmark folder.
[ ] Build được VSIX.
[ ] Cài được VSIX vào VS Code.
[ ] Hoàn thành ít nhất 3 benchmark task với điểm ≥ 80/100.
```

---

## 20. Roadmap ngắn gọn

```text
Day 1:
- Clone fork.
- Run dev extension.
- Ask Opus to map repo.
- Create docs/custom-repo-map.md.

Day 2:
- Change extension identity.
- Build/test dev version.
- Add .clinerules.

Day 3:
- Add safe command policy.
- Add logging.

Day 4:
- Design and implement model routing.

Day 5:
- Add workflow state machine strict mode.
- Add benchmark folder.

Day 6+:
- Build VSIX.
- Test on sample repo.
- Iterate based on failures.
```

---

## 21. Kết luận

Vì bạn đã fork repo, hướng đúng tiếp theo là:

```text
Fork repo đã có
→ Clone fork về máy
→ Chạy Cline extension ở dev mode
→ Dùng Opus đọc repo và lập kế hoạch
→ Dùng Codex thực thi từng task nhỏ
→ Dùng Opus review diff
→ Build VSIX custom
→ Cài và dùng như extension riêng
```

Phân vai cuối cùng:

```text
User = Product Owner / Final Reviewer
Cline = Orchestrator / Extension Runtime
Claude Opus = Planner / Architect / Reviewer
GPT/Codex = Coder / Executor / Debugger
Cheap Model = Summarizer / Classifier
Benchmark = Quality Gate
Git = Safety Net / Rollback System
```

Nguyên tắc quan trọng nhất:

```text
Opus lập kế hoạch. Codex thực thi. User duyệt. Benchmark kiểm chứng.
```

---

## 22. Nguồn tham khảo

- Cline GitHub: https://github.com/cline/cline
- Cline overview: https://docs.cline.bot/cline-overview
- Cline MCP overview: https://docs.cline.bot/mcp/mcp-overview
- Cline rules: https://docs.cline.bot/customization/cline-rules
- VS Code publishing extensions: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- VS Code install from VSIX: https://code.visualstudio.com/docs/configure/extensions/extension-marketplace
