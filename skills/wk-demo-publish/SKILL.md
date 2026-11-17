---
name: wk-demo-publish
description: 将喔壳 Demo 构建产物发布到 File Browser，初始化本地发布凭据并验证公网访问；用户要求发布、上传或更新本项目演示环境时使用。
---

# 喔壳 Demo 发布

使用本技能的 `scripts/deploy.py`，无需依赖个人目录中的其他技能。命令从仓库根目录运行；Windows 可用 `py -3` 替代 `python`。

## 首次发布的本地配置

脚本从**仓库根目录 `.env`** 读取配置。技能目录、脚本、示例和 Git 提交中均不包含真实账号、密码或 Token；不要复制个人技能的 `.env`。

| 字段 | 用途 |
| --- | --- |
| `WK_DEMO_SUBDIRECTORY` | 已有部署子目录；当前为 `wkdemo`，空值代表根目录 |
| `FILEBROWSER_URL` | 上传 API 地址，默认 `http://116.204.66.32:10000` |
| `FILEBROWSER_USERNAME` | 首次配置时由用户输入，无内置账号 |
| `FILEBROWSER_PASSWORD` | 首次配置时隐藏输入，无内置密码 |
| `FILEBROWSER_PUBLIC_URL` | 公网访问域名，默认 `https://dev.workopilot.com` |

- 发布前检查配置是否齐全，只输出缺失字段名，不输出字段值或登录 Token。
- 缺少用户名或密码时，请用户在本地交互终端运行：

  ```bash
  python skills/wk-demo-publish/scripts/deploy.py --configure
  ```

  密码通过 `getpass` 隐藏输入；配置只保存到根目录 `.env`，不要求用户把密码发送到聊天中。脚本在交互终端首次发布时也会自动询问缺失配置。无交互输入时明确退出，待配置完成后继续。
- 已有发布配置直接复用，只补充缺失字段；保留现有 `.env` 的内容，尤其不能覆盖 `WK_DEMO_SUBDIRECTORY`。发布凭据补充与 AGENTS.md 中部署子目录初始化是两个独立流程。
- `.env` 中没有 `WK_DEMO_SUBDIRECTORY` 时，先按根目录 AGENTS.md 确认子目录，再发布；不自行改名。
- 修改凭据时由用户编辑本地 `.env`。不从全局技能自动迁移账号密码，不把凭据放在命令参数、日志、构建产物或网页中。

## 发布流程

1. 根据用户要求确定发布的是当前工作区还是指定提交。如果有未提交修改，说明构建使用的版本；不要将发布请求扩大为提交、推送或修改其他站点。
2. 若源码或配置变化，先执行 `pnpm build:antd` 并确认成功。仅发布 `apps/web-antd/dist/`，不上传源码目录或 `.env`。已有与本次源码一致且验证过的产物可复用。
3. 默认发布到 `.env` 中的子目录，无需另写固定路径：

   ```bash
   python skills/wk-demo-publish/scripts/deploy.py
   ```

   需要按用户指定的目标上传单文件或目录时：

   ```bash
   python skills/wk-demo-publish/scripts/deploy.py <本地路径> <远程路径>
   python skills/wk-demo-publish/scripts/deploy.py --list /wkdemo
   ```

4. 默认覆盖同名文件、保留其他文件，目录中的 HTML 最后上传。只有用户要求完整替换指定非根目录时才使用 `--clean`；禁止清空服务根目录。删除失败或任一上传失败时脚本以非零状态退出，不宣称发布成功，不自动改换目标或清空重试。
5. 上传、登录和远程资源核对使用 `FILEBROWSER_URL` 的 API 服务，不把上传地址换成公网域名。通过 `--list` 或脚本的资源查询函数核对远程文件；目录发布核对文件数量和大小，增量发布核对本次变更文件。
6. 请求公网入口，确认 HTML 与本地产物一致，并检查所引用的脚本、样式与关键图片可访问；用浏览器验证本次变更。若公网验证失败，区分“上传成功”和“公网验证失败”，不要重复盲目上传。

## 返回访问地址

远程路径直接映射到 `FILEBROWSER_PUBLIC_URL`，不附加 `/files/` 或 `/api/`。最终必须给出可点击的完整页面地址，并说明验证结果。

当前子目录的入口示例：

- `https://dev.workopilot.com/wkdemo/index.html#/app/mate/employees`
- `https://dev.workopilot.com/wkdemo/index.html#/app/mate/help`

实际链接按本次 `.env` 与上传路径生成，对路径中的中文、空格进行 URL 编码；这些示例不代表已经发布成功。
