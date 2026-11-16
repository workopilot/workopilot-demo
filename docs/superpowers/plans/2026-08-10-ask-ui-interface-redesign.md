# Ask UI Interface Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Ask UI 改造成参考图风格的高密度多轮问答工作台，提供固定提交栏、独立滚动区、正式“其他”选项和可持久化亮暗主题。

**Architecture:** 保持现有零依赖 Node HTTP 服务和 Session/Round JSON 文件结构。服务端只扩展 `__other__` 保留选项的校验语义；浏览器端继续使用原生 DOM API，将页面重组为固定视口网格，并通过 CSS 变量统一亮暗主题。

**Tech Stack:** Node.js 22、原生 JavaScript、HTML、CSS、Tailwind Browser CDN 及本地 fallback CSS。

## Global Constraints

- 页面根容器使用 `100dvh`，仅中间问题区纵向滚动。
- 顶部主题区、轮次 Tab 和底部提交栏始终可见。
- 提交必读说明固定展示，不要求用户勾选。
- `__other__` 仅在 `allowOther: true` 的题目中合法，补充文字继续使用 `customText`。
- 首次主题跟随 `prefers-color-scheme`，用户选择写入 `localStorage`。
- QuestionSet 和 AnswerSet 字段结构保持不变，旧 Session 必须兼容。
- 不增加运行时 npm 依赖。

---

### Task 1: 扩展“其他”选项协议与自动测试

**Files:**

- Modify: `C:/Users/jakyo/.agents/skills/ask-ui/scripts/ask-ui.mjs`
- Modify: `C:/Users/jakyo/.agents/skills/ask-ui/scripts/self-test.mjs`
- Modify: `C:/Users/jakyo/.agents/skills/ask-ui/references/schema.md`

**Interfaces:**

- Consumes: `Question.allowOther`、`Answer.selectedOptionIds`、`Answer.customText`。
- Produces: `OTHER_OPTION_ID = '__other__'` 及兼容旧 `customText` 答案的标准化结果。

- [ ] **Step 1: 添加失败用例**

在 `self-test.mjs` 的第一轮答案中加入允许“其他”的题目，提交：

```js
{
  questionId: 'channel',
  selectedOptionIds: ['__other__'],
  customText: '桌面通知',
}
```

同时提交一个不允许“其他”的题目并断言 HTTP 状态为 `422`。

- [ ] **Step 2: 运行测试并确认失败**

Run:

```powershell
node C:\Users\jakyo\.agents\skills\ask-ui\scripts\self-test.mjs
```

Expected: 合法“其他”答案被报告为 unknown option，测试失败。

- [ ] **Step 3: 实现保留选项校验**

在 `ask-ui.mjs` 定义：

```js
const OTHER_OPTION_ID = '__other__';
```

校验选择项时，仅当 `question.allowOther` 为真才把该值加入允许集合；选择数量使用 `selectedOptionIds.length`，当旧答案只有非空 `customText` 时按一个“其他”选择兼容计算，避免同时重复计数。

- [ ] **Step 4: 更新协议说明**

在 `schema.md` 明确：

```json
{
  "questionId": "channel",
  "selectedOptionIds": ["__other__"],
  "customText": "桌面通知"
}
```

并说明旧版只含 `customText` 的答案会继续按“其他”展示。

- [ ] **Step 5: 运行自测**

Run: `node C:\Users\jakyo\.agents\skills\ask-ui\scripts\self-test.mjs`

Expected: `ask-ui self-test passed`。

### Task 2: 建立固定视口与亮暗主题外壳

**Files:**

- Modify: `C:/Users/jakyo/.agents/skills/ask-ui/assets/app/index.html`
- Modify: `C:/Users/jakyo/.agents/skills/ask-ui/assets/app/fallback.css`

**Interfaces:**

- Consumes: 现有 `#app`、确认弹窗和 Toast DOM 节点。
- Produces: `data-theme` 主题状态、`.app-shell` 四区网格、`.question-scroll` 和 `.submit-dock` 样式契约。

- [ ] **Step 1: 更新静态页面主题入口**

在主脚本加载前读取 `localStorage.getItem('ask-ui-theme')`；无保存值时使用 `matchMedia('(prefers-color-scheme: dark)')`，把结果写到 `document.documentElement.dataset.theme`，避免首屏闪烁。

- [ ] **Step 2: 建立 CSS 语义变量**

亮色定义 `--page`、`--surface`、`--surface-muted`、`--text`、`--muted`、`--border`、`--accent`、`--accent-soft`、`--shadow`；`[data-theme='dark']` 覆盖同一组变量。所有页面、输入、弹窗、Toast 和历史状态只引用这些变量。

- [ ] **Step 3: 建立四区固定布局**

核心规则为：

```css
.app-shell {
  height: 100dvh;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  overflow: hidden;
}

.question-scroll {
  min-height: 0;
  overflow-y: auto;
}
```

