# Ask UI 技能设计

## 1. 目标

`ask-ui` 是一个独立、Agent 无关的多问题交互技能。它把其他 Agent 工作流在同一轮需要询问的多个独立问题转换为本地网页表单，展示推荐答案，持久化用户回答，并让原工作流在同一个对话或会话中继续。

典型调用方包括 `grilling`、需求澄清、配置向导、规划和其他一次需要询问两个及以上问题的技能。调用方负责决定问什么以及问题之间的依赖关系；`ask-ui` 只负责问题展示、回答收集、会话状态和可选的 Agent 续接。

传播定位：

> Ask UI：一次问完，选完再聊。

## 2. 设计原则

- 保持 Agent 无关：核心协议不依赖 Codex、Claude Code 或特定模型 API。
- 技能与数据分离：技能目录只保存程序和资源，运行数据保存在当前工作目录。
- 多轮可恢复：一次任务对应一个 Session，每批问题对应一个 Round。
- 历史不可变：正式提交的问题和答案不被后续轮次覆盖。
- 自动续接可选：支持时主动恢复 Agent；失败时无损降级为用户回复“已提交”。
- 本地优先：页面和服务仅监听 `127.0.0.1`，不依赖远程业务服务。
- 渐进降级：CDN、自动唤醒或浏览器启动失败时，核心 JSON 数据仍可使用。

## 3. 触发与技能组合

`ask-ui` 保持为独立技能，不替换 `grill-me` 或 `grilling`。

满足以下条件时可以自动调用：

- 当前轮存在两个及以上问题。
- 这些问题可以同时回答，没有未解决的前置依赖。
- 问题属于单选、多选或自由文本类型。
- 当前工作目录可写，并能够启动本地页面。

只有一个问题时继续在原对话中直接询问。页面启动失败时，调用方按原文本格式提问。

采用混合接入方式：

1. `ask-ui` 的描述声明通用自动触发条件。
2. `grilling` 等核心技能增加显式规则：当前 frontier 包含两个及以上问题时调用 `ask-ui`。
3. 其他技能可按相同协议组合调用。

当前 `brainstorming` 技能要求一次只问一个问题，因此在不修改其行为规则时通常不会触发 `ask-ui`。

## 4. 技能结构

规范源码目录：

```text
~/.agents/skills/ask-ui/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── scripts/
│   ├── ask-ui.mjs
│   └── adapters/
│       ├── claude-code.mjs
│       └── codex-app-server.mjs
├── assets/
│   └── app/
│       ├── index.html
│       ├── app.js
│       └── fallback.css
└── references/
    └── schema.md
```

使用单一规范源码，安装脚本按宿主创建目录联接或符号链接：

```text
~/.codex/skills/ask-ui   -> ~/.agents/skills/ask-ui
~/.claude/skills/ask-ui  -> ~/.agents/skills/ask-ui
```

Windows 使用目录联接，macOS/Linux 使用符号链接；链接不可用时退回复制安装并记录版本。

## 5. 运行时存储

运行数据默认保存在当前工作目录，不写入技能安装目录：

```text
<workspace>/.ask-ui/
├── index.json
└── sessions/
    └── <sessionId>/
        ├── session.json
        └── rounds/
            ├── 001/
            │   ├── questions.json
            │   └── answers.json
            └── 002/
                ├── questions.json
                └── answers.json
```

数据目录解析优先级：

1. 显式传入的 `--data-dir`。
2. 当前工作目录下的 `.ask-ui`。
3. 当前目录不可写时，回退到系统本地数据目录，并把实际路径明确返回给 Agent。

`.ask-ui/` 默认加入 `.gitignore`，避免需求回答和敏感信息被意外提交。

## 6. Session 与 Round

一次完整任务对应一个 Session。Agent 根据任务生成 Session 标题，例如“个人工作台需求确认收集”。同一任务中的补充问题和确认问题使用新的 Round，不创建新 Session。

示例：

```text
Session：个人工作台需求确认收集
├── Round 1：基础需求确认，10 题
├── Round 2：功能补充确认，5 题
└── Round 3：最终方案确认，2 题
```

Session 状态：

```text
active -> completed
       -> cancelled
```

Round 状态：

```text
waiting_for_user -> submitted -> processed
```

新 Round 必须保留相同 `sessionId`，递增 `roundNumber`，并通过 `basedOnRound` 标识它依据的上一轮。只有新任务、已完成任务或用户明确要求重新开始时才创建新 Session。

