# Color Palette

本项目现已调整为通过 Cloudflare Worker 提供静态页面。

## 本地开发

- 安装依赖：`pnpm install`
- 前端调试（Vite 开发服务器）：`pnpm dev`
- Worker 预览（Cloudflare 模拟环境，默认端口 8787）：`pnpm cf:preview`
  - 命令会先执行 `pnpm build`，随后由 Wrangler 将 `dist/` 中的资源绑定到本地 Worker。

## 部署到 Cloudflare Worker

1. 确认已在本机登录 Cloudflare：`pnpm exec wrangler login`
2. 执行 `pnpm cf:deploy`
3. 首次部署会提示选择或创建 Worker 名称，可与 `wrangler.toml` 中的 `name` 保持一致

部署脚本会自动执行 `pnpm build` 并将构建产物作为静态资源上传，同时发布 `worker/index.js` 中的 Worker 入口，用于处理请求并回退到 `index.html`。

### 持续部署（GitHub Actions）

- 仓库内的 `.github/workflows/deploy.yml` 会在推送到 `main` 分支或手动触发 `workflow_dispatch` 时自动执行 `pnpm cf:deploy`。
- 启用工作流前，请在 GitHub 仓库的 Secrets & variables → Actions 中配置：
  - `CLOUDFLARE_ACCOUNT_ID`：你的 Cloudflare 账户 ID。
  - `CLOUDFLARE_API_TOKEN`：具备 `Account · Workers Scripts · Edit` 与 `Account · Workers KV Storage · Edit` 权限的 API Token。
- 如需暂停自动部署，可在工作流文件中调整分支触发条件，或在 GitHub Actions 面板中暂时禁用该工作流。
- 当上述机密已配置后，推送到 `main` 即会自动触发部署，无需额外执行命令。

## 配置说明

- `wrangler.toml` 定义 Worker 名称、入口文件和静态资源目录。
- `worker/index.js` 负责将请求转发给静态资源，并对非文件路径回退到首页。
- `Dockerfile`、`nginx.conf.template` 等 Cloud Run 相关文件已移除；若需恢复 GCP 部署，可从历史提交中找回。