底栏使用独立 `.submit-dock`，不放入问题滚动容器。

- [ ] **Step 4: 增加响应式与可访问状态**

桌面选项最多四列，中屏两列，手机单列；为按钮、选项和输入补充 `:focus-visible`，为 `prefers-reduced-motion` 关闭非必要过渡。

- [ ] **Step 5: 运行语法检查**

Run: `node --check C:\Users\jakyo\.agents\skills\ask-ui\assets\app\app.js`

Expected: 无输出且退出码为 `0`。

### Task 3: 重构问题渲染、主题和固定提交栏交互

**Files:**

- Modify: `C:/Users/jakyo/.agents/skills/ask-ui/assets/app/app.js`

**Interfaces:**

- Consumes: Task 1 的 `__other__` 语义和 Task 2 的 CSS 类名。
- Produces: `setTheme(theme)`、`answeredQuestionCount(round)`、正式“其他”选项渲染，以及分离的滚动内容与提交栏。

- [ ] **Step 1: 实现主题切换**

新增：

```js
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('ask-ui-theme', theme);
  document
    .querySelector('meta[name="color-scheme"]')
    ?.setAttribute('content', theme);
}
```

头部渲染“浅色主题”和“深色主题”两个互斥按钮，设置 `aria-pressed` 并调用该函数。

- [ ] **Step 2: 重组页面渲染边界**

`render()` 依次创建主题头部、轮次 Tab、`.question-scroll` 内的轮次内容和 `.submit-dock`。历史轮次底栏展示只读状态，待答轮次底栏展示必读说明、回答计数、草稿状态和提交按钮。

- [ ] **Step 3: 实现回答计数**

`answeredQuestionCount(round)` 对文本题检查 `customText.trim()`；选择题检查 `selectedOptionIds.length`，并兼容旧数据中只有 `customText` 的“其他”答案。底栏显示 `已回答 X / Y 题`。

- [ ] **Step 4: 实现正式“其他”选项**

选择“其他”时把 `__other__` 写入 `selectedOptionIds`；聚焦补充输入时自动选中；取消选择时移除保留值并清空 `customText`。单选题选择普通项时同时移除 `__other__`，多选题允许“其他”与普通项并存。

- [ ] **Step 5: 更新提交校验与摘要**

客户端数量校验不得把 `__other__` 和它的 `customText` 重复计算；答案摘要把保留值显示为“其他”，有补充文字时显示为 `其他：补充内容`。

- [ ] **Step 6: 验证核心流程**

创建包含单选、多选、文本和 `allowOther` 的两轮 Session，确认草稿保存、提交弹窗、只读历史与下一轮自动切换均正常。

### Task 4: 技能校验与浏览器设计验收

**Files:**

- Modify: `C:/Users/jakyo/.agents/skills/ask-ui/SKILL.md`（仅在命令或行为说明需要同步时）
- Create: `C:/Users/jakyo/.agents/skills/ask-ui/design-qa.md`

**Interfaces:**

- Consumes: 完整 Ask UI 技能和用户参考截图。
- Produces: 通过的技能校验、自测及亮暗主题设计 QA 记录。

- [ ] **Step 1: 运行静态与技能校验**

Run:

```powershell
Get-ChildItem C:\Users\jakyo\.agents\skills\ask-ui -Recurse -File |
  Where-Object { $_.Extension -in '.mjs', '.js' } |
  ForEach-Object { node --check $_.FullName }
$env:PYTHONUTF8='1'
python C:\Users\jakyo\.codex\skills\.system\skill-creator\scripts\quick_validate.py C:\Users\jakyo\.agents\skills\ask-ui
node C:\Users\jakyo\.agents\skills\ask-ui\scripts\self-test.mjs
```

Expected: 所有命令退出码为 `0`，输出包含 `Skill is valid!` 和 `ask-ui self-test passed`。

- [ ] **Step 2: 浏览器验收亮色主题**

使用真实两轮 Session 打开页面，在参考图同类桌面宽度检查：头部和 Tab 可见、问题区独立滚动、底栏可见、选项网格紧凑、“其他”可选并可补充。

- [ ] **Step 3: 浏览器验收暗色主题与持久化**

切换暗色，检查页面、选项、输入、弹窗、Toast 和底栏对比度；刷新页面后主题保持暗色，再切回亮色确认状态同步。

- [ ] **Step 4: 浏览器验收提交路径**

选择“其他”但不填写补充，提交并检查 `answers.json` 包含 `selectedOptionIds: ['__other__']`；再用含补充文字的答案验证 `customText`。确认历史轮次只读，第二轮 Tab 可用。

- [ ] **Step 5: 编写设计 QA 报告**

在 `design-qa.md` 记录参考图与实现截图对比、亮暗模式、响应式、交互和控制台结果。P0/P1/P2 均关闭后以 `final result: passed` 结尾。