## 7. JSON 协议

### 7.1 QuestionSet

```json
{
  "schemaVersion": "1.0",
  "sessionId": "personal-workbench-a7k2",
  "roundNumber": 2,
  "title": "功能补充确认",
  "purpose": "根据第一轮回答补充功能需求",
  "basedOnRound": 1,
  "status": "waiting_for_user",
  "questions": [
    {
      "id": "q1",
      "type": "single",
      "title": "工作台首页结构",
      "description": "你更偏向哪种组织方式？",
      "required": true,
      "options": [
        {
          "id": "dashboard",
          "label": "仪表盘",
          "description": "集中展示核心状态"
        },
        {
          "id": "timeline",
          "label": "时间流",
          "description": "按时间展示任务和事件"
        }
      ],
      "recommendedOptionIds": ["dashboard"],
      "recommendationReason": "更适合快速查看整体状态",
      "allowOther": true
    }
  ]
}
```

v1 支持：

- `single`：单选，默认选中推荐答案。
- `multiple`：多选，默认选中一个或多个推荐答案，可限制最少和最多选择数。
- `text`：自由文本，可提供可编辑的 `recommendedDraft`。

### 7.2 AnswerSet

```json
{
  "schemaVersion": "1.0",
  "submissionId": "submit-b84f",
  "sessionId": "personal-workbench-a7k2",
  "roundNumber": 2,
  "submittedAt": "2026-08-10T15:30:00+08:00",
  "answers": [
    {
      "questionId": "q1",
      "selectedOptionIds": ["dashboard"],
      "customText": ""
    }
  ]
}
```

`questions.json` 和正式提交的 `answers.json` 不覆盖修改。后续补充或修正通过新 Round 记录。

## 8. 页面和交互

页面顶部展示 Session 标题、摘要、状态和累计问题数。Round 使用横向 Tabs：

```text
[第一轮 · 10题 ✓] [第二轮 · 5题 ✓] [第三轮 · 2题]
```

规则：

- 默认打开最新待回答 Round。
- 历史 Round 可快速切换，默认只读。
- 历史内容展示用户答案和当时的推荐答案。
- 当前 Round 允许编辑。
- Tab 较多时支持横向滚动。
- 提交前展示回答摘要。
- 提交成功后显示“请回到原会话回复：已提交”。
- Agent 创建下一轮后，页面刷新或轮询即可显示新 Tab。

页面使用原生 HTML、CSS 和 JavaScript，不引入前端构建流程。Tailwind Browser 使用 BootCDN 固定版本：

```html
<script src="https://cdn.bootcdn.net/ajax/libs/tailwindcss-browser/4.1.13/index.global.min.js"></script>
```

内置 `fallback.css`，CDN 不可用时保留基础布局、表单和按钮样式。不加载外部字体，图标使用内联 SVG。所有问题文本按纯文本渲染，禁止直接插入未转义 HTML。

## 9. 本地服务与命令

使用 Node.js 标准库实现本地服务，不依赖第三方运行时包。

主要命令：

```text
ask-ui create    创建 Session 或 Round
ask-ui serve     启动本地页面服务
ask-ui resume    读取已提交、尚未处理的答案
ask-ui status    查询 Session 状态
ask-ui complete  完成 Session
```

主要 HTTP 接口：

```text
GET  /api/sessions/:sessionId
POST /api/sessions/:sessionId/rounds/:roundNumber/draft
POST /api/sessions/:sessionId/rounds/:roundNumber/answers
GET  /api/sessions/:sessionId/status
```

页面只连接本地服务。浏览器不直接通过 `file://` 读写 JSON。草稿按 Session 和 Round 保存并在刷新后恢复；正式答案通过临时文件加原子重命名写入。

## 10. “已提交”恢复

用户在原对话中只需回复“已提交”，不需要输入 Session 编号。

恢复顺序：

1. 从当前对话最近的 `ask-ui-session` 标记取得 Session ID。
2. 如果上下文被压缩，查找当前工作目录中唯一已提交、尚未处理的 Session。
3. 多个候选时，根据当前对话主题、Session 标题、工作目录和提交时间推断。
4. 无法可靠区分时才列出候选让用户选择。

