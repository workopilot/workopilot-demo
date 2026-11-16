# Ask UI 提交后直接返回 Agent 设计

## 目标

让 Codex App、Claude Code 及其他能够执行本地命令的 Agent 在同一次工具调用中等待用户提交，并在提交后直接收到答案 JSON、继续原工作流。保留现有分离式会话作为运行环境不支持长时间工具调用时的降级方式。

## 方案选择

采用“前台等待”为主路径，不把重新唤醒 Codex 或 Claude 进程作为主路径：

- 主路径：新增 `ask` 命令，启动临时本地服务并保持进程运行；提交后向 stdout 输出完整结果并退出。
- 降级路径：保留现有 `create`、`resume` 和用户回复“已提交”的流程。
- 可选增强：保留现有 Codex App Server 与 Claude Code wake 适配器，但不在 `ask` 模式重复触发，以免产生两个并发 Agent Turn。

## 命令接口

```text
node <SKILL_DIR>/scripts/ask-ui.mjs ask --input <questions.json>
```

可继续支持 `--data-dir`、`--no-open`，并允许测试或特殊环境指定 `--port`。过程状态和备用 URL 输出到 stderr；提交后的单个结构化 JSON 结果输出到 stdout，便于 Agent 稳定解析。

成功结果沿用现有 `resume` 数据形状：

```json
{
  "status": "submitted",
  "sessionId": "...",
  "roundNumber": 1,
  "questionsPath": ".../questions.json",
  "answersPath": ".../answers.json",
  "questions": {},
  "answers": {}
}
```

## 运行流程

1. 校验输入并创建或追加 Round，数据仍写入工作区 `.ask-ui` 或现有系统降级目录。
2. 在 `127.0.0.1` 随机端口启动仅服务本次等待的临时 HTTP 服务，不覆盖持久服务的 `server.json`。
3. 打开带随机访问令牌的问卷 URL，并保持 `ask` 进程等待。
4. 用户提交后先原子写入答案，再解析当前 Round 的完整提交结果。
5. 页面显示“答案已返回 Agent”，临时服务短暂延迟后关闭。
6. `ask` 将结构化结果写到 stdout 并正常退出；原 Agent 的工具调用随即返回并继续。

## 会话与多轮

- 继续使用现有 Session/Round 模型，不限制轮数。
- 后续问题沿用同一 `sessionId` 和 `basedOnRound`，每轮均可通过新的 `ask` 调用直接返回。
- 已提交 Round 保持只读；创建下一轮时将上一轮转为 `processed`。
- `ask` 模式不触发 wake 适配器，避免同一提交同时恢复两个执行流。

## 关闭、异常与降级

- 进程收到终止信号时关闭临时服务，但保留已写入的 Session 和草稿。
- 浏览器未能自动打开时，在 stderr 提供 URL，Agent 可转交给用户。
- 提交失败时页面保留草稿并允许重试，不输出伪成功结果。
- 长时间工具调用不受宿主支持、命令被中断或用户需要稍后作答时，Agent 改用原有 `create` 分离模式；用户提交后回复“已提交”，再由 `resume` 读取。
- 已配置 wake 的分离模式仍可尝试主动恢复；失败时继续保留答案并退回手动恢复。

## 页面文案

- `ask` 模式提交前提示“提交后将自动返回 Agent，无需回复已提交”。
- 成功提交后提示“答案已返回 Agent，可以回到会话查看后续处理”。
- `create` 降级模式继续提示用户回到会话回复“已提交”。

## 验证

- 增加前台等待集成测试：启动 `ask --no-open`、提交答案、断言进程退出且 stdout 为完整 JSON。
- 验证答案先持久化、后返回，重复提交不产生第二次 Agent 返回。
- 验证 `ask` 模式不会触发 wake，分离模式仍保持现有行为。
- 验证同一 Session 的第二轮能够再次通过 `ask` 返回，并正确处理上一轮状态。
- 运行现有自测、JS 语法检查和技能快速校验。