Agent 读取最新 `submitted` Round，生成下一轮或完成 Session。下一轮成功写入后再把上一轮标记为 `processed`。如果 Agent 在写入下一轮后异常退出，恢复脚本通过新 Round 的 `basedOnRound` 修复上一轮状态。重复回复“已提交”不得重复生成 Round。

## 11. 主动唤醒适配器

主动续接是可选能力，核心协议不要求 Agent 绑定。

```json
{
  "wake": {
    "mode": "auto",
    "provider": "claude-code",
    "sessionRef": "abc123",
    "cwd": "E:\\work\\personal-workbench"
  }
}
```

模式：

- `manual`：用户回复“已提交”。
- `auto`：页面提交后主动续接 Agent。
- `unavailable`：适配器不可用，降级为 `manual`。

### 11.1 Claude Code

通过 Claude Code Hooks 获取 `session_id`，然后使用官方恢复入口发送后续提示：

```bash
claude -p --resume <session-id> --output-format json \
  "Ask UI 第 2 轮已提交，请读取指定 answers.json 并继续。"
```

后台续接时不依赖原终端实时显示输出。Agent 生成下一 Round 后写回 `.ask-ui`，页面轮询并显示新 Tab。

### 11.2 Codex

只有在宿主明确提供 `threadId` 时启用实验适配器：

```text
thread/resume -> turn/start
```

无法取得 `threadId` 时不扫描、不猜测其他 Codex 任务，直接降级为 `manual`。实现优先使用 App Server 标准输入输出传输，不依赖实验性 WebSocket。

自动唤醒必须由用户明确开启，因为它会产生模型费用，并可能继续调用工具。

## 12. 安全与错误处理

- 服务只绑定 `127.0.0.1`。
- 页面 URL 使用随机访问令牌。
- 拒绝跨域请求和路径穿越。
- 限制请求体大小并校验 JSON Schema。
- JSON 损坏时保留原文件并报告绝对路径，不自动覆盖。
- 端口冲突时自动选择可用端口。
- 服务重启后从 `.ask-ui/sessions` 重建状态。
- CDN 失败时使用本地样式。
- 自动续接失败或超时不影响答案文件，并提示用户回复“已提交”。
- 不解析 Codex 或 Claude Code 的内部会话 JSONL 文件。
- 不把 API Key、访问令牌或认证信息写入 `.ask-ui`。

## 13. 测试计划

### 协议和状态

- 单选、多选、自由文本及推荐答案。
- 必填、选择数量和自定义答案校验。
- 三轮连续问答及 `basedOnRound` 关系。
- Session 完成、取消和重新开始。
- 重复提交与重复“已提交”的幂等性。
- Agent 异常退出后的状态修复。

### 页面和服务

- Round Tabs、只读历史和当前轮编辑。
- 草稿自动保存与刷新恢复。
- 原子写入和损坏 JSON 保护。
- 服务重启、随机端口和多个并发 Session。
- CDN 断网降级。
- 路径穿越、跨域、非法 JSON 和超大请求。

### Agent 适配

- Claude Code 真实 Session ID 的自动续接。
- Claude Code 自动续接失败后的手动降级。
- Codex App Server 在提供 `threadId` 时的续接。
- Codex 无 `threadId` 时不得推断任务。
- 多个待处理 Session 的主题匹配与人工兜底。

### 平台

- Windows、macOS、Linux 路径处理。
- 目录联接、符号链接和复制安装降级。
- Chrome、Edge 和宿主内置浏览器的基本交互。

## 14. v1 完成标准

- 任意兼容 Agent 能生成 QuestionSet 并打开 Ask UI。
- 用户可以完成单选、多选和自由文本问题，推荐答案默认生效。
- 同一 Session 可连续完成至少三轮问答，并通过 Tabs 查看只读历史。
- 用户回复“已提交”后，原 Agent 能准确恢复对应 Round。
- Claude Code 自动续接可用，失败时能可靠降级。
- Codex 在获得 `threadId` 时可通过 App Server 续接，无 ID 时安全降级。
- 页面断网、服务重启和重复提交不会丢失或重复处理正式答案。

## 15. 非目标

v1 不包括：

- 公网托管或多人协作服务。
- 用户账号、云同步和数据库。
- 排序、评分、日期、数字和矩阵题型。
- 修改已经被 Agent 处理的历史答案。
- 强制接管已打开的 Codex Desktop 或 Claude Code 终端界面。
- 解析第三方 Agent 的内部会话文件。
